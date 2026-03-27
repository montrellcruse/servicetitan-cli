import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'
import {toLocationSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class LocationsList extends BaseCommand {
  public static override description = 'List locations'

  public static override flags = {
    ...baseFlags,
    customer: Flags.integer({
      description: 'Customer ID filter',
    }),
    from: Flags.string({
      description: 'Created-on-or-after date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'Created-before date, inclusive (YYYY-MM-DD)',
    }),
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter locations by active status',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of locations to return',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(LocationsList)
    await this.initializeRuntime(flags)
    const createdOnOrAfter = flags.from
      ? toSTDateTime(assertDateString(flags.from, 'From date'))
      : undefined
    const createdBefore = flags.to
      ? toSTDateTimeExclusiveEnd(assertDateString(flags.to, 'To date'))
      : undefined
    const limit = flags.limit ?? 50
    const locations = await paginate<UnknownRecord>(
      this.requireClient(),
      '/locations',
      {
        active: flags.active,
        createdBefore,
        createdOnOrAfter,
        customerId: flags.customer,
        page: flags.page,
      },
      {
        limit,
        pageSize: limit,
      },
    )

    await this.renderRecords(locations.map(location => toLocationSummary(location)), {
      defaultFields: ['id', 'name', 'address', 'city', 'state', 'zip', 'customerId', 'active'],
    })
  }
}
