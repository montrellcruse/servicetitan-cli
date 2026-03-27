import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toMembershipSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class MembershipsList extends BaseCommand {
  public static override description = 'List memberships'

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      description: 'Only include active memberships (status=Active)',
    }),
    customer: Flags.integer({
      description: 'Customer ID filter',
    }),
    type: Flags.string({
      description: 'Membership type filter',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of memberships to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all membership pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MembershipsList)
    await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const memberships = await paginate<UnknownRecord>(
      this.requireClient(),
      '/memberships',
      {
        status: flags.active ? 'Active' : undefined,
        customerId: flags.customer,
        page: flags.page,
        type: flags.type,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(memberships.map(membership => toMembershipSummary(membership)), {
      defaultFields: ['id', 'type', 'customer', 'status', 'start', 'end', 'recurring'],
      fields: this.parseFields(flags.fields),
    })
  }
}
