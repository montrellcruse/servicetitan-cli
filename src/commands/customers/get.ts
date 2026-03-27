import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toCustomerDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class CustomersGet extends BaseCommand {
  public static override description = 'Get a single customer'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Customer ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CustomersGet)
    const {client} = await this.initializeRuntime(flags)
    const customerId = typeof args.id === 'string' ? args.id : undefined

    if (!customerId) {
      throw new Error('Customer ID is required.')
    }

    const customer = await client!.get<UnknownRecord>(`/customers/${customerId}`)
    const record = flags.full ? customer : toCustomerDetail(customer)

    await this.renderRecord(record, {
      defaultFields: flags.full
        ? undefined
        : ['id', 'name', 'phone', 'email', 'active', 'created', 'address', 'city', 'state', 'zip'],
    })
  }
}
