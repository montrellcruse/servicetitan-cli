import {describe, expect, it} from 'vitest'

import {getRouteModule, ServiceTitanClient} from '../../src/lib/client.js'

const client = new ServiceTitanClient({
  appKey: 'app-key',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  environment: 'integration',
  tenantId: '12345',
})

describe('ServiceTitanClient path resolution', () => {
  it('adds API prefixes for shorthand resource paths', () => {
    expect(client.addApiPrefix('/customers')).toBe('/crm/v2/tenant/12345/customers')
    expect(client.addApiPrefix('/jobs/1')).toBe('/jpm/v2/tenant/12345/jobs/1')
    expect(client.addApiPrefix('/invoices')).toBe('/accounting/v2/tenant/12345/invoices')
    expect(client.addApiPrefix('/technicians/10')).toBe('/settings/v2/tenant/12345/technicians/10')
  })

  it('does not double-prefix fully qualified paths', () => {
    expect(client.addApiPrefix('/crm/v2/tenant/12345/customers')).toBe(
      '/crm/v2/tenant/12345/customers',
    )
  })

  it('replaces tenant placeholders before prefix resolution', () => {
    expect(client.resolvePath('/settings/v2/tenant/{tenant}/business-units')).toBe(
      '/settings/v2/tenant/12345/business-units',
    )
  })

  it.each([
    ['/customers', 'crm'],
    ['/contacts', 'crm'],
    ['/jobs', 'jpm'],
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
    ['/business-units', 'settings'],
  ])('maps %s to %s', (path, moduleName) => {
    expect(getRouteModule(path)).toBe(moduleName)
  })
})
