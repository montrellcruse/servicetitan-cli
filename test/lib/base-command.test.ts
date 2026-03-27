import {afterEach, describe, expect, it, vi} from 'vitest'

import {BaseCommand} from '../../src/lib/base-command.js'
import type {OutputFormat} from '../../src/lib/types.js'

class DummyCommand extends BaseCommand {
  public async run(): Promise<void> {}

  public async renderEmpty(format: OutputFormat): Promise<void> {
    this.outputFormat = format
    await this.renderRecords([], {defaultFields: ['id', 'name']})
  }
}

describe('BaseCommand renderRecords', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints an empty JSON array for empty result sets', async () => {
    let written = ''
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      written += String(chunk)
      return true
    })

    const command = new DummyCommand([], {root: process.cwd()})
    await command.renderEmpty('json')

    expect(written).toBe('[]\n')
  })

  it('prints CSV headers without a human info line for empty result sets', async () => {
    let written = ''
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
      written += String(chunk)
      return true
    })

    const command = new DummyCommand([], {root: process.cwd()})
    await command.renderEmpty('csv')

    expect(written).toContain('id,name')
    expect(written).not.toContain('No results found.')
  })
})
