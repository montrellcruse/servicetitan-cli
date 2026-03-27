import {afterEach, describe, expect, it, vi} from 'vitest'

import AuthLogin from '../../src/commands/auth/login.js'
import AuthLogout from '../../src/commands/auth/logout.js'
import AuthStatus from '../../src/commands/auth/status.js'
import AuthToken from '../../src/commands/auth/token.js'
import * as auth from '../../src/lib/auth.js'
import {ServiceTitanClient} from '../../src/lib/client.js'
import * as configModule from '../../src/lib/config.js'
import * as prompts from '../../src/lib/prompts.js'
import {CONFIG_STUB, createTestContext, stripAnsi} from '../helpers.js'

describe('auth commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints a no-profile message for auth status when no profile is configured', async () => {
    const {output} = createTestContext({
      config: {
        ...CONFIG_STUB,
        default: 'default',
        profiles: {},
      },
    })
    const getCredentialsSpy = vi.spyOn(auth, 'getCredentials')

    await AuthStatus.run([], process.cwd())

    expect(stripAnsi(output())).toContain('No active profile configured')
    expect(getCredentialsSpy).not.toHaveBeenCalled()
  })

  it('renders the configured profile in auth status output', async () => {
    const {output} = createTestContext({
      config: {
        ...CONFIG_STUB,
        default: 'acme-int',
        profiles: {
          'acme-int': {
            appKey: 'app-key',
            environment: 'integration',
            tenantId: '12345',
          },
        },
      },
      profileName: 'acme-int',
    })

    vi.spyOn(auth, 'getCredentials').mockResolvedValue({
      clientId: 'client-id',
      clientSecret: 'client-secret',
    })

    await AuthStatus.run([], process.cwd())

    const rendered = stripAnsi(output())
    expect(rendered).toContain('acme-int')
    expect(rendered).toContain('integration')
    expect(rendered).toContain('12345')
  })

  it('prints a no-profile message for auth logout when there is nothing to remove', async () => {
    const {output} = createTestContext()
    const getActiveProfileNameSpy = vi.spyOn(configModule, 'getActiveProfileName').mockResolvedValue(null)
    const deleteCredentialsSpy = vi.spyOn(auth, 'deleteCredentials').mockResolvedValue()
    const deleteProfileSpy = vi.spyOn(configModule, 'deleteProfile').mockResolvedValue()

    await AuthLogout.run([], process.cwd())

    expect(getActiveProfileNameSpy).toHaveBeenCalled()
    expect(deleteCredentialsSpy).not.toHaveBeenCalled()
    expect(deleteProfileSpy).not.toHaveBeenCalled()
    expect(stripAnsi(output())).toContain('Nothing to remove')
  })

  it('authenticates and persists a prompted profile', async () => {
    const {output} = createTestContext({
      config: {
        ...CONFIG_STUB,
        profiles: {},
      },
    })
    const promptTextSpy = vi
      .spyOn(prompts, 'promptText')
      .mockResolvedValueOnce('acme')
      .mockResolvedValueOnce('integration')
      .mockResolvedValueOnce('client-id')
      .mockResolvedValueOnce('app-key')
      .mockResolvedValueOnce('12345')
    const promptSecretSpy = vi.spyOn(prompts, 'promptSecret').mockResolvedValue('client-secret')
    const getSpy = vi.spyOn(ServiceTitanClient.prototype, 'get').mockResolvedValue({data: []})
    const saveProfileSpy = vi.spyOn(configModule, 'saveProfile').mockResolvedValue()
    const saveCredentialsSpy = vi.spyOn(auth, 'saveCredentials').mockResolvedValue()

    await AuthLogin.run([], process.cwd())

    expect(promptTextSpy).toHaveBeenCalledTimes(5)
    expect(promptSecretSpy).toHaveBeenCalledWith('Client Secret')
    expect(getSpy).toHaveBeenCalledWith('/settings/v2/tenant/{tenant}/business-units')
    expect(saveProfileSpy).toHaveBeenCalledWith('acme', {
      appKey: 'app-key',
      environment: 'integration',
      tenantId: '12345',
    })
    expect(saveCredentialsSpy).toHaveBeenCalledWith('acme', 'client-id', 'client-secret')
    expect(stripAnsi(output())).toContain('Authenticated profile "acme"')
  })

  it('prints the current bearer token', async () => {
    const ensureTokenSpy = vi.fn().mockResolvedValue('bearer-token')
    const {output} = createTestContext({
      client: {
        ensureToken: ensureTokenSpy,
      },
    })

    await AuthToken.run([], process.cwd())

    expect(ensureTokenSpy).toHaveBeenCalledTimes(1)
    expect(output()).toBe('bearer-token\n')
  })
})
