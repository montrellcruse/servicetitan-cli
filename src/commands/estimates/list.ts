import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toEstimateSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class EstimatesList extends BaseCommand {
  public static override description = 'List estimates'

  public static override flags = {
    ...baseFlags,
    status: Flags.string({
      description: 'Estimate status filter',
      options: ['open', 'sold', 'dismissed'],
    }),
    job: Flags.integer({
      description: 'Job ID filter',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of estimates to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all estimate pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(EstimatesList)
    await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const estimates = await paginate<UnknownRecord>(
      this.requireClient(),
      '/estimates',
      {
        jobId: flags.job,
        page: flags.page,
        status: flags.status,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(estimates.map(estimate => toEstimateSummary(estimate)), {
      defaultFields: ['id', 'status', 'customer', 'job', 'total', 'created'],
      fields: this.parseFields(flags.fields),
    })
  }
}
