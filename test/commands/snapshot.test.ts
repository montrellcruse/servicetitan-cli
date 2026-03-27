import {describe, expect, it, vi} from 'vitest'

import {getSnapshotSummary} from '../../src/lib/intelligence.js'

describe('snapshot summary', () => {
  it('aggregates settled results and keeps partial failures', async () => {
    const get = vi.fn((path: string, params?: Record<string, unknown>) => {
      if (path === '/jobs' && params?.jobStatus === 'Scheduled,InProgress') {
        return Promise.resolve({data: [], totalCount: 12})
      }

      if (path === '/jobs' && params?.scheduledOnOrAfter === '2026-03-23' && params?.scheduledOnOrBefore === '2026-03-29') {
        return Promise.resolve({data: [], totalCount: 47})
      }

      if (path === '/estimates') {
        return Promise.resolve({data: [], totalCount: 8})
      }

      if (path === '/memberships') {
        return Promise.reject(new Error('Membership API unavailable'))
      }

      if (path === '/leads') {
        return Promise.resolve({data: [], totalCount: 15})
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`))
    })

    // Report 175 POST response for revenue_mtd
    const post = vi.fn().mockResolvedValue({
      data: [
        // [Name, CompletedRev, OppAvg, OppConvRate, Opp, ConvertedJobs, CustSat, AdjRev, TotalRevenue, NonJobRev]
        ['HVAC - Service', 200, 200, 1.0, 1, 1, 4.8, 0, 300, 0],
      ],
      hasMore: false,
    })

    const client = {get, post}
    const summary = await getSnapshotSummary(client, '2026-03-26')

    expect(summary).toEqual({
      date: '2026-03-26',
      errors: {
        active_memberships: 'Membership API unavailable',
      },
      jobs_this_week: 47,
      jobs_today: 12,
      open_estimates: 8,
      open_leads: 15,
      revenue_mtd: 300,
    })
    expect(get).toHaveBeenCalledWith('/memberships', {
      active: true,
      page: 1,
      pageSize: 1,
    })
    expect(get).toHaveBeenCalledWith('/jobs', {
      scheduledOnOrAfter: '2026-03-26',
      scheduledOnOrBefore: '2026-03-26',
      jobStatus: 'Scheduled,InProgress',
      page: 1,
      pageSize: 1,
    })
    expect(get).toHaveBeenCalledWith('/jobs', {
      scheduledOnOrAfter: '2026-03-23',
      scheduledOnOrBefore: '2026-03-29',
      page: 1,
      pageSize: 1,
    })
    expect(post).toHaveBeenCalledWith(
      '/report-category/business-unit-dashboard/reports/175/data',
      {
        parameters: [
          {name: 'From', value: '2026-03-01'},
          {name: 'To', value: '2026-03-26'},
        ],
      },
    )
  })
})
