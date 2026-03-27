import {afterEach, describe, expect, it, vi} from 'vitest'

import CallsGet from '../../src/commands/calls/get.js'
import CallsList from '../../src/commands/calls/list.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('calls commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a calls table for calls list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createCall()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await CallsList.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/calls', {
      createdBefore: undefined,
      createdOnOrAfter: undefined,
      page: 1,
      pageSize: 50,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Completed')
    expect(rendered).toContain('Harper Family')
  })

  it('renders a call record for calls get', async () => {
    const getSpy = vi.fn().mockResolvedValue(createCall())
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await CallsGet.run(['8812'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/calls/8812')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Completed')
    expect(rendered).toContain('Maintenance')
  })
})

function createCall() {
  return {
    answeredBy: {
      name: 'Jordan Patel',
    },
    createdOn: '2026-03-26T15:20:00Z',
    customer: {
      name: 'Harper Family',
    },
    durationSeconds: 420,
    id: 8812,
    reason: 'Maintenance',
    status: 'Completed',
  }
}
