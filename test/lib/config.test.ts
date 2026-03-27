import {mkdtemp, rm, stat} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {
  deleteProfile,
  getActiveProfileName,
  getConfig,
  getConfigPath,
  saveConfig,
  saveProfile,
} from '../../src/lib/config.js'

describe('config', () => {
  let configDir = ''

  beforeEach(async () => {
    configDir = await mkdtemp(join(tmpdir(), 'st-config-'))
    process.env.ST_CONFIG_DIR = configDir
  })

  afterEach(async () => {
    delete process.env.ST_CONFIG_DIR
    await rm(configDir, {force: true, recursive: true})
  })

  it('saves and reads profile config', async () => {
    await saveProfile('demo', {
      appKey: 'app-key',
      environment: 'integration',
      tenantId: '42',
    })

    const config = await getConfig()

    expect(config.default).toBe('demo')
    expect(config.profiles.demo).toEqual({
      appKey: 'app-key',
      environment: 'integration',
      tenantId: '42',
    })
    expect(await getActiveProfileName()).toBe('demo')
  })

  it('writes and reads the full config shape', async () => {
    await saveConfig({
      color: false,
      compact: true,
      default: 'primary',
      output: 'json',
      profiles: {
        primary: {
          appKey: 'app-key',
          environment: 'production',
          tenantId: '99',
        },
      },
      version: '1',
    })

    const config = await getConfig()

    expect(config.output).toBe('json')
    expect(config.color).toBe(false)
    expect(config.compact).toBe(true)
  })

  it('writes the config file with owner-only permissions', async () => {
    await saveConfig({
      color: true,
      compact: false,
      default: 'primary',
      output: 'table',
      profiles: {
        primary: {
          appKey: 'app-key',
          environment: 'production',
          tenantId: '99',
        },
      },
      version: '1',
    })

    const info = await stat(getConfigPath())

    expect(info.mode & 0o777).toBe(0o600)
  })

  it('deletes profiles and resets the default', async () => {
    await saveProfile('alpha', {
      appKey: 'alpha-key',
      environment: 'production',
      tenantId: '1',
    })
    await saveProfile('beta', {
      appKey: 'beta-key',
      environment: 'integration',
      tenantId: '2',
    })

    await deleteProfile('alpha')

    const config = await getConfig()
    expect(config.default).toBe('beta')
    expect(config.profiles.alpha).toBeUndefined()
  })
})
