import keytar from 'keytar'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  deleteCredentials,
  getCredentials,
  LEGACY_SERVICE_NAMES,
  saveCredentials,
  SERVICE_NAME,
} from '../../src/lib/auth.js'

describe('auth keychain storage', () => {
  afterEach(() => {
    delete process.env.ST_CLIENT_ID
    delete process.env.ST_CLIENT_SECRET
    vi.restoreAllMocks()
  })

  it('stores credentials under the scoped service name', async () => {
    const profile = `profile-${Date.now()}`

    await saveCredentials(profile, 'client-id', 'client-secret')

    const credentials = await keytar.findCredentials(SERVICE_NAME)
    expect(credentials).toContainEqual({
      account: profile,
      password: JSON.stringify({
        clientId: 'client-id',
        clientSecret: 'client-secret',
      }),
    })

    await deleteCredentials(profile)
  })

  it('falls back to the legacy service name when reading credentials', async () => {
    const profile = `legacy-${Date.now()}`
    await keytar.setPassword(
      LEGACY_SERVICE_NAMES[0],
      profile,
      JSON.stringify({
        clientId: 'legacy-id',
        clientSecret: 'legacy-secret',
      }),
    )

    await expect(getCredentials(profile)).resolves.toEqual({
      clientId: 'legacy-id',
      clientSecret: 'legacy-secret',
    })

    await deleteCredentials(profile)
    await expect(keytar.getPassword(LEGACY_SERVICE_NAMES[0], profile)).resolves.toBeNull()
  })
})
