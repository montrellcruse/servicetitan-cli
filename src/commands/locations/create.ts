import {Flags} from '@oclif/core'

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

export default class LocationsCreate extends BaseCommand {
  public static override description = 'Create a location'

  public static override flags = {
    ...baseFlags,
    name: Flags.string({
      description: 'Location name',
      required: true,
    }),
    address: Flags.string({
      description: 'Street address',
      required: true,
    }),
    customer: Flags.integer({
      description: 'Customer ID',
      required: true,
    }),
    yes: Flags.boolean({
      description: 'Skip the confirmation prompt',
    }),
    'dry-run': Flags.boolean({
      description: 'Print the request without sending it',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(LocationsCreate)
    await this.initializeRuntime(flags)
    const path = '/locations'
    const body = buildRequestBody([
      ['name', flags.name],
      ['customerId', flags.customer],
      ['address', buildAddressBody({address: flags.address})],
    ])

    if (flags['dry-run']) {
      printDryRun('POST', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(
      `Create location '${flags.name}' for customer ${flags.customer}?`,
      flags.yes ?? false,
    )

    if (!confirmed) {
      return
    }

    const response = await this.requireClient().post<unknown>(path, body)
    const location = toLocationDetail(extractResponseRecords(response)[0] ?? response)
    const locationId = typeof location.id === 'number' || typeof location.id === 'string' ? location.id : ''

    printSuccess(`Location created: ID ${locationId}`)
    await this.renderRecord(location, {defaultFields: LOCATION_DETAIL_FIELDS})
  }
}
