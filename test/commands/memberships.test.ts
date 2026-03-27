import {afterEach, describe, expect, it, vi} from 'vitest'

import MembershipsList from '../../src/commands/memberships/list.js'
import MembershipsTypes from '../../src/commands/memberships/types.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('memberships commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a memberships table for memberships list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createMembership()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await MembershipsList.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/memberships', {
      status: undefined,
      customerId: undefined,
      page: 1,
      pageSize: 50,
      type: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Comfort Club Gold')
    expect(rendered).toContain('Harper Family')
  })

  it('passes status=Active when --active flag is used', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createMembership()],
      hasMore: false,
    })
    createTestContext({client: {get: getSpy}})

    await MembershipsList.run(['--active'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/memberships', {
      status: 'Active',
      customerId: undefined,
      page: 1,
      pageSize: 50,
      type: undefined,
    })
  })

  it('renders a membership types table for memberships types', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createMembershipType()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await MembershipsTypes.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/membership-types', {
      active: undefined,
      page: 1,
      pageSize: 50,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Comfort Club Gold')
    expect(rendered).toContain('29')
  })
})

function createMembership() {
  return {
    customer: {
      name: 'Harper Family',
    },
    endDate: '2026-07-11',
    id: 51012,
    isRecurring: true,
    membershipType: {
      name: 'Comfort Club Gold',
    },
    startDate: '2025-07-12',
    status: 'Active',
  }
}

function createMembershipType() {
  return {
    active: true,
    duration: 12,
    id: 901,
    name: 'Comfort Club Gold',
    price: 29,
  }
}
