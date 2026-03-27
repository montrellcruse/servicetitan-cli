import {afterEach, describe, expect, it, vi} from 'vitest'

import InvoicesGet from '../../src/commands/invoices/get.js'
import InvoicesList from '../../src/commands/invoices/list.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('invoices commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders an invoices table for invoices list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createListInvoice()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await InvoicesList.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/invoices', {
      page: 1,
      pageSize: 50,
      status: undefined,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Exported')
    expect(rendered).toContain('Parkview Dental')
    expect(rendered).toContain('$1,240.00')
    expect(rendered).toContain('$620.00')
  })

  it('fetches and renders a single invoice', async () => {
    const getSpy = vi.fn().mockResolvedValue(createDetailInvoice())
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await InvoicesGet.run(['992417'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/invoices/992417')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('INV-104982')
    expect(rendered).toContain('2026-04-08')
  })
})

function createListInvoice() {
  return {
    balance: '$620.00',
    createdOn: '2026-03-24T17:44:18Z',
    customer: {
      name: 'Parkview Dental',
    },
    id: 992417,
    syncStatus: 'Exported',
    total: '$1,240.00',
  }
}

function createDetailInvoice() {
  return {
    balance: '$620.00',
    createdOn: '2026-03-24T17:44:18Z',
    customer: {
      name: 'Parkview Dental',
    },
    dueDate: '2026-04-08',
    id: 992417,
    invoiceNumber: 'INV-104982',
    jobId: 845118,
    status: 'unpaid',
    total: '$1,240.00',
  }
}
