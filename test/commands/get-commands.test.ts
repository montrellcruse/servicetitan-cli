import {afterEach, describe, expect, it, vi} from 'vitest'

import BookingsGet from '../../src/commands/bookings/get.js'
import EstimatesGet from '../../src/commands/estimates/get.js'
import LeadsGet from '../../src/commands/leads/get.js'
import MembershipsGet from '../../src/commands/memberships/get.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('entity get commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    {
      command: BookingsGet,
      expected: ['Google Local Services', 'Customer prefers text updates'],
      id: '310511',
      label: 'bookings get',
      path: '/bookings/310511',
      record: createBooking(),
    },
    {
      command: EstimatesGet,
      expected: ['3-ton heat pump replacement', 'Ava Thompson'],
      id: '730118',
      label: 'estimates get',
      path: '/estimates/730118',
      record: createEstimate(),
    },
    {
      command: LeadsGet,
      expected: ['Google Local Services', 'website'],
      id: '210411',
      label: 'leads get',
      path: '/leads/210411',
      record: createLead(),
    },
    {
      command: MembershipsGet,
      expected: ['Comfort Club Gold', 'Monthly'],
      id: '51012',
      label: 'memberships get',
      path: '/memberships/51012',
      record: createMembership(),
    },
  ])('renders $label', async ({command, expected, id, path, record}) => {
    const getSpy = vi.fn().mockResolvedValue(record)
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await command.run([id], process.cwd())

    expect(getSpy).toHaveBeenCalledWith(path)
    const rendered = stripAnsi(output())

    for (const fragment of expected) {
      expect(rendered).toContain(fragment)
    }
  })
})

function createBooking() {
  return {
    createdOn: '2026-03-26T14:05:10Z',
    customer: {
      email: 'service@riveraresidence.com',
      name: 'Rivera Residence',
      phone: '480-555-0178',
    },
    id: 310511,
    notes: 'Customer prefers text updates',
    provider: {
      name: 'Google Local Services',
    },
    status: 'Open',
  }
}

function createEstimate() {
  return {
    createdBy: {
      name: 'Ava Thompson',
    },
    createdOn: '2026-03-24T18:10:11Z',
    customer: {
      name: 'Harper Family',
    },
    id: 730118,
    jobId: 845102,
    name: '3-ton heat pump replacement',
    status: 'open',
    total: 6850,
  }
}

function createLead() {
  return {
    assignedTo: {
      name: 'Intake Team',
    },
    campaign: {
      name: 'Google Local Services',
    },
    createdOn: '2026-03-26T14:05:10Z',
    email: 'service@riveraresidence.com',
    id: 210411,
    phone: '480-555-0178',
    source: 'website',
    status: 'open',
  }
}

function createMembership() {
  return {
    billingFrequency: 'Monthly',
    createdOn: '2025-07-12T15:20:43Z',
    customer: {
      id: 403219,
      name: 'Harper Family',
    },
    endDate: '2026-07-11',
    id: 51012,
    isRecurring: true,
    location: {
      id: 550912,
    },
    membershipType: {
      name: 'Comfort Club Gold',
    },
    price: 29,
    startDate: '2025-07-12',
    status: 'Active',
  }
}
