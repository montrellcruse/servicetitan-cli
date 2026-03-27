import {afterEach, describe, expect, it, vi} from 'vitest'

import DispatchBoard from '../../src/commands/dispatch/board.js'
import DispatchCapacity from '../../src/commands/dispatch/capacity.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('dispatch commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the dispatch board for a given date', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createAssignment()],
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await DispatchBoard.run(['--date', '2026-03-26'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/appointment-assignments', {
      date: '2026-03-26',
      technicianId: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Ava Thompson')
    expect(rendered).toContain('2026-03-26 09:00')
  })

  it('renders dispatch capacity for a given date', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createCapacity()],
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await DispatchCapacity.run(['--date', '2026-03-26'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/capacity', {
      date: '2026-03-26',
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Residential HVAC')
    expect(rendered).toContain('18')
  })
})

function createAssignment() {
  return {
    appointmentId: 401992,
    end: '2026-03-26T10:30:00Z',
    jobId: 845102,
    start: '2026-03-26T09:00:00Z',
    status: 'Scheduled',
    technician: {
      name: 'Ava Thompson',
    },
  }
}

function createCapacity() {
  return {
    available: 6,
    businessUnit: {
      name: 'Residential HVAC',
    },
    scheduled: 18,
  }
}
