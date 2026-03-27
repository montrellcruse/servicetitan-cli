import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {extractResponseRecords} from '../../lib/api.js'
import {assertDateString, getTodayDate} from '../../lib/date-ranges.js'
import {toCapacitySummary} from '../../lib/entities.js'

export default class DispatchCapacity extends BaseCommand {
  public static override description = 'Show dispatch capacity'

  public static override flags = {
    ...baseFlags,
    date: Flags.string({
      description: 'Capacity date (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DispatchCapacity)
    const {client} = await this.initializeRuntime(flags)
    const date = assertDateString(flags.date ?? getTodayDate(), 'Date')
    const response = await client!.get<unknown>('/capacity', {date})
    const capacity = extractResponseRecords(response)

    await this.renderRecords(capacity.map(item => toCapacitySummary(item)), {
      defaultFields: ['businessUnit', 'available', 'scheduled'],
    })
  }
}
