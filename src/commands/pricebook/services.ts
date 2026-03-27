import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toPricebookServiceSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class PricebookServices extends BaseCommand {
  public static override description = 'List pricebook services'

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter services by active status',
    }),
    search: Flags.string({
      description: 'Search services by name',
    }),
    category: Flags.string({
      description: 'Service category filter',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of services to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all service pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PricebookServices)
    await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const services = await paginate<UnknownRecord>(
      this.requireClient(),
      '/services',
      {
        active: flags.active,
        category: flags.category,
        page: flags.page,
        search: flags.search,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(services.map(service => toPricebookServiceSummary(service)), {
      defaultFields: ['id', 'name', 'price', 'duration', 'active'],
      fields: this.parseFields(flags.fields),
    })
  }
}
