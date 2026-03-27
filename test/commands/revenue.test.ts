import {afterEach, describe, expect, it, vi} from 'vitest'

import Revenue from '../../src/commands/revenue.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('revenue command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('summarizes month revenue in table output', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: createInvoices(),
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await Revenue.run(
      ['--period', 'month', '--from', '2026-03-01', '--to', '2026-03-26'],
      process.cwd(),
    )

    expect(getSpy).toHaveBeenCalledWith('/invoices', {
      invoiceDateOnOrAfter: '2026-03-01',
      invoiceDateOnOrBefore: '2026-03-26',
      page: 1,
      pageSize: 5000,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Revenue Summary')
    expect(rendered).toContain('$2,100.00')
    expect(rendered).toContain('2')
  })

  it('renders ytd revenue as JSON output', async () => {
    const {output} = createTestContext({
      client: {
        get: vi.fn().mockResolvedValue({
          data: createInvoices(),
          hasMore: false,
        }),
      },
    })

    await Revenue.run(
      ['--period', 'ytd', '--from', '2026-01-01', '--to', '2026-03-26', '--output', 'json'],
      process.cwd(),
    )

    expect(JSON.parse(output())).toEqual({
      avg_job_value: 1050,
      from: '2026-01-01',
      period: 'ytd',
      to: '2026-03-26',
      total_jobs: 2,
      total_revenue: 2100,
    })
  })
})

function createInvoices() {
  return [
    {
      id: 1,
      status: 'Paid',
      total: '600.00',
    },
    {
      id: 2,
      status: 'Void',
      total: '200.00',
    },
    {
      id: 3,
      status: 'Paid',
      total: '1500.00',
    },
  ]
}
