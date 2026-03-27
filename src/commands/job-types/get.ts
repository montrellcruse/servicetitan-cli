import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toJobTypeSummary} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class JobTypesGet extends BaseCommand {
  public static override description = 'Get a single job type'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Job type ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(JobTypesGet)
    const {client} = await this.initializeRuntime(flags)
    const jobTypeId = typeof args.id === 'string' ? args.id : undefined

    if (!jobTypeId) {
      throw new Error('Job type ID is required.')
    }

    const jobType = await client!.get<UnknownRecord>(`/job-types/${jobTypeId}`)
    const record = flags.full ? jobType : toJobTypeSummary(jobType)

    await this.renderRecord(record, {
      defaultFields: flags.full ? undefined : ['id', 'name', 'duration', 'active'],
    })
  }
}
