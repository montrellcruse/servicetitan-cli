import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios'

import type {
  AccessTokenResponse,
  ServiceTitanClientOptions,
  ServiceTitanModule,
  UnknownRecord,
} from './types.js'

export const ENVIRONMENTS = {
  integration: {
    authHost: 'auth-integration.servicetitan.io',
    apiHost: 'api-integration.servicetitan.io',
  },
  production: {
    authHost: 'auth.servicetitan.io',
    apiHost: 'api.servicetitan.io',
  },
} as const

export const ROUTE_TABLE: Record<string, ServiceTitanModule> = {
  '/adjustments': 'inventory',
  '/ap-credits': 'accounting',
  '/ap-payments': 'accounting',
  '/appointment-assignments': 'dispatch',
  '/appointments': 'jpm',
  '/arrival-windows': 'dispatch',
  '/attributed-leads': 'marketing',
  '/bookings': 'crm',
  '/booking-provider-tags': 'crm',
  '/business-hours': 'settings',
  '/business-units': 'settings',
  '/call-reasons': 'telecom',
  '/calls': 'telecom',
  '/campaigns': 'marketing',
  '/capacity': 'dispatch',
  '/categories': 'pricebook',
  '/contacts': 'crm',
  '/costs': 'marketing',
  '/customers': 'crm',
  '/data': 'reporting',
  '/discounts': 'pricebook',
  '/dynamic-value-sets': 'reporting',
  '/employees': 'settings',
  '/equipment': 'pricebook',
  '/estimates': 'sales',
  '/forms': 'forms',
  '/gl-accounts': 'accounting',
  '/gross-pay-items': 'payroll',
  '/images': 'jpm',
  '/installed-equipment': 'jpm',
  '/invoice-items': 'accounting',
  '/invoices': 'accounting',
  '/job-cancel-reasons': 'jpm',
  '/job-hold-reasons': 'jpm',
  '/job-types': 'jpm',
  '/jobs': 'jpm',
  '/journal-entries': 'accounting',
  '/leads': 'crm',
  '/locations': 'crm',
  '/marketing': 'marketing',
  '/materials': 'pricebook',
  '/membership-types': 'memberships',
  '/memberships': 'memberships',
  '/non-job-timesheets': 'payroll',
  '/payments': 'accounting',
  '/payroll-adjustments': 'payroll',
  '/payrolls': 'payroll',
  '/performance': 'settings',
  '/projects': 'jpm',
  '/project-types': 'jpm',
  '/purchase-order-markups': 'inventory',
  '/purchase-orders': 'inventory',
  '/purchase-order-types': 'inventory',
  '/receipts': 'inventory',
  '/recurring-service-events': 'memberships',
  '/recurring-services': 'memberships',
  '/recurring-service-types': 'memberships',
  '/report-categories': 'reporting',
  '/report-category': 'reporting',
  '/returns': 'inventory',
  '/return-types': 'inventory',
  '/services': 'pricebook',
  '/splits': 'payroll',
  '/submissions': 'marketing',
  '/suppressions': 'marketing',
  '/tag-types': 'settings',
  '/tags': 'crm',
  '/tasks': 'task-management',
  '/tax-zones': 'accounting',
  '/teams': 'dispatch',
  '/technicians': 'settings',
  '/timesheets': 'payroll',
  '/transfers': 'inventory',
  '/user-roles': 'settings',
  '/vendors': 'inventory',
  '/warehouses': 'inventory',
  '/zones': 'dispatch',
} as const

const TOKEN_TTL_BUFFER_MS = 60_000
const DEFAULT_TIMEOUT_MS = 30_000
const MODULE_PREFIX_PATTERN =
  /^\/(?:crm|jpm|dispatch|accounting|sales|pricebook|payroll|memberships|marketing|telecom|inventory|reporting|settings|task-management|forms)\/v\d+\//

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  __stRetried401?: boolean
  __stRetryCount429?: number
}

export class ServiceTitanApiError extends Error {
  public readonly path: string
  public readonly status?: number

