import keytar from 'keytar'

import type {Credentials} from './types.js'

export const SERVICE_NAME = 'servicetitan-cli'

export async function saveCredentials(
  profile: string,
  clientId: string,
  clientSecret: string,
): Promise<void> {
  const payload: Credentials = {clientId, clientSecret}
  await keytar.setPassword(SERVICE_NAME, profile, JSON.stringify(payload))
}

export async function getCredentials(profile: string): Promise<Credentials | null> {
  const envClientId = process.env.ST_CLIENT_ID
  const envClientSecret = process.env.ST_CLIENT_SECRET

  if (envClientId && envClientSecret) {
    return {
      clientId: envClientId,
      clientSecret: envClientSecret,
    }
  }

  const payload = await keytar.getPassword(SERVICE_NAME, profile)

  if (!payload) {
    return null
  }

  const parsed = JSON.parse(payload) as Partial<Credentials>

  if (!parsed.clientId || !parsed.clientSecret) {
    throw new Error(`Stored credentials for profile "${profile}" are invalid.`)
  }

  return {
    clientId: parsed.clientId,
    clientSecret: parsed.clientSecret,
  }
}

export async function deleteCredentials(profile: string): Promise<void> {
  await keytar.deletePassword(SERVICE_NAME, profile)
}
