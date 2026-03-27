import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toJobDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class JobsGet extends BaseCommand {
  public static override description = 'Get a single job'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Job ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(JobsGet)
    const {client} = await this.initializeRuntime(flags)
    const jobId = typeof args.id === 'string' ? args.id : undefined

    if (!jobId) {
      throw new Error('Job ID is required.')
    }

    const job = await client!.get<UnknownRecord>(`/jobs/${jobId}`)
    const record = flags.full ? job : toJobDetail(job)

    await this.renderRecord(record, {
      defaultFields: flags.full
        ? undefined
        : ['id', 'status', 'customer', 'type', 'scheduled', 'total', 'summary', 'businessUnit', 'technician', 'created'],
    })
  }
}
