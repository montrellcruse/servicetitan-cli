import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toEstimateTemplateDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class EstimateTemplatesGet extends BaseCommand {
  public static override description = 'Get a single estimate template'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Estimate template ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(EstimateTemplatesGet)
    await this.initializeRuntime(flags)
    const templateId = typeof args.id === 'string' ? args.id : undefined

    if (!templateId) {
      throw new Error('Estimate template ID is required.')
    }

    const template = await this.requireClient().get<UnknownRecord>(`/estimate-templates/${templateId}`)
    const record = flags.full ? template : toEstimateTemplateDetail(template)

    await this.renderRecord(record, {
      defaultFields: flags.full
        ? undefined
        : ['id', 'name', 'internalName', 'mode', 'active', 'businessUnitId', 'totalPrice', 'summary', 'items', 'modified'],
      fields: this.parseFields(flags.fields),
    })
  }
}
