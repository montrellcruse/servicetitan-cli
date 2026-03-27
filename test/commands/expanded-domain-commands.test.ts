import {afterEach, describe, expect, it, vi} from 'vitest'

import AppointmentsGet from '../../src/commands/appointments/get.js'
import BusinessUnitsGet from '../../src/commands/business-units/get.js'
import BusinessUnitsList from '../../src/commands/business-units/list.js'
import CustomersContacts from '../../src/commands/customers/contacts.js'
import DispatchTeams from '../../src/commands/dispatch/teams.js'
import DispatchZones from '../../src/commands/dispatch/zones.js'
import EmployeesGet from '../../src/commands/employees/get.js'
import JobTypesGet from '../../src/commands/job-types/get.js'
import JobTypesList from '../../src/commands/job-types/list.js'
import LocationsGet from '../../src/commands/locations/get.js'
import MembershipsRecurringServices from '../../src/commands/memberships/recurring-services.js'
import PricebookCategories from '../../src/commands/pricebook/categories.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('expanded domain commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    {
      argv: [],
      command: BusinessUnitsList,
      expected: ['HVAC', 'Yes'],
      label: 'business-units list',
      params: undefined,
      path: '/business-units',
      response: [{active: true, id: 17, name: 'HVAC'}],
    },
    {
      argv: ['--active'],
      command: JobTypesList,
      expected: ['Install', '120'],
      label: 'job-types list',
      params: {active: true},
      path: '/job-types',
      response: {data: [{active: true, durationMinutes: 120, id: 91, name: 'Install'}]},
    },
    {
      argv: ['403219'],
      command: CustomersContacts,
      expected: ['MobilePhone', '480-555-0101'],
      label: 'customers contacts',
      params: undefined,
      path: '/customers/403219/contacts',
      response: [{id: 1, isDefault: true, type: 'MobilePhone', value: '480-555-0101'}],
    },
    {
      argv: ['--membership', '51012', '--active'],
      command: MembershipsRecurringServices,
      expected: ['Spring Tune-Up', '51012'],
      label: 'memberships recurring-services',
      params: {active: true, membershipId: 51012},
      path: '/recurring-services',
      response: [{active: true, id: 45, membershipId: 51012, name: 'Spring Tune-Up'}],
    },
    {
      argv: ['--active'],
      command: PricebookCategories,
      expected: ['Indoor Air Quality', 'Yes'],
      label: 'pricebook categories',
      params: {active: true},
      path: '/categories',
      response: [{active: true, id: 12, name: 'Indoor Air Quality'}],
    },
    {
      argv: [],
      command: DispatchTeams,
      expected: ['East Team'],
      label: 'dispatch teams',
      params: undefined,
      path: '/teams',
      response: [{active: true, id: 7, name: 'East Team'}],
    },
    {
      argv: [],
      command: DispatchZones,
      expected: ['North Valley'],
      label: 'dispatch zones',
      params: undefined,
      path: '/zones',
      response: [{active: true, id: 9, name: 'North Valley'}],
    },
  ])('renders $label', async ({argv, command, expected, params, path, response}) => {
    const getSpy = vi.fn().mockResolvedValue(response)
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await command.run(argv, process.cwd())

    if (params === undefined) {
      expect(getSpy).toHaveBeenCalledWith(path)
    } else {
      expect(getSpy).toHaveBeenCalledWith(path, params)
    }

    const rendered = stripAnsi(output())

    for (const fragment of expected) {
      expect(rendered).toContain(fragment)
    }
  })

  it.each([
    {
      command: LocationsGet,
      expected: ['Main Residence', 'Quarterly visit note'],
      id: '550912',
      label: 'locations get',
      path: '/locations/550912',
      record: createLocation(),
    },
    {
      command: BusinessUnitsGet,
      expected: ['HVAC', 'Yes'],
      id: '17',
      label: 'business-units get',
      path: '/business-units/17',
      record: {active: true, id: 17, name: 'HVAC'},
    },
    {
      command: EmployeesGet,
      expected: ['Ava Thompson', 'Dispatcher'],
      id: '58',
      label: 'employees get',
      path: '/employees/58',
      record: createEmployee(),
    },
    {
      command: JobTypesGet,
      expected: ['Install', '120'],
      id: '91',
      label: 'job-types get',
      path: '/job-types/91',
      record: {active: true, durationMinutes: 120, id: 91, name: 'Install'},
    },
    {
      command: AppointmentsGet,
      expected: ['A-401992', 'Confirmed'],
      id: '401992',
      label: 'appointments get',
      path: '/appointments/401992',
      record: createAppointment(),
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

function createAppointment() {
  return {
    appointmentNumber: 'A-401992',
    arrivalWindowEnd: '2026-03-26T11:00:00Z',
    arrivalWindowStart: '2026-03-26T09:00:00Z',
    end: '2026-03-26T10:30:00Z',
    id: 401992,
    isConfirmed: true,
    jobId: 845102,
    start: '2026-03-26T09:30:00Z',
    status: 'Confirmed',
  }
}

function createEmployee() {
  return {
    active: true,
    email: 'ava.thompson@example.com',
    firstName: 'Ava',
    id: 58,
    lastName: 'Thompson',
    phoneNumber: '602-555-0149',
    role: {
      name: 'Dispatcher',
    },
  }
}

function createLocation() {
  return {
    active: true,
    address: {
      city: 'Phoenix',
      state: 'AZ',
      street: '123 Oak St',
      zip: '85004',
    },
    contacts: [
      {
        type: 'MobilePhone',
        value: '480-555-0101',
      },
    ],
    customerId: 403219,
    id: 550912,
    name: 'Main Residence',
    notes: ['Quarterly visit note'],
  }
}
