import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toProposalTypeSummary} from '../../lib/entities.js'

export default class ProposalTypesList extends BaseCommand {
  public static override description = 'List proposal types'

  public static override flags = {
    ...baseFlags,
    active: Flags.string({
      description: 'Filter by active status',
      options: ['True', 'Any', 'False'],
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ProposalTypesList)
    await this.initializeRuntime(flags)
    const response = await this.requireClient().get<unknown>('/proposal-types', {
      active: flags.active,
    })
    const proposalTypes = extractResponseRecords(response)

    await this.renderRecords(proposalTypes.map(proposalType => toProposalTypeSummary(proposalType)), {
      defaultFields: ['id', 'name', 'type', 'active', 'isDefault', 'isSystemDefault'],
      fields: this.parseFields(flags.fields),
    })
  }
}
