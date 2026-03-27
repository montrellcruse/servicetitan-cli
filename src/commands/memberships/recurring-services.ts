import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class MembershipsRecurringServices extends BaseCommand {
  public static override description = 'List recurring services'

  public static override flags = {
    ...baseFlags,
    membership: Flags.integer({
      description: 'Membership ID filter',
    }),
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter recurring services by active status',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(MembershipsRecurringServices)
    const {client} = await this.initializeRuntime(flags)
    const response = await client!.get<unknown>('/recurring-services', {
      active: flags.active,
      membershipId: flags.membership,
    })
    const recurringServices = extractResponseRecords(response)

    await this.renderRecords(recurringServices, {
      defaultFields: ['id', 'name', 'membershipId', 'active'],
    })
  }
}
