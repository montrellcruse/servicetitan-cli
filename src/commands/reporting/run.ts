import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {isUnknownRecord} from '../../lib/api.js'
import {assertDateString} from '../../lib/date-ranges.js'

export default class ReportingRun extends BaseCommand {
  public static override description = 'Run a ServiceTitan report'

  public static override flags = {
    ...baseFlags,
    report: Flags.string({
      description: 'Report identifier',
      required: true,
    }),
    category: Flags.string({
      description: 'Report category identifier',
      required: true,
    }),
    from: Flags.string({
      description: 'Start date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'End date (YYYY-MM-DD)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of report rows to return',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ReportingRun)
    await this.initializeRuntime(flags)
    const from = typeof flags.from === 'string' ? assertDateString(flags.from, 'From date') : undefined
    const to = typeof flags.to === 'string' ? assertDateString(flags.to, 'To date') : undefined
    const response = await this.requireClient().get<unknown>(`/report-category/${flags.category}`, {
      from,
      pageSize: flags.limit ?? 50,
      reportId: flags.report,
      to,
    })

    await this.renderPayload(limitResponseRows(response, flags.limit ?? 50))
  }
}

function limitResponseRows(payload: unknown, limit: number): unknown {
  if (Array.isArray(payload)) {
    return payload.slice(0, limit)
  }

  if (isUnknownRecord(payload) && Array.isArray(payload.data)) {
    return {
      ...payload,
      data: payload.data.slice(0, limit),
    }
  }

  return payload
}
