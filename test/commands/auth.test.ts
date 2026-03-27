import {afterEach, describe, expect, it, vi} from 'vitest'

import AuthLogout from '../../src/commands/auth/logout.js'
import AuthStatus from '../../src/commands/auth/status.js'
import * as auth from '../../src/lib/auth.js'
import * as configModule from '../../src/lib/config.js'
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
})
