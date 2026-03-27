import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {resolveOptionalDateRange} from '../../lib/date-ranges.js'
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
      description: 'Start date filter (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'End date filter (YYYY-MM-DD)',
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
    const {from, to} = resolveOptionalDateRange({
      from: flags.from,
      to: flags.to,
    })
    const limit = flags.limit ?? 50
    const activities = await paginate<UnknownRecord>(
      this.requireClient(),
      '/activities',
      {
        from,
        page: flags.page,
        technicianId: flags.technician,
        to,
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
