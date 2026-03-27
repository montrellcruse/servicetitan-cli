import {describe, expect, it} from 'vitest'

import {
  toAppointmentAssignmentSummary,
  toAppointmentSummary,
  toCustomerDetail,
  toEmployeeSummary,
  toEstimateSummary,
  toInvoiceSummary,
  toJobDetail,
  toJobSummary,
  toLocationDetail,
  toReportCategoryRows,
} from '../../src/lib/entities.js'

describe('entity mappers', () => {
  it('returns stable empty defaults for sparse inputs', () => {
    expect(toCustomerDetail({})).toEqual({
      active: false,
      address: '',
      city: '',
      created: '',
      email: '',
      id: '',
      name: '',
      phone: '',
      state: '',
      zip: '',
    })

    expect(toJobDetail(null)).toEqual({
      businessUnit: '',
      created: '',
      customer: '',
      id: '',
      scheduled: '',
      status: '',
      summary: '',
      technician: '',
      total: 0,
      type: '',
    })

    expect(toLocationDetail({})).toEqual({
      active: false,
      address: '',
      city: '',
      contacts: [],
      customerId: '',
      id: '',
      name: '',
      notes: [],
      state: '',
      zip: '',
    })

    expect(toEmployeeSummary({})).toEqual({
      active: false,
      email: '',
      id: '',
      name: '',
      phoneNumber: '',
      role: '',
    })

    expect(toAppointmentSummary({})).toEqual({
      appointmentNumber: '',
      arrivalWindowEnd: '',
      arrivalWindowStart: '',
      end: '',
      id: '',
      isConfirmed: false,
      jobId: '',
      start: '',
      status: '',
    })
  })

  it('ignores empty report category payloads', () => {
    expect(
      toReportCategoryRows({
        data: [null, {name: 'Operations', reports: []}, {name: 'Marketing', reports: [{id: 308, name: 'Leads by Campaign'}]}],
      }),
    ).toEqual([
      {
        category: 'Marketing',
        id: 308,
        report: 'Leads by Campaign',
      },
    ])
  })

  it('maps list payloads using list-safe fields and string currency parsing', () => {
    expect(
      toJobSummary({
        completedOn: '2026-03-26T11:30:00Z',
        customerId: 9912,
        id: 845118,
        jobStatus: 'Scheduled',
        jobTypeId: 87,
        scheduledDate: '2026-03-26T10:30:00Z',
        total: '$1,240.50',
      }),
    ).toEqual({
      customer: '9912',
      id: 845118,
      scheduled: '2026-03-26T10:30:00Z',
      status: 'Scheduled',
      total: 1240.5,
      type: '87',
    })

    expect(
      toInvoiceSummary({
        balance: '$620.25',
        createdOn: '2026-03-24T17:44:18Z',
        customerId: 9912,
        id: 992417,
        reviewStatus: 'NeedsReview',
        subTotal: '$900.00',
        total: '$1,240.50',
      }),
    ).toEqual({
      balance: 620.25,
      created: '2026-03-24T17:44:18Z',
      customer: '9912',
      id: 992417,
      status: 'NeedsReview',
      subTotal: 900,
      total: 1240.5,
    })

    expect(
      toEstimateSummary({
        customerId: 9912,
        id: 1142,
        status: {
          name: 'Open',
          value: 0,
        },
      }),
    ).toMatchObject({
      customer: '9912',
      id: 1142,
      status: 'Open',
    })

    expect(
      toAppointmentAssignmentSummary({
        appointmentId: 401992,
        assignedOn: '2026-03-26T08:45:00Z',
        jobId: 845102,
        status: 'Scheduled',
        technician: {
          name: 'Ava Thompson',
        },
      }),
    ).toEqual({
      appointment: 401992,
      assignedOn: '2026-03-26T08:45:00Z',
      job: 845102,
      status: 'Scheduled',
      tech: 'Ava Thompson',
    })
  })
})
