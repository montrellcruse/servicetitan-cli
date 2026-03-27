import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'
import {toActivitySummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class TimesheetsList extends BaseCommand {
  public static override description = 'List timesheet activities'

  public static override flags = {
    ...baseFlags,
    technician: Flags.integer({
      description: 'Technician ID filter',
    }),
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
      description: 'Maximum number of activities to return',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(TimesheetsList)
    await this.initializeRuntime(flags)
    const createdOnOrAfter = flags.from
      ? toSTDateTime(assertDateString(flags.from, 'From date'))
      : undefined
    const createdBefore = flags.to
      ? toSTDateTimeExclusiveEnd(assertDateString(flags.to, 'To date'))
      : undefined
    const limit = flags.limit ?? 50
    const activities = await paginate<UnknownRecord>(
      this.requireClient(),
      '/activities',
      {
        createdBefore,
        createdOnOrAfter,
        page: flags.page,
        technicianId: flags.technician,
      },
      {
        limit,
        pageSize: limit,
      },
    )

    await this.renderRecords(activities.map(activity => toActivitySummary(activity)), {
      defaultFields: ['id', 'type', 'technician', 'date', 'duration', 'jobId'],
    })
  }
}
