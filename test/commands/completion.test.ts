import {mkdtemp, readFile, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {afterEach, describe, expect, it, vi} from 'vitest'

import CompletionInstall from '../../src/commands/completion/install.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('completion install', () => {
  let tempHome: string | undefined
  const originalHome = process.env.HOME

  afterEach(async () => {
    vi.restoreAllMocks()

    if (tempHome) {
      await rm(tempHome, {force: true, recursive: true})
      tempHome = undefined
    }

    if (originalHome === undefined) {
      delete process.env.HOME
    } else {
      process.env.HOME = originalHome
    }
  })

  it('installs fish completion into the user home directory', async () => {
    tempHome = await mkdtemp(join(tmpdir(), 'st-home-'))
    process.env.HOME = tempHome
    const {output} = createTestContext()

    await CompletionInstall.run(['--shell', 'fish', '--yes'], process.cwd())

    const completionPath = join(tempHome, '.config', 'fish', 'completions', 'st.fish')
    const script = await readFile(completionPath, 'utf8')

    expect(script).toContain('# st completion start')
    expect(script).toContain('complete -c st -f -a "(__st_completion)"')
    expect(stripAnsi(output())).toContain(`Installed fish completion at ${completionPath}`)
  })
})
