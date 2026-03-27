import {getPathValue, getString} from './data.js'
import {resolveDateRange, resolvePeriodDateRange} from './date-ranges.js'
import {paginate} from './pagination.js'
import type {RevenuePeriod} from './date-ranges.js'
import type {PaginatedResponse, UnknownRecord} from './types.js'

interface PaginatedClient {
  get<T>(path: string, params?: Record<string, unknown>): Promise<PaginatedResponse<T>>
  post?<T>(path: string, body?: unknown, params?: Record<string, unknown>): Promise<T>
}

/**
 * Report 175 field indices (Business Unit Dashboard → "Revenue").
 * This is ST's native revenue calculation and matches the dashboard exactly.
 * TotalRevenue = CompletedRevenue + NonJobRevenue + AdjustmentRevenue
 */
const REPORT_175_FIELD = {
  Name: 0,
  CompletedRevenue: 1,
  OpportunityJobAverage: 2,
  OpportunityConversionRate: 3,
  Opportunity: 4,
  ConvertedJobs: 5,
  CustomerSatisfaction: 6,
  AdjustmentRevenue: 7,
  TotalRevenue: 8,
  NonJobRevenue: 9,
} as const

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

  // Use Report 175 (ST's native reporting engine) for accurate revenue figures.
  // This matches the ST dashboard exactly — unlike invoice aggregation which
  // returns all-time records with no server-side date filtering support.
  if (client.post) {
    const reportResponse = await client.post<UnknownRecord>(
      '/report-category/business-unit-dashboard/reports/175/data',
      {
        parameters: [
          {name: 'From', value: range.from},
          {name: 'To', value: range.to},
        ],
      },
    )

    const reportData = (reportResponse as {data?: unknown}).data
    const rows: unknown[][] = Array.isArray(reportData)
      ? (reportData as unknown[]).filter(Array.isArray) as unknown[][]
      : []

    let totalRevenue = 0
    let totalJobs = 0

    for (const row of rows) {
      const revenueRaw = row[REPORT_175_FIELD.TotalRevenue]
      const jobsRaw = row[REPORT_175_FIELD.ConvertedJobs]
      const rowRevenue = parseFloat(typeof revenueRaw === 'number' || typeof revenueRaw === 'string' ? String(revenueRaw) : '0') || 0
      const rowJobs = parseInt(typeof jobsRaw === 'number' || typeof jobsRaw === 'string' ? String(jobsRaw) : '0', 10) || 0
      if (rowRevenue === 0 && rowJobs === 0) continue
      totalRevenue += rowRevenue
      totalJobs += rowJobs
    }

    totalRevenue = roundCurrency(totalRevenue)

    return {
      avg_job_value: totalJobs > 0 ? roundCurrency(totalRevenue / totalJobs) : 0,
      from: range.from,
      period,
      to: range.to,
      total_jobs: totalJobs,
      total_revenue: totalRevenue,
    }
  }

  // Fallback: invoice aggregation (for test contexts without post() support)
  const invoices = await paginate<UnknownRecord>(
    client,
    '/invoices',
    {
      createdOnOrAfter: range.from,
      createdOnOrBefore: range.to,
    },
    {
      all: true,
      pageSize: 500,
    },
  )
  const activeInvoices = invoices.filter(invoice => {
    const status = getInvoiceStatus(invoice)
    if (status === 'void' || status === 'voided' || status === 'cancelled' || status === 'canceled') return false
    const total = getInvoiceTotal(invoice)
    return total > 0
  })
  const totalRevenue = roundCurrency(
    activeInvoices.reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0),
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
    active_memberships: countResults(client, '/memberships', {status: 'Active'}),
    jobs_this_week: countResults(client, '/jobs', {
      completedOnOrAfter: weekRange.from,
      completedOnOrBefore: weekRange.to,
      jobStatus: 'Completed',
    }),
    jobs_today: countResults(client, '/jobs', {
      completedOnOrAfter: date,
      completedOnOrBefore: date,
      jobStatus: 'Completed',
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
  // First try with pageSize=1 to check for totalCount header
  const response = await client.get<UnknownRecord>(path, {
    ...params,
    page: 1,
    pageSize: 1,
  })

  if (typeof response.totalCount === 'number') {
    return response.totalCount
  }

  // If no totalCount, paginate with a large page size to get the true count.
  // Note: Some endpoints (e.g., jobs, estimates) have thousands of records.
  // Always paginate to completion for accuracy — snapshot metrics must be precise.
  const records = await paginate<UnknownRecord>(client, path, params, {
    all: true,
    pageSize: 5000,
  })
  return records.length
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

function getInvoiceTotal(invoice: UnknownRecord): number {
  const total = getPathValue(invoice, 'total')

  return parseFloat(typeof total === 'number' || typeof total === 'string' ? String(total) : '0')
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
