import {afterEach, describe, expect, it, vi} from 'vitest'

import CustomersGet from '../../src/commands/customers/get.js'
import CustomersList from '../../src/commands/customers/list.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('customers commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a customer table for customers list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createListCustomer()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await CustomersList.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/customers', {
      active: undefined,
      page: 1,
      pageSize: 50,
      search: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Skyline Bakery')
  })

  it('renders JSON output for customers list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createListCustomer()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await CustomersList.run(['--output', 'json'], process.cwd())

    expect(JSON.parse(output())).toEqual([
      {
        active: true,
        created: '2026-03-12T15:30:00Z',
        email: '',
        id: 403219,
        name: 'Skyline Bakery',
        phone: '',
      },
    ])
  })

  it('prints the table empty state for customers list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await CustomersList.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(stripAnsi(output())).toContain('No results found.')
  })

  it('prints an empty JSON array for customers list with no results', async () => {
    const {output} = createTestContext({
      client: {
        get: vi.fn().mockResolvedValue({
          data: [],
          hasMore: false,
        }),
      },
    })

    await CustomersList.run(['--output', 'json'], process.cwd())

    expect(JSON.parse(output())).toEqual([])
  })

  it('fetches and renders a single customer', async () => {
    const getSpy = vi.fn().mockResolvedValue(createDetailCustomer())
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await CustomersGet.run(['403219'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/customers/403219')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Skyline Bakery')
    expect(rendered).toContain('602-555-0142')
    expect(rendered).toContain('Phoenix')
    expect(rendered).toContain('85004')
  })
})

function createListCustomer() {
  return {
    active: true,
    address: {
      city: 'Phoenix',
      state: 'AZ',
      street: '101 Central Ave',
      zip: '85004',
    },
    createdOn: '2026-03-12T15:30:00Z',
    id: 403219,
    name: 'Skyline Bakery',
  }
}

function createDetailCustomer() {
  return {
    ...createListCustomer(),
    contacts: [
      {
        isDefault: true,
        type: 'Phone',
        value: '602-555-0142',
      },
      {
        isDefault: true,
        type: 'Email',
        value: 'ops@skylinebakery.com',
      },
    ],
  }
}
