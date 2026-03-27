import {Flags} from '@oclif/core'

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

export default class CustomersCreate extends BaseCommand {
  public static override description = 'Create a customer'

  public static override flags = {
    ...baseFlags,
    name: Flags.string({
      description: 'Customer name',
      required: true,
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

  public async run(): Promise<void> {
    const {flags} = await this.parse(CustomersCreate)
    await this.initializeRuntime(flags)
    const path = '/customers'
    const body = buildRequestBody([
      ['name', flags.name],
      ['phone', flags.phone],
      ['email', flags.email],
      ['address', buildAddressBody(flags)],
    ])

    if (flags['dry-run']) {
      printDryRun('POST', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Create customer '${flags.name}'?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    const response = await this.requireClient().post<unknown>(path, body)
    const customer = toCustomerDetail(extractResponseRecords(response)[0] ?? response)
    const customerId = typeof customer.id === 'number' || typeof customer.id === 'string' ? customer.id : ''

    printSuccess(`Customer created: ID ${customerId}`)
    await this.renderRecord(customer, {defaultFields: CUSTOMER_DETAIL_FIELDS})
  }
}
