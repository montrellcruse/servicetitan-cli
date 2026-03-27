import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'

export default class PayrollGrossPay extends BaseCommand {
  public static override description = 'List gross pay items'

  public static override flags = {
    ...baseFlags,
    from: Flags.string({
      description: 'Item date on-or-after (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'Item date on-or-before, inclusive (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PayrollGrossPay)
    await this.initializeRuntime(flags)
    const dateOnOrAfter = flags.from
      ? toSTDateTime(assertDateString(flags.from, 'From date'))
      : undefined
    const dateOnOrBefore = flags.to
      ? toSTDateTimeExclusiveEnd(assertDateString(flags.to, 'To date'))
      : undefined
    const response = await this.requireClient().get<unknown>('/gross-pay-items', {
      dateOnOrAfter,
      dateOnOrBefore,
    })
    const grossPayItems = extractResponseRecords(response)

    await this.renderRecords(grossPayItems, {
      defaultFields: ['id', 'employeeId', 'amount', 'type', 'date'],
    })
  }
}
