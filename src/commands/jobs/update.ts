import {Args, Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString} from '../../lib/date-ranges.js'
import {toJobDetail} from '../../lib/entities.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'
import {buildRequestBody, normalizeJobPriority} from '../../lib/write-ops.js'

const JOB_DETAIL_FIELDS = [
  'id',
  'status',
  'customer',
  'type',
  'scheduled',
  'total',
  'summary',
  'businessUnit',
  'technician',
  'created',
]

export default class JobsUpdate extends BaseCommand {
  public static override description = 'Update a job'

  public static override flags = {
    ...baseFlags,
    summary: Flags.string({
      description: 'Job summary',
    }),
    priority: Flags.string({
      description: 'Job priority',
      options: ['low', 'medium', 'high', 'urgent'],
    }),
    status: Flags.string({
      description: 'Job status',
    }),
    tech: Flags.integer({
      description: 'Technician ID',
    }),
    date: Flags.string({
      description: 'Scheduled date (YYYY-MM-DD)',
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
      description: 'Job ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(JobsUpdate)
    const {client} = await this.initializeRuntime(flags)
    const jobId = typeof args.id === 'string' ? args.id : undefined

    if (!jobId) {
      throw new Error('Job ID is required.')
    }

    const scheduledDate = flags.date ? assertDateString(flags.date, 'Date') : undefined
    const path = `/jobs/${jobId}`
    const body = buildRequestBody([
      ['summary', flags.summary],
      ['priority', normalizeJobPriority(flags.priority)],
      ['status', flags.status],
      ['technicianId', flags.tech],
      ['scheduledDate', scheduledDate],
    ])

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided.')
    }

    if (flags['dry-run']) {
      printDryRun('PATCH', client!.resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Update job ${jobId}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    const response = await client!.patch<unknown>(path, body)
    const job = toJobDetail(extractResponseRecords(response)[0] ?? response)

    printSuccess('Job updated.')
    await this.renderRecord(job, {defaultFields: JOB_DETAIL_FIELDS})
  }
}
