import process from 'node:process'

import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../lib/base-command.js'
import {assertDateString, formatPeriodLabel, formatShortDateRange} from '../lib/date-ranges.js'
import {getRevenueSummary} from '../lib/intelligence.js'
import {printCSV, printInfo, printJSON, printTable} from '../lib/output.js'
import type {RevenuePeriod} from '../lib/date-ranges.js'

export default class Revenue extends BaseCommand {
  public static override description = 'Summarize revenue for a date range'

  public static override examples = [
    '<%= config.bin %> revenue --period month',
    '<%= config.bin %> revenue --period ytd --output json',
    '<%= config.bin %> revenue --from 2026-03-01 --to 2026-03-15 --compact',
  ]

  public static override flags = {
    ...baseFlags,
    period: Flags.string({
      default: 'month',
      description: 'Revenue period',
      options: ['day', 'week', 'month', 'year', 'ytd'],
    }),
    from: Flags.string({
      description: 'Start date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'End date (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Revenue)
    const {client} = await this.initializeRuntime(flags)
    const period = flags.period as RevenuePeriod
    const from = typeof flags.from === 'string' ? assertDateString(flags.from, 'From date') : undefined
    const to = typeof flags.to === 'string' ? assertDateString(flags.to, 'To date') : undefined
    const [summary] = await Promise.all([
      getRevenueSummary(client!, {
        from,
        period,
        to,
      }),
    ])

    if (this.compact) {
      process.stdout.write(`${JSON.stringify(summary)}\n`)
      return
    }

    if (this.outputFormat === 'json') {
      printJSON(summary)
      return
    }

    if (this.outputFormat === 'csv') {
      await printCSV(Object.keys(summary), [Object.values(summary)])
      return
    }

    printInfo(
      `Revenue Summary — ${formatPeriodLabel(period, {from: summary.from, to: summary.to}, {custom: Boolean(from || to)})}`,
    )
    printTable(['Metric', 'Value'], [
      ['Total Revenue', formatMoney(summary.total_revenue)],
      ['Total Jobs', String(summary.total_jobs)],
      ['Avg Job Value', formatMoney(summary.avg_job_value)],
      ['Date Range', formatShortDateRange({from: summary.from, to: summary.to})],
    ])
  }
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(value)
}
