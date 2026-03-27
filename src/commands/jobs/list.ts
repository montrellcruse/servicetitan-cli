import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toJobSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class JobsList extends BaseCommand {
  public static override description = 'List jobs'

  public static override examples = [
    '<%= config.bin %> jobs list',
    '<%= config.bin %> jobs list --status Scheduled,InProgress --date 2026-03-26',
    '<%= config.bin %> jobs list --fields id,status,customer,total --output csv',
  ]

  public static override flags = {
    ...baseFlags,
    status: Flags.string({
      description: 'Comma-separated job statuses',
    }),
    date: Flags.string({
      description: 'Exact date to filter by (YYYY-MM-DD)',
    }),
    'date-range': Flags.string({
      description: 'Date range to filter by (YYYY-MM-DD..YYYY-MM-DD)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of jobs to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all job pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(JobsList)
    const {client} = await this.initializeRuntime(flags)
    const statusValue = typeof flags.status === 'string' ? flags.status : undefined
    const dateValue = typeof flags.date === 'string' ? flags.date : undefined
    const dateRangeValue =
      typeof flags['date-range'] === 'string' ? flags['date-range'] : undefined
    const {from, to} = parseDateRange(dateRangeValue)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50

    const jobs = await paginate<UnknownRecord>(
      client!,
      '/jobs',
      {
        status: statusValue
          ? statusValue
              .split(',')
              .map((status: string) => status.trim())
              .filter(Boolean)
              .join(',')
          : undefined,
        date: dateValue,
        from,
        to,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(jobs.map(job => toJobSummary(job)), {
      defaultFields: ['id', 'status', 'customer', 'type', 'scheduled', 'total'],
      fields: this.parseFields(flags.fields),
    })
  }
}

function parseDateRange(value: string | undefined): {from?: string; to?: string} {
  if (!value) {
    return {}
  }

  const [from, to] = value.split('..')

  if (!from || !to) {
    throw new Error('Date range must look like YYYY-MM-DD..YYYY-MM-DD.')
  }

  return {from, to}
}
