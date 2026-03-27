import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {resolveOptionalDateRange} from '../../lib/date-ranges.js'
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
      description: 'Start date filter (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'End date filter (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PayrollList)
    await this.initializeRuntime(flags)
    const {from, to} = resolveOptionalDateRange({
      from: flags.from,
      to: flags.to,
    })
    const response = await this.requireClient().get<unknown>('/payrolls', {
      employeeId: flags.employee,
      from,
      technicianId: flags.technician,
      to,
    })
    const payrolls = extractResponseRecords(response)

    await this.renderRecords(payrolls.map(payroll => toPayrollSummary(payroll)), {
      defaultFields: ['id', 'employee', 'technician', 'periodStart', 'periodEnd', 'total'],
    })
  }
}
