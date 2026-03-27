import {afterEach, describe, expect, it, vi} from 'vitest'

import InventoryPurchaseOrders from '../../src/commands/inventory/purchase-orders.js'
import InventoryTrucks from '../../src/commands/inventory/trucks.js'
import InventoryVendors from '../../src/commands/inventory/vendors.js'
import InventoryWarehouses from '../../src/commands/inventory/warehouses.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('inventory commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a purchase orders table', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createPurchaseOrder()],
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await InventoryPurchaseOrders.run(['--vendor', '17', '--status', 'Open'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/purchase-orders', {
      createdBefore: undefined,
      createdOnOrAfter: undefined,
      status: 'Open',
      vendorId: 17,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('PO-1007')
    expect(rendered).toContain('Supply House')
  })

  it('renders inventory vendors', async () => {
    const getSpy = vi.fn().mockResolvedValue([{active: true, id: 17, name: 'Supply House'}])
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await InventoryVendors.run(['--active'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/vendors', {
      active: true,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Supply House')
  })

  it('renders inventory trucks', async () => {
    const getSpy = vi.fn().mockResolvedValue([{active: true, id: 9, name: 'Truck 9', number: 'TRK-009'}])
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await InventoryTrucks.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/trucks')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Truck 9')
    expect(rendered).toContain('TRK-009')
  })

  it('renders inventory warehouses', async () => {
    const getSpy = vi.fn().mockResolvedValue([{active: true, id: 3, name: 'Main Warehouse'}])
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await InventoryWarehouses.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/warehouses')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Main Warehouse')
  })
})

function createPurchaseOrder() {
  return {
    id: 1007,
    number: 'PO-1007',
    status: 'Open',
    total: 842.5,
    vendor: {
      name: 'Supply House',
    },
  }
}
