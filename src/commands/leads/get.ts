import {Args} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toLeadDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class LeadsGet extends BaseCommand {
  public static override description = 'Get a single lead'

  public static override flags = {
    ...baseFlags,
  }

  public static override args = {
    id: Args.string({
      description: 'Lead ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(LeadsGet)
    await this.initializeRuntime(flags)
    const leadId = typeof args.id === 'string' ? args.id : undefined

    if (!leadId) {
      throw new Error('Lead ID is required.')
    }

    const lead = await this.requireClient().get<UnknownRecord>(`/leads/${leadId}`)

    await this.renderRecord(toLeadDetail(lead), {
      defaultFields: ['id', 'status', 'customer', 'campaign', 'created', 'phone', 'email', 'assignedTo', 'source'],
    })
  }
}
