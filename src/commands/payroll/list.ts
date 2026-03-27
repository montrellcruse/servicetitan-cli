import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'
import {toPayrollSummary} from '../../lib/entities.js'

export default class PayrollList extends BaseCommand {
  public static override description = 'List payrolls'

  public static override flags = {
    ...baseFlags,
    technician: Flags.integer({
      description: 'Technician ID filter',
    }),
    employee: Flags.integer({
      description: 'Employee ID filter',
    }),
    from: Flags.string({
      description: 'Period started-on-or-after date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'Period ended-on-or-before date (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PayrollList)
    await this.initializeRuntime(flags)
    const startedOnOrAfter = flags.from
      ? toSTDateTime(assertDateString(flags.from, 'From date'))
      : undefined
    const endedOnOrBefore = flags.to
      ? toSTDateTimeExclusiveEnd(assertDateString(flags.to, 'To date'))
      : undefined
    const response = await this.requireClient().get<unknown>('/payrolls', {
      employeeId: flags.employee,
      endedOnOrBefore,
      startedOnOrAfter,
      technicianId: flags.technician,
    })
    const payrolls = extractResponseRecords(response)

    await this.renderRecords(payrolls.map(payroll => toPayrollSummary(payroll)), {
      defaultFields: ['id', 'employee', 'technician', 'periodStart', 'periodEnd', 'total'],
    })
  }
}
