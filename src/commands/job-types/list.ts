import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toJobTypeSummary} from '../../lib/entities.js'

export default class JobTypesList extends BaseCommand {
  public static override description = 'List job types'

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter job types by active status',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(JobTypesList)
    const {client} = await this.initializeRuntime(flags)
    const response = await client!.get<unknown>('/job-types', {
      active: flags.active,
    })
    const jobTypes = extractResponseRecords(response)

    await this.renderRecords(jobTypes.map(jobType => toJobTypeSummary(jobType)), {
      defaultFields: ['id', 'name', 'duration', 'active'],
    })
  }
}
