import {afterEach, describe, expect, it, vi} from 'vitest'

import Revenue from '../../src/commands/revenue.js'
import {createTestContext, stripAnsi} from '../helpers.js'

// Report 175 response: rows are arrays, field index 8 = TotalRevenue, index 5 = ConvertedJobs
function createReport175Response() {
  return {
    data: [
      // [Name, CompletedRevenue, OppJobAvg, OppConvRate, Opportunity, ConvertedJobs, CustSat, AdjRevenue, TotalRevenue, NonJobRevenue]
      ['HVAC - Service', 600, 300, 0.5, 4, 2, 4.8, 0, 1500, 0],
      ['HVAC - Install', 600, 600, 1.0, 1, 1, 4.9, 0, 600, 0],
      // Zero-activity row — should be skipped
      ['Inactive BU', 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    hasMore: false,
  }
}

describe('revenue command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('summarizes month revenue in table output', async () => {
    const postSpy = vi.fn().mockResolvedValue(createReport175Response())
    const {output} = createTestContext({
      client: {
        get: vi.fn(),
        post: postSpy,
      },
    })

    await Revenue.run(
      ['--period', 'month', '--from', '2026-03-01', '--to', '2026-03-26'],
      process.cwd(),
    )

    expect(postSpy).toHaveBeenCalledWith(
      '/report-category/business-unit-dashboard/reports/175/data',
      {
        parameters: [
          {name: 'From', value: '2026-03-01'},
          {name: 'To', value: '2026-03-26'},
        ],
      },
    )
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Revenue Summary')
    expect(rendered).toContain('$2,100.00')
    expect(rendered).toContain('3') // 2 + 1 = 3 converted jobs
  })

  it('renders ytd revenue as JSON output', async () => {
    const {output} = createTestContext({
      client: {
        get: vi.fn(),
        post: vi.fn().mockResolvedValue(createReport175Response()),
      },
    })

    await Revenue.run(
      ['--period', 'ytd', '--from', '2026-01-01', '--to', '2026-03-26', '--output', 'json'],
      process.cwd(),
    )

    expect(JSON.parse(output())).toEqual({
      avg_job_value: 700,
      from: '2026-01-01',
      period: 'ytd',
      to: '2026-03-26',
      total_jobs: 3,
      total_revenue: 2100,
    })
  })
})
