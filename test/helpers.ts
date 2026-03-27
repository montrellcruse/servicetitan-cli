import {vi} from 'vitest'

import {BaseCommand} from '../src/lib/base-command.js'
import {ServiceTitanClient} from '../src/lib/client.js'
import type {ConfigFile, ProfileConfig} from '../src/lib/types.js'

export const CONFIG_STUB: ConfigFile = {
  color: true,
  compact: false,
  default: 'default',
  output: 'table',
  profiles: {},
  version: '1',
}

interface CreateTestContextOptions {
  client?: Partial<ServiceTitanClient>
  config?: ConfigFile
  profile?: ProfileConfig
  profileName?: string
}

export function createTestContext(
  options: CreateTestContextOptions = {},
): {
  client: ServiceTitanClient
  output: () => string
  mocks: {
    initializeRuntime: ReturnType<typeof vi.spyOn>
    stdout: ReturnType<typeof vi.spyOn>
  }
} {
  const config = options.config ?? CONFIG_STUB
  let written = ''
  const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
    written += String(chunk)
    return true
  })

  const client = new ServiceTitanClient({
    appKey: 'app-key',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    environment: 'integration',
    tenantId: '12345',
  })

  Object.assign(client, options.client ?? {})

  const initializeRuntime = vi.spyOn(BaseCommand.prototype as never, 'initializeRuntime').mockImplementation(
    function mockInitializeRuntime(this: BaseCommand, flags: {compact?: boolean; output?: string}) {
      this.outputFormat =
        flags.output === 'json' || flags.output === 'csv' || flags.output === 'table'
          ? flags.output
          : config.output
      this.compact = Boolean(flags.compact ?? config.compact)
      this.client = client
      this.configData = config
      this.profile = options.profile
      this.profileName = options.profileName

      return Promise.resolve({
        client,
        config,
        profile: options.profile,
        profileName: options.profileName,
      })
    },
  )

  return {
    client,
    output: () => written,
    mocks: {
      initializeRuntime,
      stdout,
    },
  }
}

export function stripAnsi(value: string): string {
  const escape = String.fromCharCode(27)
  let index = 0
  let result = ''

  while (index < value.length) {
    if (value[index] === escape && value[index + 1] === '[') {
      index += 2

      while (index < value.length && value[index] !== 'm') {
        index += 1
      }

      if (index < value.length) {
        index += 1
      }

      continue
    }

    result += value[index]
    index += 1
  }

  return result
}
