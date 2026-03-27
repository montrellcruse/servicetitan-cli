import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toCustomerSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class CustomersList extends BaseCommand {
  public static override description = 'List customers'

  public static override examples = [
    '<%= config.bin %> customers list',
    '<%= config.bin %> customers list --output json | jq .[0]',
    '<%= config.bin %> customers list --fields id,name,phone',
  ]

  public static override flags = {
    ...baseFlags,
    search: Flags.string({
      description: 'Customer search string',
    }),
    active: Flags.boolean({
      description: 'Only include active customers',
    }),
    limit: Flags.integer({
      description: 'Maximum number of customers to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all customer pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CustomersList)
    const {client} = await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const customers = await paginate<UnknownRecord>(
      client!,
      '/customers',
      {
        search: flags.search,
        active: flags.active ? true : undefined,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(customers.map(customer => toCustomerSummary(customer)), {
      defaultFields: ['id', 'name', 'phone', 'email', 'active', 'created'],
      fields: this.parseFields(flags.fields),
    })
  }
}
