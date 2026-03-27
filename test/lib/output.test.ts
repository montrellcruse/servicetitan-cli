import {afterEach, describe, expect, it, vi} from 'vitest'

import {printJSON, printSuccess, printTable, setColorEnabled} from '../../src/lib/output.js'

describe('output', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setColorEnabled(undefined)
    delete process.env.FORCE_COLOR
  })

  it('renders table headers and rows', () => {
    let written = ''
    vi.spyOn(process.stdout, 'write').mockImplementation((...args: unknown[]) => {
      written += String(args[0])
      return true
    })

    printTable(['ID', 'Name'], [[1, 'Alice']])

    expect(written).toContain('ID')
    expect(written).toContain('Name')
    expect(written).toContain('Alice')
  })

  it('prints valid JSON', () => {
    let written = ''
    vi.spyOn(process.stdout, 'write').mockImplementation((...args: unknown[]) => {
      written += String(args[0])
      return true
    })

    printJSON({ok: true, count: 2})

    expect(JSON.parse(written)).toEqual({ok: true, count: 2})
  })

  it('disables ANSI color output when color is turned off explicitly', () => {
    let written = ''
    vi.spyOn(process.stdout, 'write').mockImplementation((...args: unknown[]) => {
      written += String(args[0])
      return true
    })
    process.env.FORCE_COLOR = '1'

    setColorEnabled(false)
    printSuccess('ok')

    expect(written).not.toContain('\u001B[')
  })
})
