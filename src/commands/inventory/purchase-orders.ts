import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'
import {toPurchaseOrderSummary} from '../../lib/entities.js'

export default class InventoryPurchaseOrders extends BaseCommand {
  public static override description = 'List purchase orders'

  public static override flags = {
    ...baseFlags,
    vendor: Flags.integer({
      description: 'Vendor ID filter',
    }),
    status: Flags.string({
      description: 'Purchase order status filter',
    }),
    from: Flags.string({
      description: 'Created-on-or-after date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'Created-before date, inclusive (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InventoryPurchaseOrders)
    await this.initializeRuntime(flags)
    const createdOnOrAfter = flags.from
      ? toSTDateTime(assertDateString(flags.from, 'From date'))
      : undefined
    const createdBefore = flags.to
      ? toSTDateTimeExclusiveEnd(assertDateString(flags.to, 'To date'))
      : undefined
    const response = await this.requireClient().get<unknown>('/purchase-orders', {
      createdBefore,
      createdOnOrAfter,
      status: flags.status,
      vendorId: flags.vendor,
    })
    const purchaseOrders = extractResponseRecords(response)

    await this.renderRecords(purchaseOrders.map(purchaseOrder => toPurchaseOrderSummary(purchaseOrder)), {
      defaultFields: ['id', 'number', 'vendor', 'status', 'date', 'total'],
    })
  }
}