  public constructor(message: string, status: number | undefined, path: string) {
    super(message)
    this.name = 'ServiceTitanApiError'
    this.path = path
    this.status = status
  }
}

export class ServiceTitanClient {
  private readonly authHttp: AxiosInstance
  private readonly http: AxiosInstance
  private readonly reportCallTimestamps = new Map<string, number>()
  private tokenCache?: {accessToken: string; expiresAt: number}
  private tokenRequest?: Promise<string>

  public constructor(private readonly options: ServiceTitanClientOptions) {
    const environment = ENVIRONMENTS[options.environment]
    const timeout = options.timeout ?? parseTimeout(process.env.ST_TIMEOUT) ?? DEFAULT_TIMEOUT_MS

    this.authHttp = axios.create({
      baseURL: `https://${environment.authHost}`,
      timeout,
    })

    this.http = axios.create({
      baseURL: `https://${environment.apiHost}`,
      timeout,
    })

    this.http.interceptors.request.use(async config => this.attachAuthHeaders(config))
    this.http.interceptors.response.use(
      response => response,
      (error: AxiosError) => this.handleResponseError(error),
    )
  }

  public addApiPrefix(path: string): string {
    const normalizedPath = normalizePath(path)

    if (MODULE_PREFIX_PATTERN.test(normalizedPath)) {
      return normalizedPath
    }

    const moduleName = getRouteModule(normalizedPath)

    if (!moduleName) {
      return normalizedPath
    }

    return `/${moduleName}/v2/tenant/${this.options.tenantId}${normalizedPath}`
  }

  public resolveRawPath(path: string): string {
    return normalizePath(path).replaceAll('{tenant}', this.options.tenantId)
  }

  public resolvePath(path: string): string {
    return this.addApiPrefix(this.resolveRawPath(path))
  }

