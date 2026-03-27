import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toPricebookEquipmentSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class PricebookEquipment extends BaseCommand {
  public static override description = 'List pricebook equipment'

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter equipment by active status',
    }),
    search: Flags.string({
      description: 'Search equipment by name',
    }),
    limit: Flags.integer({
      description: 'Maximum number of equipment items to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all equipment pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PricebookEquipment)
    const {client} = await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const equipment = await paginate<UnknownRecord>(
      client!,
      '/equipment',
      {
        active: flags.active,
        search: flags.search,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(equipment.map(item => toPricebookEquipmentSummary(item)), {
      defaultFields: ['id', 'name', 'price', 'active'],
      fields: this.parseFields(flags.fields),
    })
  }
}
