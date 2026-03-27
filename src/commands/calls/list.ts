import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {resolveOptionalDateRange} from '../../lib/date-ranges.js'
import {toCallSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class CallsList extends BaseCommand {
  public static override description = 'List calls'

  public static override flags = {
    ...baseFlags,
    from: Flags.string({
      description: 'Start date filter (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'End date filter (YYYY-MM-DD)',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of calls to return',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CallsList)
    await this.initializeRuntime(flags)
    const {from, to} = resolveOptionalDateRange({
      from: flags.from,
      to: flags.to,
    })
    const limit = flags.limit ?? 50
    const calls = await paginate<UnknownRecord>(
      this.requireClient(),
      '/calls',
      {
        from,
        page: flags.page,
        to,
      },
      {
        limit,
        pageSize: limit,
      },
    )

    await this.renderRecords(calls.map(call => toCallSummary(call)), {
      defaultFields: ['id', 'status', 'duration', 'createdOn', 'answeredBy', 'customer', 'reason'],
    })
  }
}
