import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'
import {toJobSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class JobsList extends BaseCommand {
  public static override description = 'List jobs'

  public static override examples = [
    '<%= config.bin %> jobs list',
    '<%= config.bin %> jobs list --status Scheduled,InProgress --date 2026-03-26',
    '<%= config.bin %> jobs list --from 2026-03-01 --to 2026-03-31',
    '<%= config.bin %> jobs list --completed-from 2026-03-01 --completed-to 2026-03-31',
    '<%= config.bin %> jobs list --fields id,status,customer,total --output csv',
  ]

  public static override flags = {
    ...baseFlags,
    status: Flags.string({
      description: 'Comma-separated job statuses',
    }),
    date: Flags.string({
      description: 'Exact creation date to filter by (YYYY-MM-DD)',
    }),
    from: Flags.string({
      description: 'Created-on-or-after date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'Created-before date, inclusive (YYYY-MM-DD)',
    }),
    'completed-from': Flags.string({
      description: 'Completed-on-or-after date (YYYY-MM-DD)',
    }),
    'completed-to': Flags.string({
      description: 'Completed-before date, inclusive (YYYY-MM-DD)',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
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
    await this.initializeRuntime(flags)
    const statusValue = typeof flags.status === 'string' ? flags.status : undefined

    // Single-day --date sets a full-day range
    let createdOnOrAfter: string | undefined
    let createdBefore: string | undefined

    if (flags.date) {
      const d = assertDateString(flags.date, 'Date')
      createdOnOrAfter = toSTDateTime(d)
      createdBefore = toSTDateTimeExclusiveEnd(d)
    } else {
      if (flags.from) {
        createdOnOrAfter = toSTDateTime(assertDateString(flags.from, 'From date'))
      }

      if (flags.to) {
        createdBefore = toSTDateTimeExclusiveEnd(assertDateString(flags.to, 'To date'))
      }
    }

    let completedOnOrAfter: string | undefined
    let completedBefore: string | undefined

    if (flags['completed-from']) {
      completedOnOrAfter = toSTDateTime(assertDateString(flags['completed-from'], 'Completed from date'))
    }

    if (flags['completed-to']) {
      completedBefore = toSTDateTimeExclusiveEnd(assertDateString(flags['completed-to'], 'Completed to date'))
    }

    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50

    const jobs = await paginate<UnknownRecord>(
      this.requireClient(),
      '/jobs',
      {
        completedBefore,
        completedOnOrAfter,
        createdBefore,
        createdOnOrAfter,
        page: flags.page,
        status: statusValue
          ? statusValue
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
              .join(',')
          : undefined,
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
