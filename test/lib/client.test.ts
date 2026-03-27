import {afterEach, describe, expect, it, vi} from 'vitest'
import {AxiosHeaders, type AxiosError} from 'axios'

import {getRouteModule, ServiceTitanApiError, ServiceTitanClient} from '../../src/lib/client.js'

describe('ServiceTitanClient path resolution', () => {
  it('adds API prefixes for shorthand resource paths', () => {
    const client = createClient()
    expect(client.addApiPrefix('/customers')).toBe('/crm/v2/tenant/12345/customers')
    expect(client.addApiPrefix('/jobs/1')).toBe('/jpm/v2/tenant/12345/jobs/1')
    expect(client.addApiPrefix('/invoices')).toBe('/accounting/v2/tenant/12345/invoices')
    expect(client.addApiPrefix('/technicians/10')).toBe('/settings/v2/tenant/12345/technicians/10')
  })

  it('does not double-prefix fully qualified paths', () => {
    const client = createClient()
    expect(client.addApiPrefix('/crm/v2/tenant/12345/customers')).toBe(
      '/crm/v2/tenant/12345/customers',
    )
  })

  it('replaces tenant placeholders before prefix resolution', () => {
    const client = createClient()
    expect(client.resolvePath('/settings/v2/tenant/{tenant}/business-units')).toBe(
      '/settings/v2/tenant/12345/business-units',
    )
  })

  it.each([
    ['/activities', 'timesheets'],
    ['/activity-codes', 'payroll'],
    ['/activity-types', 'timesheets'],
    ['/customers', 'crm'],
    ['/contacts', 'crm'],
    ['/jobs', 'jpm'],
    ['/jobs/timesheets', 'payroll'],
    ['/appointments', 'jpm'],
    ['/appointment-assignments', 'dispatch'],
    ['/invoices', 'accounting'],
    ['/estimates', 'sales'],
    ['/services', 'pricebook'],
    ['/payrolls', 'payroll'],
    ['/memberships', 'memberships'],
    ['/campaigns', 'marketing'],
    ['/calls', 'telecom'],
    ['/purchase-orders', 'inventory'],
    ['/report-categories', 'reporting'],
    ['/trucks', 'inventory'],
    ['/business-units', 'settings'],
  ])('maps %s to %s', (path, moduleName) => {
    expect(getRouteModule(path)).toBe(moduleName)
  })

  it('does not double-prefix fully qualified timesheets paths', () => {
    const client = createClient()
    expect(client.addApiPrefix('/timesheets/v2/tenant/12345/activities')).toBe(
      '/timesheets/v2/tenant/12345/activities',
    )
  })
})

describe('ServiceTitanClient rate limiting', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('uses exponential backoff when retry-after is missing', async () => {
    vi.useFakeTimers()
    const client = createClient()
    const privateClient = client as unknown as PrivateClient
    const requestSpy = vi.spyOn(privateClient.http, 'request').mockResolvedValue({data: {ok: true}})

    const promise = privateClient.handleResponseError(create429Error())

    await vi.advanceTimersByTimeAsync(999)
    expect(requestSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toEqual({data: {ok: true}})
    expect(requestSpy).toHaveBeenCalledTimes(1)
  })

  it('respects Retry-After values over exponential backoff', async () => {
    vi.useFakeTimers()
    const client = createClient()
    const privateClient = client as unknown as PrivateClient
    const requestSpy = vi.spyOn(privateClient.http, 'request').mockResolvedValue({data: {ok: true}})

    const promise = privateClient.handleResponseError(create429Error({retryAfter: '5'}))

    await vi.advanceTimersByTimeAsync(4_999)
    expect(requestSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toEqual({data: {ok: true}})
    expect(requestSpy).toHaveBeenCalledTimes(1)
  })

  it('enforces the max retry count before throwing', async () => {
    const client = createClient()
    const privateClient = client as unknown as PrivateClient
    const requestSpy = vi.spyOn(privateClient.http, 'request')

    await expect(
      privateClient.handleResponseError(create429Error({retryCount: 2})),
    ).rejects.toBeInstanceOf(ServiceTitanApiError)

    expect(requestSpy).not.toHaveBeenCalled()
  })

  it('throttles repeated reporting calls for the same report id', async () => {
    vi.useFakeTimers()
    const client = createClient()
    const privateClient = client as unknown as PrivateClient
    const getSpy = vi.spyOn(privateClient.http, 'get').mockResolvedValue({data: {data: []}})

    await client.get('/report-category/operations', {reportId: '175'})

    const nextCall = client.get('/report-category/operations', {reportId: '175'})

    await vi.advanceTimersByTimeAsync(11_999)
    expect(getSpy).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await nextCall
    expect(getSpy).toHaveBeenCalledTimes(2)
  })
})

function createClient(): ServiceTitanClient {
  return new ServiceTitanClient({
    appKey: 'app-key',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    environment: 'integration',
    tenantId: '12345',
  })
}

function create429Error(options: {retryAfter?: string; retryCount?: number} = {}): AxiosError {
  return {
    config: {
      __stRetryCount429: options.retryCount,
      headers: AxiosHeaders.from({}),
      method: 'get',
      url: '/crm/v2/tenant/12345/customers',
    },
    isAxiosError: true,
    message: 'Too Many Requests',
    name: 'AxiosError',
    response: {
      config: {
        headers: AxiosHeaders.from({}),
      },
      data: {
        message: 'Rate limited',
      },
      headers: options.retryAfter ? {'retry-after': options.retryAfter} : {},
      status: 429,
      statusText: 'Too Many Requests',
    },
    toJSON: () => ({}),
  } as AxiosError
}

interface PrivateClient {
  handleResponseError: (error: AxiosError) => Promise<unknown>
  http: {
    get: (...args: unknown[]) => Promise<unknown>
    request: (...args: unknown[]) => Promise<unknown>
  }
}
