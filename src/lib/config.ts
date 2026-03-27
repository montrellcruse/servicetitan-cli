import {chmod, mkdir, readFile, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {dirname, join} from 'node:path'

import {z} from 'zod'

import type {ConfigFile, OutputFormat, ProfileConfig} from './types.js'

const profileSchema = z.object({
  environment: z.enum(['integration', 'production']),
  tenantId: z.string().min(1),
  appKey: z.string().min(1),
})

const configSchema = z.object({
  version: z.literal('1'),
  default: z.string(),
  output: z.enum(['table', 'json', 'csv']),
  color: z.boolean(),
  compact: z.boolean(),
  profiles: z.record(profileSchema),
})

const DEFAULT_CONFIG: ConfigFile = {
  version: '1',
  default: 'default',
  output: 'table',
  color: true,
  compact: false,
  profiles: {},
}

function resolveConfigRoot(): string {
  if (process.env.ST_CONFIG_DIR) {
    return process.env.ST_CONFIG_DIR
  }

  if (process.env.XDG_CONFIG_HOME) {
    return join(process.env.XDG_CONFIG_HOME, 'st')
  }

  return join(homedir(), '.config', 'st')
}

export function getConfigPath(): string {
  return join(resolveConfigRoot(), 'config.json')
}

export async function getConfig(): Promise<ConfigFile> {
  const configPath = getConfigPath()

  try {
    const raw = await readFile(configPath, 'utf8')
    const parsed = configSchema.parse(JSON.parse(raw))
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
    }
  } catch (error) {
    if (isMissingFileError(error)) {
      return structuredClone(DEFAULT_CONFIG)
    }

    if (error instanceof z.ZodError) {
      throw new Error(`Invalid config file at ${configPath}: ${error.message}`)
    }

    throw error
  }
}

export async function saveConfig(config: ConfigFile): Promise<void> {
  const configPath = getConfigPath()
  const normalized = configSchema.parse({
    ...DEFAULT_CONFIG,
    ...config,
  })

  await mkdir(dirname(configPath), {mode: 0o700, recursive: true})
  await writeFile(configPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  await chmod(configPath, 0o600)
}

export async function saveProfile(name: string, profile: ProfileConfig): Promise<void> {
  const config = await getConfig()
  const nextConfig: ConfigFile = {
    ...config,
    profiles: {
      ...config.profiles,
      [name]: profileSchema.parse(profile),
    },
  }

  if (!nextConfig.default || !nextConfig.profiles[nextConfig.default]) {
    nextConfig.default = name
  }

  await saveConfig(nextConfig)
}

export async function deleteProfile(name: string): Promise<void> {
  const config = await getConfig()
  const profiles = {...config.profiles}

  delete profiles[name]

  const nextDefault =
    config.default === name ? Object.keys(profiles)[0] ?? 'default' : config.default

  await saveConfig({
    ...config,
    default: nextDefault,
    profiles,
  })
}

export async function getActiveProfileName(): Promise<string | null> {
  if (process.env.ST_PROFILE) {
    return process.env.ST_PROFILE
  }

  const config = await getConfig()

  if (config.default && config.profiles[config.default]) {
    return config.default
  }

  return Object.keys(config.profiles)[0] ?? null
}

export async function setDefaultProfile(name: string): Promise<void> {
  const config = await getConfig()

  if (!config.profiles[name]) {
    throw new Error(`Profile "${name}" does not exist.`)
  }

  await saveConfig({
    ...config,
    default: name,
  })
}

export function resolveOutputFormat(
  preferred: string | undefined,
  config: ConfigFile,
): OutputFormat {
  const envValue = process.env.ST_OUTPUT

  if (preferred === 'table' || preferred === 'json' || preferred === 'csv') {
    return preferred
  }

  if (envValue === 'table' || envValue === 'json' || envValue === 'csv') {
    return envValue
  }

  return config.output
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
