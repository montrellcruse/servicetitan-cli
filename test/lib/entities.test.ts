import {describe, expect, it} from 'vitest'

import {toCustomerDetail, toJobDetail, toReportCategoryRows} from '../../src/lib/entities.js'

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
})
