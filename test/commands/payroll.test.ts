import {afterEach, describe, expect, it, vi} from 'vitest'

import PayrollActivityCodes from '../../src/commands/payroll/activity-codes.js'
import PayrollGrossPay from '../../src/commands/payroll/gross-pay.js'
import PayrollList from '../../src/commands/payroll/list.js'
import PayrollTimesheets from '../../src/commands/payroll/timesheets.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('payroll commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a payroll table for payroll list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createPayroll()],
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await PayrollList.run(['--employee', '58', '--technician', '72'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/payrolls', {
      employeeId: 58,
      from: undefined,
      technicianId: 72,
      to: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Ava Thompson')
    expect(rendered).toContain('$1,240.00')
  })

  it('renders mapped timesheets for payroll timesheets', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createTimesheet()],
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await PayrollTimesheets.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/jobs/timesheets', {
      from: undefined,
      to: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Dispatch')
    expect(rendered).toContain('845102')
  })

  it('renders gross pay items for payroll gross-pay', async () => {
    const getSpy = vi.fn().mockResolvedValue([
      {
        amount: 480,
        date: '2026-03-26',
        employeeId: 58,
        id: 901,
        type: 'Bonus',
      },
    ])
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await PayrollGrossPay.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/gross-pay-items', {
      from: undefined,
      to: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Bonus')
    expect(rendered).toContain('$480.00')
  })

  it('renders activity codes for payroll activity-codes', async () => {
    const getSpy = vi.fn().mockResolvedValue([
      {
        active: true,
        code: 'DISP',
        id: 12,
        name: 'Dispatch',
      },
    ])
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await PayrollActivityCodes.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/activity-codes')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('DISP')
    expect(rendered).toContain('Dispatch')
  })
})

function createPayroll() {
  return {
    employee: {
      name: 'Ava Thompson',
    },
    id: 512,
    periodEnd: '2026-03-31',
    periodStart: '2026-03-25',
    technician: {
      name: 'Jordan Patel',
    },
    total: 1240,
  }
}

function createTimesheet() {
  return {
    activityCode: {
      name: 'Dispatch',
    },
    durationMinutes: 45,
    endTime: '2026-03-26T09:45:00Z',
    id: 1201,
    jobId: 845102,
    startTime: '2026-03-26T09:00:00Z',
    technicianId: 72,
  }
}
