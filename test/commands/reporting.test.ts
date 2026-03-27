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

  it('runs a report and renders the data rows as JSON', async () => {
    const postSpy = vi.fn().mockResolvedValue({
      fields: ['technician', 'completedJobs', 'completedRevenue'],
      data: [
        ['Ava Thompson', 96, 84210.44],
      ],
      page: 1,
      pageSize: 50,
      hasMore: false,
      totalCount: 1,
    })
    const {output} = createTestContext({
      client: {
        post: postSpy,
      },
    })

    await ReportingRun.run(
      ['--category', 'operations', '--report', '175', '--from', '2026-03-01', '--to', '2026-03-31', '--output', 'json'],
      process.cwd(),
    )

    expect(postSpy).toHaveBeenCalledWith(
      '/report-category/operations/reports/175/data',
      {parameters: [{name: 'From', value: '2026-03-01'}, {name: 'To', value: '2026-03-31'}]},
    )
    expect(JSON.parse(output())).toEqual([['Ava Thompson', 96, 84210.44]])
  })
})
