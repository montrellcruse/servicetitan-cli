import {afterEach, describe, expect, it, vi} from 'vitest'

import AuthLogin from '../../src/commands/auth/login.js'
import * as auth from '../../src/lib/auth.js'
import {ServiceTitanApiError, ServiceTitanClient} from '../../src/lib/client.js'
import * as configModule from '../../src/lib/config.js'
import * as prompts from '../../src/lib/prompts.js'
import {CONFIG_STUB, createTestContext} from '../helpers.js'

/**
 * Auth error path tests — exercises all failure branches in AuthLogin
 * and the auth library itself.
 *
 * BaseCommand.catch() writes errors to STDERR (not stdout) and then calls
 * this.exit(1) which throws oclif's EEXIT error. We intercept stderr and
 * swallow EEXIT so tests can assert on the rendered output.
 */

/** Strip ANSI escape codes from any string */
function stripAnsi(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/\x1B\[[0-9;]*m/g, '')
}

/** Run an oclif command and capture both stdout and stderr output strings. */
async function runCapturing(fn: () => Promise<void>): Promise<{stdout: string; stderr: string}> {
  let stdoutOutput = ''
  let stderrOutput = ''

  const outSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
    stdoutOutput += String(chunk)
    return true
  })

  const errSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
    stderrOutput += String(chunk)
    return true
  })

  try {
    await fn()
  } catch (err) {
    // Swallow oclif's EEXIT — it's the expected exit-after-error signal
    const e = err as {code?: string}
    if (e?.code !== 'EEXIT') {
      throw err
    }
  } finally {
    outSpy.mockRestore()
    errSpy.mockRestore()
  }

  return {stdout: stdoutOutput, stderr: stderrOutput}
}

