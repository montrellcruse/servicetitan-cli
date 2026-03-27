import {Args} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toMembershipDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class MembershipsGet extends BaseCommand {
  public static override description = 'Get a single membership'

  public static override flags = {
    ...baseFlags,
  }

  public static override args = {
    id: Args.string({
      description: 'Membership ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(MembershipsGet)
    await this.initializeRuntime(flags)
    const membershipId = typeof args.id === 'string' ? args.id : undefined

    if (!membershipId) {
      throw new Error('Membership ID is required.')
    }

    const membership = await this.requireClient().get<UnknownRecord>(`/memberships/${membershipId}`)

    await this.renderRecord(toMembershipDetail(membership), {
      defaultFields: ['id', 'type', 'customer', 'status', 'start', 'end', 'recurring', 'price', 'billingFrequency', 'created'],
    })
  }
}
