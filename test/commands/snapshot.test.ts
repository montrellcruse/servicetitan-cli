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

      if (path === '/invoices') {
        return Promise.resolve({
          data: [
            {id: 1, status: 'Paid', total: '100.00'},
            {id: 2, status: 'Void', total: '50.00'},
            {id: 3, status: 'Paid', total: '200.00'},
          ],
          hasMore: false,
        })
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
    const client = {get}

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
    expect(get).toHaveBeenCalledWith('/invoices', {
      invoiceDateOnOrAfter: '2026-03-01',
      invoiceDateOnOrBefore: '2026-03-26',
      page: 1,
      pageSize: 5000,
    })
  })
})