describe('auth error paths', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── Shared prompt setup helpers ────────────────────────────────────────────

  function mockLoginPrompts(overrides: {
    appKey?: string
    clientId?: string
    clientSecret?: string
    env?: string
    profile?: string
    tenantId?: string
  } = {}): void {
    vi.spyOn(prompts, 'promptText')
      .mockResolvedValueOnce(overrides.profile ?? 'acme')
      .mockResolvedValueOnce(overrides.env ?? 'production')
      .mockResolvedValueOnce(overrides.clientId ?? 'client-id')
      .mockResolvedValueOnce(overrides.appKey ?? 'app-key')
      .mockResolvedValueOnce(overrides.tenantId ?? '12345')
    vi.spyOn(prompts, 'promptSecret').mockResolvedValue(overrides.clientSecret ?? 'client-secret')
  }

  // ─── 1. Invalid credentials (401) ──────────────────────────────────────────

  it('shows a meaningful error message when credentials are rejected (401)', async () => {
    createTestContext({config: {...CONFIG_STUB, profiles: {}}})
    mockLoginPrompts()

    vi.spyOn(ServiceTitanClient.prototype, 'get').mockRejectedValue(
      new ServiceTitanApiError('Unauthorized', 401, '/settings/v2/tenant/12345/business-units'),
    )

    const {stderr} = await runCapturing(() => AuthLogin.run([], process.cwd()))

    const rendered = stripAnsi(stderr)
    expect(rendered).toMatch(/Client ID|Client Secret|App Key/i)
  })

  it('reports the specific 401 error text from the login command', async () => {
    createTestContext({config: {...CONFIG_STUB, profiles: {}}})
    mockLoginPrompts()

    vi.spyOn(ServiceTitanClient.prototype, 'get').mockRejectedValue(
      new ServiceTitanApiError('Unauthorized', 401, '/settings/v2/tenant/12345/business-units'),
    )

    const {stderr} = await runCapturing(() => AuthLogin.run([], process.cwd()))

    const rendered = stripAnsi(stderr)
    expect(rendered).toContain('Verify your Client ID')
  })

  // ─── 2. Wrong tenant / unauthorized app key (403) ──────────────────────────

  it('shows a tenant/app-key error message when the API returns 403', async () => {
    createTestContext({config: {...CONFIG_STUB, profiles: {}}})
    mockLoginPrompts({appKey: 'bad-key', tenantId: 'wrong-tenant'})

    vi.spyOn(ServiceTitanClient.prototype, 'get').mockRejectedValue(
      new ServiceTitanApiError('Forbidden', 403, '/settings/v2/tenant/wrong-tenant/business-units'),
    )

    const {stderr} = await runCapturing(() => AuthLogin.run([], process.cwd()))

    const rendered = stripAnsi(stderr)
    expect(rendered).toMatch(/App Key|tenant|authorized/i)
  })

  it('reports the specific 403 error text about tenant authorization', async () => {
    createTestContext({config: {...CONFIG_STUB, profiles: {}}})
    mockLoginPrompts()

    vi.spyOn(ServiceTitanClient.prototype, 'get').mockRejectedValue(
      new ServiceTitanApiError('Forbidden', 403, '/settings/v2/tenant/12345/business-units'),
    )

    const {stderr} = await runCapturing(() => AuthLogin.run([], process.cwd()))

    const rendered = stripAnsi(stderr)
    expect(rendered).toContain('Access denied')
  })

  // ─── 3. Keytar unavailable (keychain failure) ───────────────────────────────

  it('surfaces the original keytar error message when keychain is unavailable', async () => {
    createTestContext({config: {...CONFIG_STUB, profiles: {}}})
    mockLoginPrompts()

    vi.spyOn(ServiceTitanClient.prototype, 'get').mockResolvedValue({data: []})
    vi.spyOn(configModule, 'saveProfile').mockResolvedValue()
    vi.spyOn(auth, 'saveCredentials').mockRejectedValue(
      new Error('No secret service: Unable to open connection to the secret service'),
    )

    const {stderr} = await runCapturing(() => AuthLogin.run([], process.cwd()))

    const rendered = stripAnsi(stderr)
    expect(rendered).toContain('No secret service')
  })

  it('does not swallow keytar errors silently', async () => {
    createTestContext({config: {...CONFIG_STUB, profiles: {}}})
    mockLoginPrompts()

    vi.spyOn(ServiceTitanClient.prototype, 'get').mockResolvedValue({data: []})
    vi.spyOn(configModule, 'saveProfile').mockResolvedValue()
    vi.spyOn(auth, 'saveCredentials').mockRejectedValue(
      new Error('Failed to unlock the collection'),
    )

    const {stderr} = await runCapturing(() => AuthLogin.run([], process.cwd()))

    const rendered = stripAnsi(stderr)
    expect(rendered).toContain('Failed to unlock the collection')
  })

  // ─── 4. promptSecret on non-TTY stdin ──────────────────────────────────────

  it('throws a descriptive error when promptSecret is called in non-TTY mode', async () => {
    const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')

    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: false,
    })

    try {
      const {promptSecret} = await import('../../src/lib/prompts.js')
      await expect(promptSecret('Client Secret')).rejects.toThrow(
        /non-interactive|ST_CLIENT_ID|ST_CLIENT_SECRET/,
      )
    } finally {
      if (originalIsTTY) {
        Object.defineProperty(process.stdin, 'isTTY', originalIsTTY)
      } else {
        delete (process.stdin as {isTTY?: boolean}).isTTY
      }
    }
  })

  it('mentions environment variables in the non-TTY error', async () => {
    const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')

    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: false,
    })

    try {
      const {promptSecret} = await import('../../src/lib/prompts.js')
      const err = await promptSecret('Client Secret').catch(e => e)
      expect((err as Error).message).toContain('ST_CLIENT_ID')
      expect((err as Error).message).toContain('ST_CLIENT_SECRET')
    } finally {
      if (originalIsTTY) {
        Object.defineProperty(process.stdin, 'isTTY', originalIsTTY)
      } else {
        delete (process.stdin as {isTTY?: boolean}).isTTY
      }
    }
  })

  // ─── 5. Token refresh failure during API call ──────────────────────────────

  it('surfaces a clear error when token refresh fails during an API call', async () => {
    const client = new ServiceTitanClient({
      appKey: 'app-key',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      environment: 'integration',
      tenantId: '12345',
    })

    // Force token fetch to fail (auth server down / creds revoked)
    const privateClient = client as unknown as {fetchToken: () => Promise<string>}
    vi.spyOn(privateClient, 'fetchToken').mockRejectedValue(
      new Error('connect ECONNREFUSED auth-integration.servicetitan.io:443'),
    )

    await expect(client.get('/customers')).rejects.toThrow(/ECONNREFUSED|connect/)
  })

  it('clears the token cache on 401 and attempts one refresh before retrying', async () => {
    const client = new ServiceTitanClient({
      appKey: 'app-key',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      environment: 'integration',
      tenantId: '12345',
    })

    const privateClient = client as unknown as {
      http: {request: ReturnType<typeof vi.fn>}
      fetchToken: () => Promise<string>
      tokenCache: {accessToken: string; expiresAt: number} | undefined
    }

    // Pre-seed a valid-looking token
    privateClient.tokenCache = {
      accessToken: 'stale-token',
      expiresAt: Date.now() + 3_600_000,
    }

    // fetchToken returns a fresh token on forced refresh
    vi.spyOn(privateClient, 'fetchToken').mockResolvedValue('fresh-token')

    // The retry request succeeds
    vi.spyOn(privateClient.http, 'request').mockResolvedValue({data: {data: []}})

    const handleError = (client as unknown as {
      handleResponseError: (e: unknown) => Promise<unknown>
    }).handleResponseError.bind(client)

    const {AxiosHeaders: AH} = await import('axios')
    const error401 = {
      config: {
        __stRetried401: false,
        headers: AH.from({'Authorization': 'Bearer stale-token', 'ST-App-Key': 'app-key'}),
        method: 'get',
        url: '/crm/v2/tenant/12345/customers',
      },
      isAxiosError: true,
      message: 'Unauthorized',
      name: 'AxiosError',
      response: {
        config: {headers: AH.from({})},
        data: {message: 'Token expired'},
        headers: {},
        status: 401,
        statusText: 'Unauthorized',
      },
      toJSON: () => ({}),
    }

    await expect(handleError(error401)).resolves.toBeDefined()
    expect(privateClient.fetchToken).toHaveBeenCalledTimes(1)
  })

  // ─── 6. getCredentials env var fallback ────────────────────────────────────

  it('returns env-var credentials when ST_CLIENT_ID and ST_CLIENT_SECRET are set', async () => {
    const {getCredentials} = await import('../../src/lib/auth.js')
    const originalClientId = process.env.ST_CLIENT_ID
    const originalClientSecret = process.env.ST_CLIENT_SECRET

    process.env.ST_CLIENT_ID = 'env-client-id'
    process.env.ST_CLIENT_SECRET = 'env-client-secret'

    try {
      const creds = await getCredentials('any-profile')
      expect(creds).toEqual({
        clientId: 'env-client-id',
        clientSecret: 'env-client-secret',
      })
    } finally {
      if (originalClientId === undefined) {
        delete process.env.ST_CLIENT_ID
      } else {
        process.env.ST_CLIENT_ID = originalClientId
      }

      if (originalClientSecret === undefined) {
        delete process.env.ST_CLIENT_SECRET
      } else {
        process.env.ST_CLIENT_SECRET = originalClientSecret
      }
    }
  })

  it('returns null when no credentials exist in the keychain and no env vars are set', async () => {
    const {getCredentials} = await import('../../src/lib/auth.js')

    // Ensure no env vars are set
    const originalClientId = process.env.ST_CLIENT_ID
    const originalClientSecret = process.env.ST_CLIENT_SECRET
    delete process.env.ST_CLIENT_ID
    delete process.env.ST_CLIENT_SECRET

    try {
      // The mock keytar store is empty by default (each test file gets a fresh module)
      const creds = await getCredentials('nonexistent-profile')
      expect(creds).toBeNull()
    } finally {
      if (originalClientId !== undefined) process.env.ST_CLIENT_ID = originalClientId
      if (originalClientSecret !== undefined) process.env.ST_CLIENT_SECRET = originalClientSecret
    }
  })
})
