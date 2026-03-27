import type {UnknownRecord} from './types.js'

const BOOKING_STATUS_MAP = {
  converted: 'Converted',
  dismissed: 'Dismissed',
  open: 'Open',
} as const

const JOB_PRIORITY_MAP = {
  high: 'High',
  low: 'Low',
  medium: 'Medium',
  urgent: 'Urgent',
} as const

export function buildAddressBody(fields: {
  address?: string
  city?: string
  state?: string
  zip?: string
}): UnknownRecord | undefined {
  const state = normalizeState(fields.state)
  const body = Object.fromEntries(
    Object.entries({
      city: fields.city,
      state,
      street: fields.address,
      zip: fields.zip,
    }).filter(([, value]) => value !== undefined),
  )

  return Object.keys(body).length > 0 ? body : undefined
}

export function buildRequestBody(entries: Array<[string, unknown]>): UnknownRecord {
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined))
}

export function hasResponseBody(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0
  }

  return true
}

export function normalizeBookingStatus(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return BOOKING_STATUS_MAP[value as keyof typeof BOOKING_STATUS_MAP]
}

export function normalizeJobPriority(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  return JOB_PRIORITY_MAP[value as keyof typeof JOB_PRIORITY_MAP]
}

export function normalizeState(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  const normalized = value.trim().toUpperCase()

  if (!normalized) {
    return undefined
  }

  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new Error('State must be a 2-letter code.')
  }

  return normalized
}
