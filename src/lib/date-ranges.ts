export type RevenuePeriod = 'day' | 'week' | 'month' | 'year' | 'ytd'

export interface DateRange {
  from: string
  to: string
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

export function getTodayDate(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function resolvePeriodDateRange(period: RevenuePeriod, referenceDate: string): DateRange {
  const date = parseDate(referenceDate)

  switch (period) {
    case 'day': {
      return {from: referenceDate, to: referenceDate}
    }

    case 'week': {
      const weekday = date.getUTCDay()
      const mondayOffset = weekday === 0 ? -6 : 1 - weekday
      const monday = addDays(date, mondayOffset)
      const sunday = addDays(monday, 6)
      return {
        from: formatUtcDate(monday),
        to: formatUtcDate(sunday),
      }
    }

    case 'month': {
      return {
        from: formatUtcDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))),
        to: formatUtcDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))),
      }
    }

    case 'year': {
      return {
        from: `${date.getUTCFullYear()}-01-01`,
        to: `${date.getUTCFullYear()}-12-31`,
      }
    }

    case 'ytd': {
      return {
        from: `${date.getUTCFullYear()}-01-01`,
        to: referenceDate,
      }
    }
  }
}

export function resolveDateRange(options: {
  clampToReferenceDate?: boolean
  from?: string
  period?: RevenuePeriod
  referenceDate?: string
  to?: string
} = {}): DateRange {
  const referenceDate = assertDateString(options.referenceDate ?? getTodayDate(), 'Reference date')
  const period = options.period ?? 'month'
  const baseRange = resolvePeriodDateRange(period, referenceDate)
  const clampedBaseRange = options.clampToReferenceDate
    ? {
        from: baseRange.from,
        to: baseRange.to > referenceDate ? referenceDate : baseRange.to,
      }
    : baseRange
  const from = options.from ? assertDateString(options.from, 'From date') : clampedBaseRange.from
  const to = options.to ? assertDateString(options.to, 'To date') : clampedBaseRange.to

  if (from > to) {
    throw new Error('From date must be on or before the to date.')
  }

  return {from, to}
}

export function resolveOptionalDateRange(options: {
  from?: string
  to?: string
} = {}): Partial<DateRange> {
  const from = options.from ? assertDateString(options.from, 'From date') : undefined
  const to = options.to ? assertDateString(options.to, 'To date') : undefined

  if (from && to && from > to) {
    throw new Error('From date must be on or before the to date.')
  }

  return {from, to}
}

export function assertDateString(value: string, label = 'Date'): string {
  parseDate(value, label)
  return value
}

/**
 * Convert a YYYY-MM-DD date string to an ISO 8601 datetime string in UTC,
 * appending T00:00:00Z. Used to build the `createdOnOrAfter`-style params
 * the ServiceTitan API expects (it ignores plain date strings for these
 * fields and silently returns all records).
 */
export function toSTDateTime(date: string): string {
  assertDateString(date)
  return `${date}T00:00:00Z`
}

/**
 * Returns the start of the day AFTER the given date as a UTC datetime string.
 * Useful for building exclusive-end `createdBefore` params so that the
 * supplied date is fully included in the result set.
 *
 * e.g. toSTDateTimeExclusiveEnd('2026-03-26') → '2026-03-27T00:00:00Z'
 */
export function toSTDateTimeExclusiveEnd(date: string): string {
  const d = parseDate(date)
  const next = new Date(d.getTime() + DAY_MS)
  return `${formatUtcDate(next)}T00:00:00Z`
}

export function formatLongDate(value: string): string {
  const date = parseDate(value)
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date)
}

export function formatMonthYear(value: string): string {
  const date = parseDate(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date)
}

export function formatShortDateRange(range: DateRange): string {
  const fromDate = parseDate(range.from)
  const toDate = parseDate(range.to)
  const shortFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  const shortWithYearFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  })

  if (range.from === range.to) {
    return shortWithYearFormatter.format(fromDate)
  }

  if (fromDate.getUTCFullYear() === toDate.getUTCFullYear()) {
    return `${shortFormatter.format(fromDate)} - ${shortWithYearFormatter.format(toDate)}`
  }

  return `${shortWithYearFormatter.format(fromDate)} - ${shortWithYearFormatter.format(toDate)}`
}

export function formatPeriodLabel(
  period: RevenuePeriod,
  range: DateRange,
  options: {custom?: boolean} = {},
): string {
  if (options.custom) {
    return formatShortDateRange(range)
  }

  switch (period) {
    case 'day': {
      return formatLongDate(range.from)
    }

    case 'week': {
      return `Week of ${formatLongDate(range.from)}`
    }

    case 'month': {
      return formatMonthYear(range.from)
    }

    case 'year': {
      return range.from.slice(0, 4)
    }

    case 'ytd': {
      return `Year to Date ${range.from.slice(0, 4)}`
    }
  }
}

function parseDate(value: string, label = 'Date'): Date {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`${label} must look like YYYY-MM-DD.`)
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${label} must be a valid YYYY-MM-DD date.`)
  }

  return date
}

function addDays(date: Date, offset: number): Date {
  return new Date(date.getTime() + offset * DAY_MS)
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
