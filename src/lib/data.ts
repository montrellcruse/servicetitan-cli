import type {JsonValue, UnknownRecord} from './types.js'

export function getPathValue(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in (value as Record<string, unknown>)) {
      return (value as Record<string, unknown>)[segment]
    }

    return undefined
  }, source)
}

export function firstDefined(source: unknown, paths: string[]): unknown {
  for (const path of paths) {
    const value = getPathValue(source, path)
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }

  return undefined
}

export function getString(source: unknown, paths: string[]): string | undefined {
  const value = firstDefined(source, paths)

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return undefined
}

export function getNumber(source: unknown, paths: string[]): number | undefined {
  const value = firstDefined(source, paths)

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  return undefined
}

export function getBoolean(source: unknown, paths: string[]): boolean | undefined {
  const value = firstDefined(source, paths)

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true
    }

    if (value.toLowerCase() === 'false') {
      return false
    }
  }

  return undefined
}

export function compactValue(value: unknown): JsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (Array.isArray(value)) {
    const next = value
      .map(item => compactValue(item))
      .filter((item): item is JsonValue => item !== undefined)

    return next.length > 0 ? next : undefined
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as UnknownRecord)
      .map(([key, entryValue]) => [key, compactValue(entryValue)] as const)
      .filter(([, entryValue]) => entryValue !== undefined)

    if (entries.length === 0) {
      return undefined
    }

    return Object.fromEntries(entries) as JsonValue
  }

  return value as JsonValue
}

export function looksLikeIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.+-Z]+)?$/.test(value)
}

export function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toISOString().slice(0, 10)
}

export function formatDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toISOString().slice(0, 16).replace('T', ' ')
}

export function titleCase(field: string): string {
  if (field.toLowerCase() === 'id') {
    return 'ID'
  }

  return field
    .replace(/\./g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, match => match.toUpperCase())
}
