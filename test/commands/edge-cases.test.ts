/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import {afterEach, describe, expect, it, vi} from 'vitest'

import CustomersList from '../../src/commands/customers/list.js'
import JobsList from '../../src/commands/jobs/list.js'
import LocationsList from '../../src/commands/locations/list.js'
import {createTestContext, stripAnsi} from '../helpers.js'

/**
 * Edge-case tests — empty responses, unexpected fields, large pagination,
 * Unicode data, and JSON output correctness on error paths.
 */
describe('edge cases', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── 1. Empty API response (data: []) ────────────────────────────────────

  it('renders "No results found." instead of an empty table when data is []', async () => {
    const {output} = createTestContext({
      client: {
        get: vi.fn().mockResolvedValue({data: [], hasMore: false}),
      },
    })

    await CustomersList.run([], process.cwd())

    const rendered = stripAnsi(output())
    expect(rendered).toContain('No results found.')
    // Should NOT render an empty table (no header row)
    expect(rendered).not.toContain('┼')
  })

  it('renders an empty JSON array when --output json returns no data', async () => {
    const {output} = createTestContext({
      client: {
        get: vi.fn().mockResolvedValue({data: [], hasMore: false}),
      },
    })

    await CustomersList.run(['--output', 'json'], process.cwd())

    const parsed: AnyJson = JSON.parse(output())
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(0)
  })

  // ─── 2. API response with unexpected / extra fields ───────────────────────

  it('does not crash when the API returns unexpected extra fields', async () => {
    const customerWithExtras = {
      active: true,
      // Standard fields
      createdOn: '2026-01-15T10:00:00Z',
      id: 123,
      name: 'Acme HVAC',
      // Unexpected/extra fields the entity mapper ignores
      _internalFlag: true,
      betaFeatureX: {nested: {deep: 'value'}},
      futureArrayField: [1, 2, 3],
      legacyField: null,
    }

    const getSpy = vi.fn().mockResolvedValue({
      data: [customerWithExtras],
      hasMore: false,
    })

    const {output} = createTestContext({client: {get: getSpy}})

    // Should not throw
    await expect(CustomersList.run([], process.cwd())).resolves.toBeUndefined()

    const rendered = stripAnsi(output())
    expect(rendered).toContain('Acme HVAC')
  })

  it('does not crash when individual records have null for normally-string fields', async () => {
    const customerWithNulls = {
      active: null,
      createdOn: null,
      id: 456,
      name: null,
    }

    const getSpy = vi.fn().mockResolvedValue({
      data: [customerWithNulls],
      hasMore: false,
    })

    const {output} = createTestContext({client: {get: getSpy}})

    await expect(CustomersList.run([], process.cwd())).resolves.toBeUndefined()
    // Should render something — even if mostly blank
    expect(output()).toBeTruthy()
  })

  // ─── 3. Very large pagination (many pages with --all) ────────────────────

  it('handles multi-page result sets correctly with --all (3 pages)', async () => {
    // Keep items small per-page to avoid rendering thousands of table rows (slow)
    const ITEMS_PER_PAGE = 3
    const TOTAL_PAGES = 3 // 3 + 3 + 2 = 8 items total

    const makeCustomer = (id: number) => ({
      active: true,
      createdOn: '2026-01-01T00:00:00Z',
      id,
      name: `Customer ${id}`,
    })

    let callCount = 0
    const getSpy = vi.fn().mockImplementation((_path: string, params: Record<string, unknown>) => {
      callCount += 1
      const page = (params.page as number) ?? 1

      // Return ITEMS_PER_PAGE per page; last page returns 2 items with hasMore=false
      const isLastPage = page >= TOTAL_PAGES
      const itemCount = isLastPage ? 2 : ITEMS_PER_PAGE
      const startId = (page - 1) * ITEMS_PER_PAGE + 1

      return Promise.resolve({
        data: Array.from({length: itemCount}, (_, i) => makeCustomer(startId + i)),
        hasMore: !isLastPage,
      })
    })

    const {output} = createTestContext({client: {get: getSpy}})

    // --all without --limit: uses default pageSize (5000) but our mock ignores it
    // and returns small batches, so multiple pages are needed
    await CustomersList.run(['--all'], process.cwd())

    // Should have made TOTAL_PAGES GET calls
    expect(callCount).toBeGreaterThanOrEqual(TOTAL_PAGES)

    const rendered = stripAnsi(output())
    // Should contain data from the first page
    expect(rendered).toContain('Customer 1')
  })

  it('stops pagination at the limit when --all --limit is used', async () => {
    let callCount = 0

    const getSpy = vi.fn().mockImplementation((_path: string, params: Record<string, unknown>) => {
      callCount += 1
      const page = (params.page as number) ?? 1
      const size = (params.pageSize as number) ?? 50
      const startId = (page - 1) * size + 1

      return Promise.resolve({
        data: Array.from({length: size}, (_, i) => ({
          active: true,
          createdOn: '2026-01-01T00:00:00Z',
          id: startId + i,
          name: `Customer ${startId + i}`,
        })),
        hasMore: true,
      })
    })

    const {output} = createTestContext({client: {get: getSpy}})

    // --all --limit 10 with pageSize 10 → exactly 1 page needed
    await CustomersList.run(['--all', '--limit', '10'], process.cwd())

    const rendered = stripAnsi(output())
    expect(rendered).toBeTruthy()
    // Should have stopped after the limit was hit
    expect(getSpy).toHaveBeenCalled()
    expect(callCount).toBeLessThanOrEqual(3) // Should not fetch unlimited pages
  })

  // ─── 4. Unicode in customer names / addresses ─────────────────────────────

  it('renders Unicode customer names correctly in table output', async () => {
    const unicodeCustomer = {
      active: true,
      address: {
        city: '大阪市',  // Osaka in Japanese
        state: 'JP',
        street: '梅田 1-2-3',
        zip: '530-0001',
      },
      createdOn: '2026-02-20T09:00:00Z',
      id: 999,
      name: 'Müller GmbH & Söhne',  // German with umlauts
    }

    const getSpy = vi.fn().mockResolvedValue({
      data: [unicodeCustomer],
      hasMore: false,
    })

    const {output} = createTestContext({client: {get: getSpy}})

    await CustomersList.run([], process.cwd())

    const rendered = stripAnsi(output())
    expect(rendered).toContain('Müller GmbH & Söhne')
  })

  it('renders Unicode addresses correctly in table output', async () => {
    const unicodeLocation = {
      active: true,
      address: {
        city: 'São Paulo',    // Portuguese
        state: 'SP',
        street: 'Rua das Flores, 123',
        zip: '01310-100',
      },
      createdOn: '2026-01-10T00:00:00Z',
      customerId: 200,
      id: 500,
      name: 'Ñoño Café & Bar',  // Spanish with special chars
    }

    const getSpy = vi.fn().mockResolvedValue({
      data: [unicodeLocation],
      hasMore: false,
    })

    const {output} = createTestContext({client: {get: getSpy}})

    await LocationsList.run([], process.cwd())

    const rendered = stripAnsi(output())
    expect(rendered).toContain('Ñoño Café & Bar')
  })

  it('renders emoji in names without crashing', async () => {
    const emojiCustomer = {
      active: true,
      createdOn: '2026-03-01T00:00:00Z',
      id: 777,
      name: 'Cool HVAC 🔥❄️',
    }

    const getSpy = vi.fn().mockResolvedValue({
      data: [emojiCustomer],
      hasMore: false,
    })

    const {output} = createTestContext({client: {get: getSpy}})

    await CustomersList.run([], process.cwd())

    const rendered = stripAnsi(output())
    expect(rendered).toContain('Cool HVAC')
  })

  // ─── 5. --format json always produces valid JSON even on error ────────────

  it('produces valid parseable JSON even when records have complex nested structures', async () => {
    const complexCustomer = {
      active: true,
      contacts: [
        {isDefault: true, type: 'Phone', value: '555-1234'},
        {isDefault: false, type: 'Email', value: 'test@example.com'},
      ],
      createdOn: '2026-01-01T00:00:00Z',
      id: 1,
      metadata: {
        customAttributes: [{key: 'tier', value: 'premium'}],
        importedFrom: 'legacy',
      },
      name: 'Complex Customer',
    }

    const getSpy = vi.fn().mockResolvedValue({
      data: [complexCustomer],
      hasMore: false,
    })

    const {output} = createTestContext({client: {get: getSpy}})

    await CustomersList.run(['--output', 'json'], process.cwd())

    // Must be valid JSON
    const parsed: AnyJson = JSON.parse(output())
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('Complex Customer')
  })

  it('produces valid JSON for an array of mixed records', async () => {
    const customers = [
      {active: true, createdOn: '2026-01-01T00:00:00Z', id: 1, name: 'Alpha'},
      {active: false, createdOn: null, id: 2, name: 'Beta'},
      {active: true, createdOn: '2026-03-15T00:00:00Z', id: 3, name: 'Gamma'},
    ]

    const getSpy = vi.fn().mockResolvedValue({
      data: customers,
      hasMore: false,
    })

    const {output} = createTestContext({client: {get: getSpy}})

    await CustomersList.run(['--output', 'json'], process.cwd())

    const parsed: AnyJson = JSON.parse(output())
    expect(parsed).toHaveLength(3)
    expect(parsed.map((c: {name: string}) => c.name)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('produces an empty JSON array (not null/undefined) when no results found', async () => {
    const getSpy = vi.fn().mockResolvedValue({data: [], hasMore: false})
    const {output} = createTestContext({client: {get: getSpy}})

    await CustomersList.run(['--output', 'json'], process.cwd())

    const raw = output().trim()
    expect(raw).toBeTruthy()

    const parsed: AnyJson = JSON.parse(raw)
    expect(parsed).toEqual([])
    expect(parsed).not.toBeNull()
  })

  // ─── 6. Job list with unexpected fields ──────────────────────────────────

  it('does not crash when jobs list response has unexpected status values', async () => {
    const jobWithFutureFields = {
      appointmentDate: '2026-04-01T10:00:00Z',
      businessUnitId: 5,
      completedOn: '2026-04-01T14:00:00Z',
      id: 99,
      jobNumber: 'J-99999',
      // unknown future fields
      aiAnalysis: {confidence: 0.98, tags: ['HVAC', 'repair']},
      legacyV1Id: '00099',
      status: 'ScheduledForLater',  // Unexpected status variant
    }

    const getSpy = vi.fn().mockResolvedValue({
      data: [jobWithFutureFields],
      hasMore: false,
    })

    const {output} = createTestContext({client: {get: getSpy}})

    await expect(JobsList.run([], process.cwd())).resolves.toBeUndefined()

    const rendered = stripAnsi(output())
    expect(rendered).toBeTruthy()
  })

  // ─── 7. --output json via --fields projection ─────────────────────────────

  it('JSON output respects --fields projection and produces valid JSON', async () => {
    const customers = [
      {active: true, createdOn: '2026-01-01T00:00:00Z', id: 1, name: 'Alpha'},
      {active: true, createdOn: '2026-02-01T00:00:00Z', id: 2, name: 'Beta'},
    ]

    const getSpy = vi.fn().mockResolvedValue({data: customers, hasMore: false})
    const {output} = createTestContext({client: {get: getSpy}})

    await CustomersList.run(['--output', 'json', '--fields', 'id,name'], process.cwd())

    const parsed: AnyJson = JSON.parse(output())
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0]).toHaveProperty('id')
    expect(parsed[0]).toHaveProperty('name')
    // active should NOT be present since we projected to id,name
    expect(Object.keys(parsed[0])).toEqual(['id', 'name'])
  })
})
