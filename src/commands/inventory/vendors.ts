import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toVendorSummary} from '../../lib/entities.js'

export default class InventoryVendors extends BaseCommand {
  public static override description = 'List inventory vendors'

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter vendors by active status',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InventoryVendors)
    const {client} = await this.initializeRuntime(flags)
    const response = await client!.get<unknown>('/vendors', {
      active: flags.active,
    })
    const vendors = extractResponseRecords(response)

    await this.renderRecords(vendors.map(vendor => toVendorSummary(vendor)), {
      defaultFields: ['id', 'name', 'active'],
    })
  }
}
