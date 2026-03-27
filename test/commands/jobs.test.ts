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
      data: [createListJob()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await JobsList.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/jobs', {
      completedBefore: undefined,
      completedOnOrAfter: undefined,
      createdBefore: undefined,
      createdOnOrAfter: undefined,
      page: 1,
      pageSize: 50,
      status: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('9912')
    expect(rendered).toContain('87')
    expect(rendered).toContain('2026-03-26 10:30')
    expect(rendered).toContain('$1,240.00')
    expect(rendered).toContain('Scheduled')
    expect(rendered).not.toContain('Parkview Dental')
  })

  it('passes the status filter through jobs list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createListJob()],
      hasMore: false,
    })
    createTestContext({
      client: {
        get: getSpy,
      },
    })

    await JobsList.run(['--status', 'Scheduled'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/jobs', {
      completedBefore: undefined,
      completedOnOrAfter: undefined,
      createdBefore: undefined,
      createdOnOrAfter: undefined,
      page: 1,
      pageSize: 50,
      jobStatus: 'Scheduled',
    })
  })

  it('maps --from/--to to createdOnOrAfter/createdBefore', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createListJob()],
      hasMore: false,
    })
    createTestContext({
      client: {
        get: getSpy,
      },
    })

    await JobsList.run(['--from', '2026-03-01', '--to', '2026-03-31'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/jobs', {
      completedBefore: undefined,
      completedOnOrAfter: undefined,
      createdBefore: '2026-04-01T00:00:00Z',
      createdOnOrAfter: '2026-03-01T00:00:00Z',
      page: 1,
      pageSize: 50,
      status: undefined,
    })
  })

  it('maps --date to a single-day createdOnOrAfter/createdBefore range', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createListJob()],
      hasMore: false,
    })
    createTestContext({
      client: {
        get: getSpy,
      },
    })

    await JobsList.run(['--date', '2026-03-26'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/jobs', {
      completedBefore: undefined,
      completedOnOrAfter: undefined,
      createdBefore: '2026-03-27T00:00:00Z',
      createdOnOrAfter: '2026-03-26T00:00:00Z',
      page: 1,
      pageSize: 50,
      status: undefined,
    })
  })

  it('fetches and renders a single job', async () => {
    const getSpy = vi.fn().mockResolvedValue(createDetailJob())
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

function createListJob() {
  return {
    createdOn: '2026-03-25T18:02:14Z',
    customerId: 9912,
    id: 845118,
    jobStatus: 'Scheduled',
    jobTypeId: 87,
    scheduledDate: '2026-03-26T10:30:00Z',
    total: '$1,240.00',
  }
}

function createDetailJob() {
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
    jobStatus: 'Scheduled',
    scheduledDate: '2026-03-26T10:30:00Z',
    summary: 'Rear rooftop package unit not cooling',
    technician: {
      name: 'Ava Thompson',
    },
    total: '$1,240.00',
  }
}
