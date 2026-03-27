import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toPricebookMaterialSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class PricebookMaterials extends BaseCommand {
  public static override description = 'List pricebook materials'

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter materials by active status',
    }),
    search: Flags.string({
      description: 'Search materials by name',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of materials to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all material pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PricebookMaterials)
    const {client} = await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const materials = await paginate<UnknownRecord>(
      client!,
      '/materials',
      {
        active: flags.active,
        page: flags.page,
        search: flags.search,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(materials.map(material => toPricebookMaterialSummary(material)), {
      defaultFields: ['id', 'name', 'price', 'unitCost', 'active'],
      fields: this.parseFields(flags.fields),
    })
  }
}
