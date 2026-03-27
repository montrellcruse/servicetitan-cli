import {Args, Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toCustomerDetail} from '../../lib/entities.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'
import {buildAddressBody, buildRequestBody} from '../../lib/write-ops.js'

const CUSTOMER_DETAIL_FIELDS = [
  'id',
  'name',
  'phone',
  'email',
  'active',
  'created',
  'address',
  'city',
  'state',
  'zip',
]

export default class CustomersUpdate extends BaseCommand {
  public static override description = 'Update a customer'

  public static override flags = {
    ...baseFlags,
    name: Flags.string({
      description: 'Customer name',
    }),
    phone: Flags.string({
      description: 'Primary phone number',
    }),
    email: Flags.string({
      description: 'Primary email address',
    }),
    address: Flags.string({
      description: 'Street address',
    }),
    city: Flags.string({
      description: 'City',
    }),
    state: Flags.string({
      description: 'State (2-letter code)',
    }),
    zip: Flags.string({
      description: 'ZIP or postal code',
    }),
    yes: Flags.boolean({
      description: 'Skip the confirmation prompt',
    }),
    'dry-run': Flags.boolean({
      description: 'Print the request without sending it',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Customer ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CustomersUpdate)
    await this.initializeRuntime(flags)
    const customerId = typeof args.id === 'string' ? args.id : undefined

    if (!customerId) {
      throw new Error('Customer ID is required.')
    }

    const path = `/customers/${customerId}`
    const body = buildRequestBody([
      ['name', flags.name],
      ['phone', flags.phone],
      ['email', flags.email],
      ['address', buildAddressBody(flags)],
    ])

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided.')
    }

    if (flags['dry-run']) {
      printDryRun('PATCH', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Update customer ${customerId}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    const response = await this.requireClient().patch<unknown>(path, body)
    const customer = toCustomerDetail(extractResponseRecords(response)[0] ?? response)

    printSuccess('Customer updated.')
    await this.renderRecord(customer, {defaultFields: CUSTOMER_DETAIL_FIELDS})
  }
}
