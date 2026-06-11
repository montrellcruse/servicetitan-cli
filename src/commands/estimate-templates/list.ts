import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'
import {toEstimateTemplateSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class EstimateTemplatesList extends BaseCommand {
  public static override description = 'List estimate templates'

  public static override flags = {
    ...baseFlags,
    active: Flags.string({
      description: 'Filter by active status',
      options: ['True', 'Any', 'False'],
    }),
    'modified-from': Flags.string({
      description: 'Modified-on-or-after date (YYYY-MM-DD)',
    }),
    'modified-to': Flags.string({
      description: 'Modified-before date, inclusive (YYYY-MM-DD)',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of estimate templates to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all estimate template pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(EstimateTemplatesList)
    await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const templates = await paginate<UnknownRecord>(
      this.requireClient(),
      '/estimate-templates',
      {
        active: flags.active,
        modifiedBefore: flags['modified-to']
          ? toSTDateTimeExclusiveEnd(assertDateString(flags['modified-to'], 'Modified-to date'))
          : undefined,
        modifiedOnOrAfter: flags['modified-from']
          ? toSTDateTime(assertDateString(flags['modified-from'], 'Modified-from date'))
          : undefined,
        page: flags.page,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(templates.map(template => toEstimateTemplateSummary(template)), {
      defaultFields: ['id', 'name', 'internalName', 'mode', 'active', 'businessUnitId', 'totalPrice', 'modified'],
      fields: this.parseFields(flags.fields),
    })
  }
}
