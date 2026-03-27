import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {resolveOptionalDateRange} from '../../lib/date-ranges.js'
import {toTimesheetSummary} from '../../lib/entities.js'

export default class PayrollTimesheets extends BaseCommand {
  public static override description = 'List payroll job timesheets'

  public static override flags = {
    ...baseFlags,
    from: Flags.string({
      description: 'Start date filter (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'End date filter (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PayrollTimesheets)
    await this.initializeRuntime(flags)
    const {from, to} = resolveOptionalDateRange({
      from: flags.from,
      to: flags.to,
    })
    const response = await this.requireClient().get<unknown>('/jobs/timesheets', {
      from,
      to,
    })
    const timesheets = extractResponseRecords(response)

    await this.renderRecords(timesheets.map(timesheet => toTimesheetSummary(timesheet)), {
      defaultFields: ['id', 'jobId', 'technicianId', 'startTime', 'endTime', 'duration', 'activityCode'],
    })
  }
}
