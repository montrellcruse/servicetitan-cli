import {Args} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class CustomersContacts extends BaseCommand {
  public static override description = 'List customer contacts'

  public static override flags = {
    ...baseFlags,
  }

  public static override args = {
    id: Args.string({
      description: 'Customer ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CustomersContacts)
    await this.initializeRuntime(flags)
    const customerId = typeof args.id === 'string' ? args.id : undefined

    if (!customerId) {
      throw new Error('Customer ID is required.')
    }

    const response = await this.requireClient().get<unknown>(`/customers/${customerId}/contacts`)
    const contacts = extractResponseRecords(response)

    await this.renderRecords(contacts, {
      defaultFields: ['id', 'type', 'value', 'memo', 'isDefault'],
    })
  }
}
