import type {UnknownRecord} from './types.js'

const NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/

export function parseParamsFlag(value: string | undefined): Record<string, unknown> {
  if (!value) {
    return {}
  }

  return Object.fromEntries(
    value
      .split(',')
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(parseParamEntry),
  )
}

export function parseRequestBody(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    throw new Error('Request body must be valid JSON.')
  }
}

export function extractResponseRecords(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.filter(isUnknownRecord)
  }

  if (!isUnknownRecord(value)) {
    return []
  }

  if (Array.isArray(value.data)) {
    return value.data.filter(isUnknownRecord)
  }

  return [value]
}

export function isUnknownRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseParamEntry(entry: string): [string, unknown] {
  const separatorIndex = entry.indexOf('=')

  if (separatorIndex === -1) {
    throw new Error(`Invalid parameter "${entry}". Use key=value pairs separated by commas.`)
  }

  const key = entry.slice(0, separatorIndex).trim()
  const rawValue = entry.slice(separatorIndex + 1).trim()

  if (!key) {
    throw new Error(`Invalid parameter "${entry}". Parameter names cannot be empty.`)
  }

  return [key, parseLiteralValue(rawValue)]
}

function parseLiteralValue(value: string): unknown {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  if (value === 'null') {
    return null
  }

  if (NUMBER_PATTERN.test(value)) {
    return Number(value)
  }

  return value
}
