import {afterEach, describe, expect, it, vi} from 'vitest'

import TimesheetsActivityTypes from '../../src/commands/timesheets/activity-types.js'
import TimesheetsList from '../../src/commands/timesheets/list.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('timesheets commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a timesheet activities table for timesheets list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createActivity()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await TimesheetsList.run(['--technician', '72'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/activities', {
      from: undefined,
      page: 1,
      pageSize: 50,
      technicianId: 72,
      to: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Dispatch')
    expect(rendered).toContain('Jordan Patel')
  })

  it('renders timesheet activity types', async () => {
    const getSpy = vi.fn().mockResolvedValue([
      {
        active: true,
        code: 'DISP',
        id: 5,
        name: 'Dispatch',
      },
    ])
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await TimesheetsActivityTypes.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/activity-types')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('DISP')
    expect(rendered).toContain('Dispatch')
  })
})

function createActivity() {
  return {
    activityType: {
      name: 'Dispatch',
    },
    durationMinutes: 45,
    id: 901,
    jobId: 845102,
    startTime: '2026-03-26T09:00:00Z',
    technician: {
      name: 'Jordan Patel',
    },
  }
}
