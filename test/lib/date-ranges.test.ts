import {describe, expect, it} from 'vitest'

import {resolveDateRange, resolvePeriodDateRange} from '../../src/lib/date-ranges.js'

describe('date ranges', () => {
  it('calculates a day range', () => {
    expect(resolvePeriodDateRange('day', '2026-03-26')).toEqual({
      from: '2026-03-26',
      to: '2026-03-26',
    })
  })

  it('calculates a week range using monday through sunday', () => {
    expect(resolvePeriodDateRange('week', '2026-03-26')).toEqual({
      from: '2026-03-23',
      to: '2026-03-29',
    })
  })

  it('calculates a full month range', () => {
    expect(resolvePeriodDateRange('month', '2026-03-26')).toEqual({
      from: '2026-03-01',
      to: '2026-03-31',
    })
  })

  it('calculates a full year range', () => {
    expect(resolvePeriodDateRange('year', '2026-03-26')).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    })
  })

  it('calculates a year-to-date range', () => {
    expect(resolvePeriodDateRange('ytd', '2026-03-26')).toEqual({
      from: '2026-01-01',
      to: '2026-03-26',
    })
  })

  it('can clamp a month range to the reference date', () => {
    expect(
      resolveDateRange({
        clampToReferenceDate: true,
        period: 'month',
        referenceDate: '2026-03-26',
      }),
    ).toEqual({
      from: '2026-03-01',
      to: '2026-03-26',
    })
  })
})