  public async ensureToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.hasValidToken()) {
      return this.tokenCache!.accessToken
    }

    if (this.tokenRequest) {
      return this.tokenRequest
    }

    this.tokenRequest = this.fetchToken().finally(() => {
      this.tokenRequest = undefined
    })

    return this.tokenRequest
  }

  public async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const resolvedPath = this.resolvePath(path)
    await this.maybeThrottleReportingRequest(resolvedPath, params)
    const response = await this.http.get<T>(resolvedPath, {params})
    return response.data
  }

  public async getRaw<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const resolvedPath = this.resolveRawPath(path)
    await this.maybeThrottleReportingRequest(resolvedPath, params)
    const response = await this.http.get<T>(resolvedPath, {params})
    return response.data
  }

  public async post<T>(
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.http.post<T>(this.resolvePath(path), body, {params})
    return response.data
  }

  public async postRaw<T>(
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.http.post<T>(this.resolveRawPath(path), body, {params})
    return response.data
  }

  public async put<T>(
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.http.put<T>(this.resolvePath(path), body, {params})
    return response.data
  }

  public async putRaw<T>(
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.http.put<T>(this.resolveRawPath(path), body, {params})
    return response.data
  }

  public async patch<T>(
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.http.patch<T>(this.resolvePath(path), body, {params})
    return response.data
  }

  public async delete<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.http.delete<T>(this.resolvePath(path), {params})
    return response.data
  }

  public async deleteRaw<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.http.delete<T>(this.resolveRawPath(path), {params})
    return response.data
  }

  private async attachAuthHeaders(
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> {
    const token = await this.ensureToken()
    const headers = AxiosHeaders.from(config.headers)

    headers.set('Authorization', `Bearer ${token}`)
    headers.set('ST-App-Key', this.options.appKey)

    config.headers = headers
    return config
  }

  private async fetchToken(): Promise<string> {
    const response = await this.authHttp.post<AccessTokenResponse>(
      '/connect/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    const accessToken = response.data.access_token
    const expiresAt = Date.now() + response.data.expires_in * 1000

    this.tokenCache = {
      accessToken,
      expiresAt,
    }

    return accessToken
  }

  private hasValidToken(): boolean {
    return Boolean(
      this.tokenCache &&
        Date.now() < this.tokenCache.expiresAt - TOKEN_TTL_BUFFER_MS &&
        this.tokenCache.accessToken,
    )
  }

  private clearToken(): void {
    this.tokenCache = undefined
  }

  private async maybeThrottleReportingRequest(
    path: string,
    params?: Record<string, unknown>,
  ): Promise<void> {
    const reportId = getReportingReportId(path, params)

    if (!reportId) {
      return
    }

    await this.throttleReportingCall(reportId)
  }

  private async throttleReportingCall(reportId: string): Promise<void> {
    const MIN_GAP_MS = 12_000
    const last = this.reportCallTimestamps.get(reportId)

    if (typeof last === 'number') {
      const wait = MIN_GAP_MS - (Date.now() - last)

      if (wait > 0) {
        await sleep(wait)
      }
    }

    this.reportCallTimestamps.set(reportId, Date.now())
  }

  private async handleResponseError(error: AxiosError): Promise<unknown> {
    const config = error.config as RetryableRequestConfig | undefined
    const path = config?.url ?? 'unknown path'

    if (error.response?.status === 401 && config && !config.__stRetried401) {
      config.__stRetried401 = true
      this.clearToken()

      const token = await this.ensureToken(true)
      const headers = AxiosHeaders.from(config.headers)
      headers.set('Authorization', `Bearer ${token}`)
      headers.set('ST-App-Key', this.options.appKey)
      config.headers = headers

      return this.http.request(config)
    }

    if (error.response?.status === 429 && config) {
      const retryCount = config.__stRetryCount429 ?? 0

      if (retryCount < 2) {
        config.__stRetryCount429 = retryCount + 1
        const retryAfterMs = parseRetryAfterMs(error.response.headers['retry-after'])
        await sleep(retryAfterMs ?? getExponentialBackoffMs(retryCount))
        return this.http.request(config)
      }
    }

    throw new ServiceTitanApiError(
      extractErrorMessage(error),
      error.response?.status,
      path,
    )
  }
}

export function getRouteModule(path: string): ServiceTitanModule | undefined {
  const normalizedPath = normalizePath(path)
  const candidates = Object.keys(ROUTE_TABLE).sort((left, right) => right.length - left.length)

  for (const candidate of candidates) {
    if (normalizedPath === candidate || normalizedPath.startsWith(`${candidate}/`)) {
      return ROUTE_TABLE[candidate]
    }
  }

  return undefined
}

function extractErrorMessage(error: AxiosError): string {
  const data = error.response?.data

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (isUnknownRecord(data)) {
    const message = findMessage(data)
    if (message) {
      return message
    }
  }

  return error.message
}

function findMessage(data: UnknownRecord): string | undefined {
  const candidates = ['message', 'error', 'detail', 'title']

  for (const key of candidates) {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return undefined
}

function isUnknownRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object'
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function getReportingReportId(
  path: string,
  params?: Record<string, unknown>,
): string | undefined {
  if (!path.includes('/reporting/v2/')) {
    return undefined
  }

  const reportId = params?.reportId

  if (typeof reportId === 'number' || typeof reportId === 'string') {
    return String(reportId)
  }

  return undefined
}

function parseRetryAfterMs(headerValue: unknown): number | undefined {
  if (typeof headerValue === 'number') {
    return Math.max(headerValue * 1000, 1_000)
  }

  if (Array.isArray(headerValue)) {
    return parseRetryAfterMs(headerValue[0])
  }

  if (typeof headerValue === 'string') {
    const seconds = Number(headerValue)

    if (!Number.isNaN(seconds)) {
      return Math.max(seconds * 1000, 1_000)
    }

    const target = Date.parse(headerValue)

    if (!Number.isNaN(target)) {
      return Math.max(target - Date.now(), 1_000)
    }
  }

  return undefined
}

function getExponentialBackoffMs(attempt: number): number {
  return Math.min(2 ** attempt * 1000, 30_000)
}

function parseTimeout(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}
