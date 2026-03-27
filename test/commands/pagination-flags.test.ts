import {afterEach, describe, expect, it, vi} from 'vitest'

import AppointmentsList from '../../src/commands/appointments/list.js'
import BookingsList from '../../src/commands/bookings/list.js'
import CallsList from '../../src/commands/calls/list.js'
import CustomersList from '../../src/commands/customers/list.js'
import EmployeesList from '../../src/commands/employees/list.js'
import EstimatesList from '../../src/commands/estimates/list.js'
import InvoicesList from '../../src/commands/invoices/list.js'
import JobsList from '../../src/commands/jobs/list.js'
import LeadsList from '../../src/commands/leads/list.js'
import LocationsList from '../../src/commands/locations/list.js'
import MembershipsList from '../../src/commands/memberships/list.js'
import MembershipsTypes from '../../src/commands/memberships/types.js'
import PricebookEquipment from '../../src/commands/pricebook/equipment.js'
import PricebookMaterials from '../../src/commands/pricebook/materials.js'
import PricebookServices from '../../src/commands/pricebook/services.js'
import TechsList from '../../src/commands/techs/list.js'
import {createTestContext, stripAnsi} from '../helpers.js'

type CommandCase = {
  argv: string[]
  command: {
    run(argv?: string[], root?: string): Promise<void>
  }
  label: string
  params: Record<string, unknown>
  path: string
}

const CASES: CommandCase[] = [
  {
    argv: ['--page', '2', '--limit', '10'],
    command: AppointmentsList,
    label: 'appointments list',
    params: {from: undefined, jobId: undefined, page: 2, pageSize: 10, status: undefined, to: undefined},
    path: '/appointments',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: BookingsList,
    label: 'bookings list',
    params: {page: 2, pageSize: 10, status: undefined},
    path: '/bookings',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: CallsList,
    label: 'calls list',
    params: {from: undefined, page: 2, pageSize: 10, to: undefined},
    path: '/calls',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: CustomersList,
    label: 'customers list',
    params: {active: undefined, page: 2, pageSize: 10, search: undefined},
    path: '/customers',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: EmployeesList,
    label: 'employees list',
    params: {active: undefined, page: 2, pageSize: 10},
    path: '/employees',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: EstimatesList,
    label: 'estimates list',
    params: {jobId: undefined, page: 2, pageSize: 10, status: undefined},
    path: '/estimates',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: InvoicesList,
    label: 'invoices list',
    params: {page: 2, pageSize: 10, status: undefined},
    path: '/invoices',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: JobsList,
    label: 'jobs list',
    params: {date: undefined, from: undefined, page: 2, pageSize: 10, status: undefined, to: undefined},
    path: '/jobs',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: LeadsList,
    label: 'leads list',
    params: {page: 2, pageSize: 10, status: undefined},
    path: '/leads',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: LocationsList,
    label: 'locations list',
    params: {
      active: undefined,
      customerId: undefined,
      from: undefined,
      page: 2,
      pageSize: 10,
      to: undefined,
    },
    path: '/locations',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: MembershipsList,
    label: 'memberships list',
    params: {active: true, customerId: undefined, page: 2, pageSize: 10, type: undefined},
    path: '/memberships',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: MembershipsTypes,
    label: 'memberships types',
    params: {active: undefined, page: 2, pageSize: 10},
    path: '/membership-types',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: PricebookEquipment,
    label: 'pricebook equipment',
    params: {active: undefined, page: 2, pageSize: 10, search: undefined},
    path: '/equipment',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: PricebookMaterials,
    label: 'pricebook materials',
    params: {active: undefined, page: 2, pageSize: 10, search: undefined},
    path: '/materials',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: PricebookServices,
    label: 'pricebook services',
    params: {active: undefined, category: undefined, page: 2, pageSize: 10, search: undefined},
    path: '/services',
  },
  {
    argv: ['--page', '2', '--limit', '10'],
    command: TechsList,
    label: 'techs list',
    params: {active: undefined, page: 2, pageSize: 10},
    path: '/technicians',
  },
]

describe('paginated list commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(CASES)('passes --page through for $label', async ({argv, command, params, path}) => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await command.run(argv, process.cwd())

    expect(getSpy).toHaveBeenCalledWith(path, params)
    expect(stripAnsi(output())).toContain('No results found.')
  })
})
