import {Args, Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toLocationDetail} from '../../lib/entities.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'
import {buildAddressBody, buildRequestBody} from '../../lib/write-ops.js'

const LOCATION_DETAIL_FIELDS = [
  'id',
  'name',
  'address',
  'city',
  'state',
  'zip',
  'customerId',
  'active',
  'contacts',
  'notes',
]

export default class LocationsUpdate extends BaseCommand {
  public static override description = 'Update a location'

  public static override flags = {
    ...baseFlags,
    name: Flags.string({
      description: 'Location name',
    }),
    address: Flags.string({
      description: 'Street address',
    }),
    customer: Flags.integer({
      description: 'Customer ID',
    }),
    active: Flags.boolean({
      allowNo: true,
      description: 'Set the location active status',
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
      description: 'Location ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(LocationsUpdate)
    await this.initializeRuntime(flags)
    const locationId = typeof args.id === 'string' ? args.id : undefined

    if (!locationId) {
      throw new Error('Location ID is required.')
    }

    const path = `/locations/${locationId}`
    const body = buildRequestBody([
      ['name', flags.name],
      ['customerId', flags.customer],
      ['address', buildAddressBody({address: flags.address})],
      ['active', flags.active],
    ])

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided.')
    }

    if (flags['dry-run']) {
      printDryRun('PATCH', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Update location ${locationId}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    const response = await this.requireClient().patch<unknown>(path, body)
    const location = toLocationDetail(extractResponseRecords(response)[0] ?? response)

    printSuccess('Location updated.')
    await this.renderRecord(location, {defaultFields: LOCATION_DETAIL_FIELDS})
  }
}
