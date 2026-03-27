import keytar from 'keytar'

import type {Credentials} from './types.js'

export const SERVICE_NAME = '@rowvyn/servicetitan-cli'
export const LEGACY_SERVICE_NAMES = ['servicetitan-cli'] as const

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

  const payload = await getStoredPayload(profile)

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
  await Promise.all([SERVICE_NAME, ...LEGACY_SERVICE_NAMES].map(service => keytar.deletePassword(service, profile)))
}

async function getStoredPayload(profile: string): Promise<string | null> {
  const primaryPayload = await keytar.getPassword(SERVICE_NAME, profile)

  if (primaryPayload) {
    return primaryPayload
  }

  for (const serviceName of LEGACY_SERVICE_NAMES) {
    const payload = await keytar.getPassword(serviceName, profile)

    if (payload) {
      return payload
    }
  }

  return null
}
