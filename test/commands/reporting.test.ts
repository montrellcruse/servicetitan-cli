import {afterEach, describe, expect, it, vi} from 'vitest'

import ReportingList from '../../src/commands/reporting/list.js'
import ReportingRun from '../../src/commands/reporting/run.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('reporting commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders reporting categories for reporting list', async () => {
    const getSpy = vi.fn().mockResolvedValue([
      {
        name: 'Operations',
        reports: [
          {
            id: 175,
            name: 'Revenue by Technician',
          },
        ],
      },
    ])
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await ReportingList.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/report-categories')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Operations')
    expect(rendered).toContain('Revenue by Technician')
  })

  it('runs a report and renders the response payload', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [
        {
          completedJobs: 96,
          completedRevenue: 84210.44,
          technician: 'Ava Thompson',
        },
      ],
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await ReportingRun.run(
      ['--category', 'operations', '--report', '175', '--from', '2026-03-01', '--to', '2026-03-31', '--output', 'json'],
      process.cwd(),
    )

    expect(getSpy).toHaveBeenCalledWith('/report-category/operations', {
      from: '2026-03-01',
      pageSize: 50,
      reportId: '175',
      to: '2026-03-31',
    })
    expect(JSON.parse(output())).toEqual({
      data: [
        {
          completedJobs: 96,
          completedRevenue: 84210.44,
          technician: 'Ava Thompson',
        },
      ],
    })
  })
})
