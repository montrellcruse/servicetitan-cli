import process from 'node:process'

import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../lib/base-command.js'
import {assertDateString, formatLongDate, getTodayDate} from '../lib/date-ranges.js'
import {getSnapshotSummary} from '../lib/intelligence.js'
import {printCSV, printInfo, printJSON, printTable} from '../lib/output.js'

export default class Snapshot extends BaseCommand {
  public static override description = 'Show a daily operations snapshot'

  public static override examples = [
    '<%= config.bin %> snapshot',
    '<%= config.bin %> snapshot --date 2026-03-25 --output json',
    '<%= config.bin %> snapshot --compact',
  ]

  public static override flags = {
    ...baseFlags,
    date: Flags.string({
      description: 'Snapshot date (YYYY-MM-DD)',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Snapshot)
    await this.initializeRuntime(flags)
    const date = assertDateString(flags.date ?? getTodayDate(), 'Date')
    const summary = await getSnapshotSummary(this.requireClient(), date)
    const compactPayload = toCompactPayload(summary)

    if (this.compact) {
      process.stdout.write(`${JSON.stringify(compactPayload)}\n`)
      return
    }

    if (this.outputFormat === 'json') {
      printJSON({
        ...compactPayload,
        ...(Object.keys(summary.errors).length > 0 ? {errors: summary.errors} : {}),
      })
      return
    }

    if (this.outputFormat === 'csv') {
      const csvPayload = {
        ...compactPayload,
        ...(Object.keys(summary.errors).length > 0 ? {errors: JSON.stringify(summary.errors)} : {}),
      }
      await printCSV(Object.keys(csvPayload), [Object.values(csvPayload)])
      return
    }

    printInfo(`Snapshot — ${formatLongDate(summary.date)}`)
    printInfo('Operations')
    printTable(['Metric', 'Value'], [
      ['Jobs Today', formatValue(summary.jobs_today)],
      ['Jobs This Week', formatValue(summary.jobs_this_week)],
      ['Revenue MTD', formatMoney(summary.revenue_mtd)],
    ])
    printInfo('Pipeline')
    printTable(['Metric', 'Value'], [
      ['Open Estimates', formatValue(summary.open_estimates)],
      ['Active Memberships', formatValue(summary.active_memberships)],
      ['Open Leads', formatValue(summary.open_leads)],
    ])

    if (Object.keys(summary.errors).length > 0) {
      printInfo('Unavailable')
      printTable(
        ['Metric', 'Error'],
        Object.entries(summary.errors).map(([metric, error]) => [titleizeMetric(metric), error]),
      )
    }
  }
}

function toCompactPayload(summary: Awaited<ReturnType<typeof getSnapshotSummary>>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    date: summary.date,
  }

  for (const key of [
    'jobs_today',
    'jobs_this_week',
    'revenue_mtd',
    'open_estimates',
    'active_memberships',
    'open_leads',
  ] as const) {
    if (summary[key] !== undefined) {
      payload[key] = summary[key]
    }
  }

  if (Object.keys(summary.errors).length > 0) {
    payload.errors = summary.errors
  }

  return payload
}

function formatMoney(value: number | undefined): string {
  if (value === undefined) {
    return 'Unavailable'
  }

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(value)
}

function formatValue(value: number | undefined): string {
  return value === undefined ? 'Unavailable' : String(value)
}

function titleizeMetric(metric: string): string {
  return metric
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
