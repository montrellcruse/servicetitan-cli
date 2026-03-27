import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toEstimateDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class EstimatesGet extends BaseCommand {
  public static override description = 'Get a single estimate'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Estimate ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(EstimatesGet)
    const {client} = await this.initializeRuntime(flags)
    const estimateId = typeof args.id === 'string' ? args.id : undefined

    if (!estimateId) {
      throw new Error('Estimate ID is required.')
    }

    const estimate = await client!.get<UnknownRecord>(`/estimates/${estimateId}`)
    const record = flags.full ? estimate : toEstimateDetail(estimate)

    await this.renderRecord(record, {
      defaultFields: flags.full
        ? undefined
        : ['id', 'status', 'customer', 'job', 'total', 'created', 'name', 'soldOn', 'dismissedOn', 'createdBy'],
    })
  }
}
