import {afterEach, describe, expect, it, vi} from 'vitest'

import JobsGet from '../../src/commands/jobs/get.js'
import JobsList from '../../src/commands/jobs/list.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('jobs commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a jobs table for jobs list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createJob()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await JobsList.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/jobs', {
      date: undefined,
      from: undefined,
      page: 1,
      pageSize: 50,
      status: undefined,
      to: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Parkview Dental')
    expect(rendered).toContain('Scheduled')
  })

  it('passes the status filter through jobs list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createJob()],
      hasMore: false,
    })
    createTestContext({
      client: {
        get: getSpy,
      },
    })

    await JobsList.run(['--status', 'Scheduled'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/jobs', {
      date: undefined,
      from: undefined,
      page: 1,
      pageSize: 50,
      status: 'Scheduled',
      to: undefined,
    })
  })

  it('translates date-range into from/to filters', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createJob()],
      hasMore: false,
    })
    createTestContext({
      client: {
        get: getSpy,
      },
    })

    await JobsList.run(['--date-range', '2026-03-01..2026-03-31'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/jobs', {
      date: undefined,
      from: '2026-03-01',
      page: 1,
      pageSize: 50,
      status: undefined,
      to: '2026-03-31',
    })
  })

  it('fetches and renders a single job', async () => {
    const getSpy = vi.fn().mockResolvedValue(createJob())
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await JobsGet.run(['845118'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/jobs/845118')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Commercial HVAC')
    expect(rendered).toContain('Ava Thompson')
    expect(rendered).toContain('Rear rooftop package unit not cooling')
  })
})

function createJob() {
  return {
    businessUnit: {
      name: 'Commercial HVAC',
    },
    createdOn: '2026-03-25T18:02:14Z',
    customer: {
      name: 'Parkview Dental',
    },
    id: 845118,
    jobType: {
      name: 'RTU Cooling Repair',
    },
    scheduledOn: '2026-03-26T10:30:00Z',
    status: 'Scheduled',
    summary: 'Rear rooftop package unit not cooling',
    technician: {
      name: 'Ava Thompson',
    },
    total: 1240,
  }
}
