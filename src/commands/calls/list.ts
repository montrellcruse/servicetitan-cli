import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'
import {toCallSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class CallsList extends BaseCommand {
  public static override description = 'List calls'

  public static override flags = {
    ...baseFlags,
    from: Flags.string({
      description: 'Created-on-or-after date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'Created-before date, inclusive (YYYY-MM-DD)',
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
    const createdOnOrAfter = flags.from
      ? toSTDateTime(assertDateString(flags.from, 'From date'))
      : undefined
    const createdBefore = flags.to
      ? toSTDateTimeExclusiveEnd(assertDateString(flags.to, 'To date'))
      : undefined
    const limit = flags.limit ?? 50
    const calls = await paginate<UnknownRecord>(
      this.requireClient(),
      '/calls',
      {
        createdBefore,
        createdOnOrAfter,
        page: flags.page,
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
