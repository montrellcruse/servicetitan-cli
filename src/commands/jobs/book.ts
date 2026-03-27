import {Flags} from '@oclif/core'

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

export default class JobsBook extends BaseCommand {
  public static override description = 'Book a job'

  public static override flags = {
    ...baseFlags,
    customer: Flags.integer({
      description: 'Customer ID',
      required: true,
    }),
    type: Flags.integer({
      description: 'Job type ID',
      required: true,
    }),
    date: Flags.string({
      description: 'Scheduled date (YYYY-MM-DD)',
      required: true,
    }),
    tech: Flags.integer({
      description: 'Technician ID',
    }),
    priority: Flags.string({
      description: 'Job priority',
      options: ['low', 'medium', 'high', 'urgent'],
    }),
    summary: Flags.string({
      description: 'Job summary',
    }),
    location: Flags.integer({
      description: 'Location ID',
      required: true,
    }),
    'business-unit': Flags.integer({
      description: 'Business unit ID',
    }),
    yes: Flags.boolean({
      description: 'Skip the confirmation prompt',
    }),
    'dry-run': Flags.boolean({
      description: 'Print the request without sending it',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(JobsBook)
    await this.initializeRuntime(flags)
    const scheduledDate = assertDateString(flags.date, 'Date')
    const path = '/jobs'
    const body = buildRequestBody([
      ['customerId', flags.customer],
      ['jobTypeId', flags.type],
      ['scheduledDate', scheduledDate],
      ['technicianId', flags.tech],
      ['priority', normalizeJobPriority(flags.priority)],
      ['summary', flags.summary],
      ['locationId', flags.location],
      ['businessUnitId', flags['business-unit']],
    ])

    if (flags['dry-run']) {
      printDryRun('POST', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(
      `Book job for customer ${flags.customer} on ${scheduledDate}?`,
      flags.yes ?? false,
    )

    if (!confirmed) {
      return
    }

    const response = await this.requireClient().post<unknown>(path, body)
    const job = toJobDetail(extractResponseRecords(response)[0] ?? response)
    const jobId = typeof job.id === 'number' || typeof job.id === 'string' ? job.id : ''

    printSuccess(`Job booked: ID ${jobId}`)
    await this.renderRecord(job, {defaultFields: JOB_DETAIL_FIELDS})
  }
}
