import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toLeadSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class LeadsList extends BaseCommand {
  public static override description = 'List leads'

  public static override flags = {
    ...baseFlags,
    status: Flags.string({
      description: 'Lead status filter',
      options: ['open', 'won', 'lost', 'dismissed'],
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of leads to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all lead pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(LeadsList)
    await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const leads = await paginate<UnknownRecord>(
      this.requireClient(),
      '/leads',
      {
        page: flags.page,
        status: flags.status,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(leads.map(lead => toLeadSummary(lead)), {
      defaultFields: ['id', 'status', 'customer', 'campaign', 'created'],
      fields: this.parseFields(flags.fields),
    })
  }
}
