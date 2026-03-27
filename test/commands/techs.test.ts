import {afterEach, describe, expect, it, vi} from 'vitest'

import TechsGet from '../../src/commands/techs/get.js'
import TechsList from '../../src/commands/techs/list.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('techs commands', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a technicians table for techs list', async () => {
    const getSpy = vi.fn().mockResolvedValue({
      data: [createTechnician()],
      hasMore: false,
    })
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await TechsList.run([], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/technicians', {
      active: undefined,
      page: 1,
      pageSize: 50,
    })
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Ava Thompson')
    expect(rendered).toContain('ava.thompson@example.com')
  })

  it('fetches and renders a single technician', async () => {
    const getSpy = vi.fn().mockResolvedValue(createTechnician())
    const {output} = createTestContext({
      client: {
        get: getSpy,
      },
    })

    await TechsGet.run(['52'], process.cwd())

    expect(getSpy).toHaveBeenCalledWith('/technicians/52')
    const rendered = stripAnsi(output())
    expect(rendered).toContain('Residential HVAC')
    expect(rendered).toContain('EMP-1042')
  })
})

function createTechnician() {
  return {
    active: true,
    businessUnit: {
      name: 'Residential HVAC',
    },
    email: 'ava.thompson@example.com',
    employeeId: 'EMP-1042',
    id: 52,
    name: 'Ava Thompson',
    phone: '602-555-0125',
  }
}
