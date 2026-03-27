import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toMembershipTypeSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class MembershipsTypes extends BaseCommand {
  public static override description = 'List membership types'

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter membership types by active status',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of membership types to return',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MembershipsTypes)
    const {client} = await this.initializeRuntime(flags)
    const limit = flags.limit ?? 50
    const membershipTypes = await paginate<UnknownRecord>(
      client!,
      '/membership-types',
      {
        active: flags.active,
        page: flags.page,
      },
      {
        limit,
        pageSize: limit,
      },
    )

    await this.renderRecords(membershipTypes.map(typeRecord => toMembershipTypeSummary(typeRecord)), {
      defaultFields: ['id', 'name', 'duration', 'price', 'active'],
    })
  }
}
