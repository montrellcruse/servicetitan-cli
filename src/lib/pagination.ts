import ora from 'ora'

import type {PaginatedResponse, PaginationOptions} from './types.js'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 5000

interface PaginatedClient {
  get<T>(path: string, params?: Record<string, unknown>): Promise<PaginatedResponse<T>>
}

export async function paginate<T>(
  client: PaginatedClient,
  path: string,
  params: Record<string, unknown> = {},
  options: PaginationOptions = {},
): Promise<T[]> {
  const page = normalizePageNumber(params.page)
  const limit = options.limit
  const pageSize = normalizePageSize(options.pageSize ?? (!options.all ? limit : undefined))

  if (!options.all) {
    const response = await client.get<T>(path, {
      ...params,
      page,
      pageSize,
    })

    return typeof limit === 'number' ? response.data.slice(0, limit) : response.data
  }

  const spinner = ora({
    text: 'Fetching results...',
    isEnabled: process.stdout.isTTY,
  }).start()

  const results: T[] = []
  let currentPage = page

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await client.get<T>(path, {
        ...params,
        page: currentPage,
        pageSize,
      })

      const remaining = typeof limit === 'number' ? limit - results.length : response.data.length
      results.push(...response.data.slice(0, remaining))

      spinner.text = `Fetched ${results.length} result${results.length === 1 ? '' : 's'}...`

      if (typeof limit === 'number' && results.length >= limit) {
        break
      }

      if (response.hasMore === false || response.data.length === 0) {
        break
      }

      currentPage += 1
    }

    spinner.succeed(`Fetched ${results.length} result${results.length === 1 ? '' : 's'}.`)
    return results
  } catch (error) {
    spinner.fail('Pagination failed.')
    throw error
  }
}

function normalizePageNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  return 1
}

function normalizePageSize(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 1) {
    return DEFAULT_PAGE_SIZE
  }

  return Math.min(Math.trunc(value), MAX_PAGE_SIZE)
}
