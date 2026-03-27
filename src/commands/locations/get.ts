import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toLocationDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

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

export default class LocationsGet extends BaseCommand {
  public static override description = 'Get a single location'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Location ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(LocationsGet)
    await this.initializeRuntime(flags)
    const locationId = typeof args.id === 'string' ? args.id : undefined

    if (!locationId) {
      throw new Error('Location ID is required.')
    }

    const location = await this.requireClient().get<UnknownRecord>(`/locations/${locationId}`)
    const record = flags.full ? location : toLocationDetail(location)

    await this.renderRecord(record, {
      defaultFields: flags.full ? undefined : LOCATION_DETAIL_FIELDS,
    })
  }
}
