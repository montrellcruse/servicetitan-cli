import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toBusinessUnitSummary} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class BusinessUnitsGet extends BaseCommand {
  public static override description = 'Get a single business unit'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Business unit ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BusinessUnitsGet)
    await this.initializeRuntime(flags)
    const businessUnitId = typeof args.id === 'string' ? args.id : undefined

    if (!businessUnitId) {
      throw new Error('Business unit ID is required.')
    }

    const businessUnit = await this.requireClient().get<UnknownRecord>(`/business-units/${businessUnitId}`)
    const record = flags.full ? businessUnit : toBusinessUnitSummary(businessUnit)

    await this.renderRecord(record, {
      defaultFields: flags.full ? undefined : ['id', 'name', 'active'],
    })
  }
}
