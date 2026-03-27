import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'
import {toTimesheetSummary} from '../../lib/entities.js'

export default class PayrollTimesheets extends BaseCommand {
  public static override description = 'List payroll job timesheets'

  public static override flags = {
    ...baseFlags,
    from: Flags.string({
      description: 'Created-on-or-after date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'Created-before date, inclusive (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PayrollTimesheets)
    await this.initializeRuntime(flags)
    const createdOnOrAfter = flags.from
      ? toSTDateTime(assertDateString(flags.from, 'From date'))
      : undefined
    const createdBefore = flags.to
      ? toSTDateTimeExclusiveEnd(assertDateString(flags.to, 'To date'))
      : undefined
    const response = await this.requireClient().get<unknown>('/jobs/timesheets', {
      createdBefore,
      createdOnOrAfter,
    })
    const timesheets = extractResponseRecords(response)

    await this.renderRecords(timesheets.map(timesheet => toTimesheetSummary(timesheet)), {
      defaultFields: ['id', 'jobId', 'technicianId', 'startTime', 'endTime', 'duration', 'activityCode'],
    })
  }
}
