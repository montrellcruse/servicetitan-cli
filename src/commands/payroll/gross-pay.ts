import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {resolveOptionalDateRange} from '../../lib/date-ranges.js'

export default class PayrollGrossPay extends BaseCommand {
  public static override description = 'List gross pay items'

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
    const {flags} = await this.parse(PayrollGrossPay)
    await this.initializeRuntime(flags)
    const {from, to} = resolveOptionalDateRange({
      from: flags.from,
      to: flags.to,
    })
    const response = await this.requireClient().get<unknown>('/gross-pay-items', {
      from,
      to,
    })
    const grossPayItems = extractResponseRecords(response)

    await this.renderRecords(grossPayItems, {
      defaultFields: ['id', 'employeeId', 'amount', 'type', 'date'],
    })
  }
}
