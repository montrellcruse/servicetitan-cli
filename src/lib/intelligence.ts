import {getNumber, getString} from './data.js'
import {resolveDateRange, resolvePeriodDateRange} from './date-ranges.js'
import {paginate} from './pagination.js'
import type {RevenuePeriod} from './date-ranges.js'
import type {PaginatedResponse, UnknownRecord} from './types.js'

interface PaginatedClient {
  get<T>(path: string, params?: Record<string, unknown>): Promise<PaginatedResponse<T>>
}

export interface RevenueSummary {
  avg_job_value: number
  from: string
  period: RevenuePeriod
  to: string
  total_jobs: number
  total_revenue: number
}

export type SnapshotMetricKey =
  | 'active_memberships'
  | 'jobs_this_week'
  | 'jobs_today'
  | 'open_estimates'
  | 'open_leads'
  | 'revenue_mtd'

export interface SnapshotSummary {
  active_memberships?: number
  date: string
  errors: Partial<Record<SnapshotMetricKey, string>>
  jobs_this_week?: number
  jobs_today?: number
  open_estimates?: number
  open_leads?: number
  revenue_mtd?: number
}

export async function getRevenueSummary(
  client: PaginatedClient,
  options: {
    from?: string
    period?: RevenuePeriod
    referenceDate?: string
    to?: string
  } = {},
): Promise<RevenueSummary> {
  const period = options.period ?? 'month'
  const range = resolveDateRange({
    clampToReferenceDate: period === 'month',
    from: options.from,
    period,
    referenceDate: options.referenceDate,
    to: options.to,
  })
  const invoices = await paginate<UnknownRecord>(
    client,
    '/invoices',
    {
      createdOnOrAfter: range.from,
      createdOnOrBefore: range.to,
    },
    {
      all: true,
      pageSize: 5000,
    },
  )
  // Filter out void/cancelled invoices AND zero-value invoices (ST returns $0 jobs)
  const activeInvoices = invoices.filter(invoice => {
    const status = getInvoiceStatus(invoice)
    if (status === 'void' || status === 'voided' || status === 'cancelled' || status === 'canceled') return false
    const total = getNumber(invoice, ['total', 'totalAmount', 'invoiceTotal', 'summary.total']) ?? 0
    return total > 0
  })
  const totalRevenue = roundCurrency(
    activeInvoices.reduce(
      (sum, invoice) =>
        sum + (getNumber(invoice, ['total', 'totalAmount', 'invoiceTotal', 'summary.total']) ?? 0),
      0,
    ),
  )
  const totalJobs = activeInvoices.length

  return {
    avg_job_value: totalJobs > 0 ? roundCurrency(totalRevenue / totalJobs) : 0,
    from: range.from,
    period,
    to: range.to,
    total_jobs: totalJobs,
    total_revenue: totalRevenue,
  }
}

export async function getSnapshotSummary(
  client: PaginatedClient,
  date: string,
): Promise<SnapshotSummary> {
  const weekRange = resolvePeriodDateRange('week', date)
  const tasks: Record<SnapshotMetricKey, Promise<number>> = {
    active_memberships: countResults(client, '/memberships', {active: true}),
    jobs_this_week: countResults(client, '/jobs', {
      completedOnOrAfter: weekRange.from,
      completedOnOrBefore: weekRange.to,
      jobStatus: 'Completed',
    }),
    jobs_today: countResults(client, '/jobs', {
      scheduledOnOrAfter: date,
      scheduledOnOrBefore: date,
      jobStatus: 'Scheduled,InProgress',
    }),
    open_estimates: countResults(client, '/estimates', {status: 'open'}),
    open_leads: countResults(client, '/leads', {status: 'open'}),
    revenue_mtd: getRevenueSummary(client, {
      period: 'month',
      referenceDate: date,
    }).then(summary => summary.total_revenue),
  }
  const keys = Object.keys(tasks) as SnapshotMetricKey[]
  const settled = await Promise.allSettled(keys.map(key => tasks[key]))
  const summary: SnapshotSummary = {
    date,
    errors: {},
  }

  for (const [index, result] of settled.entries()) {
    const key = keys[index]

    if (result.status === 'fulfilled') {
      summary[key] = result.value
      continue
    }

    summary.errors[key] = getErrorMessage(result.reason)
  }

  return summary
}

async function countResults(
  client: PaginatedClient,
  path: string,
  params: Record<string, unknown>,
): Promise<number> {
  const response = await client.get<UnknownRecord>(path, {
    ...params,
    page: 1,
    pageSize: 1,
  })

  if (typeof response.totalCount === 'number') {
    return response.totalCount
  }

  if (response.hasMore) {
    const records = await paginate<UnknownRecord>(client, path, params, {
      all: true,
      pageSize: 5000,
    })
    return records.length
  }

  return response.data.length
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown error'
}

function getInvoiceStatus(invoice: UnknownRecord): string {
  return (getString(invoice, ['status']) ?? '').trim().toLowerCase()
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
