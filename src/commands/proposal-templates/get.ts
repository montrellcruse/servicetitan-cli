import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toProposalTemplateDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class ProposalTemplatesGet extends BaseCommand {
  public static override description = 'Get a single proposal template'

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
      description: 'Proposal template ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ProposalTemplatesGet)
    await this.initializeRuntime(flags)
    const templateId = typeof args.id === 'string' ? args.id : undefined

    if (!templateId) {
      throw new Error('Proposal template ID is required.')
    }

    const template = await this.requireClient().get<UnknownRecord>(`/proposal-templates/${templateId}`)
    const record = flags.full ? template : toProposalTemplateDetail(template)

    await this.renderRecord(record, {
      defaultFields: flags.full
        ? undefined
        : [
            'id',
            'name',
            'status',
            'active',
            'proposalTypeId',
            'proposalTypeName',
            'description',
            'businessUnitIds',
            'estimateAssignments',
            'modified',
          ],
      fields: this.parseFields(flags.fields),
    })
  }
}
