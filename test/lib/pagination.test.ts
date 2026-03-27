import {describe, expect, it, vi} from 'vitest'

import {paginate} from '../../src/lib/pagination.js'

describe('paginate', () => {
  it('returns all results across pages', async () => {
    const client = {
      get: vi
        .fn()
        .mockResolvedValueOnce({
          data: [{id: 1}, {id: 2}],
          hasMore: true,
        })
        .mockResolvedValueOnce({
          data: [{id: 3}],
          hasMore: false,
        }),
    }

    const results = await paginate<{id: number}>(client, '/customers', {}, {all: true, pageSize: 2})

    expect(results).toEqual([{id: 1}, {id: 2}, {id: 3}])
    expect(client.get).toHaveBeenCalledTimes(2)
    expect(client.get).toHaveBeenNthCalledWith(1, '/customers', {page: 1, pageSize: 2})
    expect(client.get).toHaveBeenNthCalledWith(2, '/customers', {page: 2, pageSize: 2})
  })

  it('honors single-page mode limits', async () => {
    const client = {
      get: vi.fn().mockResolvedValue({
        data: [{id: 1}, {id: 2}, {id: 3}],
        hasMore: true,
      }),
    }

    const results = await paginate<{id: number}>(client, '/jobs', {}, {limit: 2})

    expect(results).toEqual([{id: 1}, {id: 2}])
    expect(client.get).toHaveBeenCalledWith('/jobs', {page: 1, pageSize: 2})
  })
})
