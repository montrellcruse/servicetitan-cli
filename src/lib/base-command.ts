import {Command, Flags} from '@oclif/core'

import {getCredentials} from './auth.js'
import {ServiceTitanApiError, ServiceTitanClient} from './client.js'
import {getActiveProfileName, getConfig, resolveOutputFormat} from './config.js'
import {
  compactValue,
  formatDate,
  formatDateTime,
  getPathValue,
  looksLikeIsoDate,
  titleCase,
} from './data.js'
import {
  printCSV,
  printError,
  printInfo,
  printJSON,
  printTable,
  setColorEnabled,
} from './output.js'
import type {
  ConfigFile,
  JsonObject,
  OutputFormat,
  ProfileConfig,
  UnknownRecord,
} from './types.js'

export const baseFlags = {
  output: Flags.string({
    description: 'Output format',
    options: ['table', 'json', 'csv'],
  }),
  profile: Flags.string({
    description: 'Profile name to use',
  }),
  color: Flags.boolean({
    allowNo: true,
    description: 'Enable or disable color output',
  }),
  compact: Flags.boolean({
    description: 'Trim output for scripts and AI agents',
  }),
}

interface RuntimeOptions {
  requireAuth?: boolean
}

interface RuntimeContext {
  client?: ServiceTitanClient
  config: ConfigFile
  profile?: ProfileConfig
  profileName?: string
}

export abstract class BaseCommand extends Command {
  protected client?: ServiceTitanClient
  protected compact = false
  protected config?: ConfigFile
  protected outputFormat: OutputFormat = 'table'
  protected profile?: ProfileConfig
  protected profileName?: string

  public catch(error: unknown): Promise<void> {
    if (error instanceof ServiceTitanApiError) {
      const detail = error.status ? `${error.message} (${error.status})` : error.message
      printError(detail, getApiErrorTip(error.status))
      this.exit(1)
    }

    if (error instanceof Error) {
      printError(error.message)
      this.exit(1)
    }

    printError('Unexpected error.')
    this.exit(1)
    return Promise.resolve()
  }

  protected async initializeRuntime(
    flags: {
      color?: boolean
      compact?: boolean
      output?: string
      profile?: string
    },
    options: RuntimeOptions = {},
  ): Promise<RuntimeContext> {
    const config = await getConfig()
    const colorEnabled = flags.color ?? config.color
    this.outputFormat = resolveOutputFormat(flags.output, config)
    this.compact = Boolean((flags.compact ?? config.compact) || process.env.ST_AGENT_MODE === '1')
    this.config = config

    setColorEnabled(colorEnabled)

    if (options.requireAuth === false) {
      return {config}
    }

    const profileName = flags.profile ?? (await getActiveProfileName())

    if (!profileName) {
      throw new Error('No active profile configured. Run `st auth login` first.')
    }

    const profile = resolveProfile(profileName, config)
    const credentials = await getCredentials(profileName)

    if (!credentials) {
      throw new Error(
        `No credentials found for profile "${profileName}". Run \`st auth login --profile ${profileName}\`.`,
      )
    }

    this.profileName = profileName
    this.profile = profile
    this.client = new ServiceTitanClient({
      ...profile,
      ...credentials,
    })

    return {
      client: this.client,
      config,
      profile,
      profileName,
    }
  }

  protected parseFields(fields: string | undefined): string[] | undefined {
    const values = fields
      ?.split(',')
      .map(field => field.trim())
      .filter(Boolean)

    return values && values.length > 0 ? values : undefined
  }

  protected async renderRecords(
    records: UnknownRecord[],
    options: {defaultFields?: string[]; fields?: string[]} = {},
  ): Promise<void> {
    if (records.length === 0) {
      printInfo('No results found.')
      return
    }

    const shaped = records.map(record => this.shapeRecord(record))
    const fields = options.fields ?? options.defaultFields ?? Object.keys(shaped[0])
    const projected = shaped.map(record => projectRecord(record, fields))

    switch (this.outputFormat) {
      case 'json': {
        printJSON(projected)
        break
      }

      case 'csv': {
        await printCSV(fields, projected.map(record => fields.map(field => record[field])))
        break
      }

      default: {
        printTable(
          fields.map(field => titleCase(field)),
          projected.map(record => fields.map(field => formatCell(field, record[field]))),
        )
      }
    }
  }

  protected async renderRecord(
    record: UnknownRecord,
    options: {defaultFields?: string[]; fields?: string[]} = {},
  ): Promise<void> {
    const shaped = this.shapeRecord(record)
    const fields = options.fields ?? options.defaultFields ?? Object.keys(shaped)

    if (this.outputFormat === 'json') {
      printJSON(projectRecord(shaped, fields))
      return
    }

    if (this.outputFormat === 'csv') {
      await printCSV(fields, [fields.map(field => getPathValue(shaped, field))])
      return
    }

    printTable(
      ['Field', 'Value'],
      fields.map(field => [titleCase(field), formatCell(field, getPathValue(shaped, field))]),
    )
  }

  private shapeRecord(record: UnknownRecord): JsonObject {
    if (!this.compact) {
      return record as JsonObject
    }

    return (compactValue(record) as JsonObject | undefined) ?? {}
  }
}

function resolveProfile(profileName: string, config: ConfigFile): ProfileConfig {
  const stored = config.profiles[profileName]

  if (!stored) {
    throw new Error(`Profile "${profileName}" does not exist. Run \`st auth login --profile ${profileName}\`.`)
  }

  return {
    appKey: process.env.ST_APP_KEY ?? stored.appKey,
    tenantId: process.env.ST_TENANT_ID ?? stored.tenantId,
    environment:
      process.env.ST_ENVIRONMENT === 'integration' || process.env.ST_ENVIRONMENT === 'production'
        ? process.env.ST_ENVIRONMENT
        : stored.environment,
  }
}

function projectRecord(record: JsonObject, fields: string[]): JsonObject {
  return Object.fromEntries(fields.map(field => [field, getPathValue(record, field) ?? null])) as JsonObject
}

function formatCell(field: string, value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    if (/(amount|balance|cost|price|revenue|total)/i.test(field)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value)
    }

    return String(value)
  }

  if (typeof value === 'string') {
    if (looksLikeIsoDate(value)) {
      return /(scheduled|time|date)$/i.test(field) ? formatDateTime(value) : formatDate(value)
    }

    return value
  }

  return JSON.stringify(value)
}

function getApiErrorTip(status: number | undefined): string | undefined {
  switch (status) {
    case 401: {
      return 'Run `st auth login` to refresh your credentials for this profile.'
    }

    case 404: {
      return 'Check the identifier and confirm you are using the correct tenant profile.'
    }

    case 429: {
      return 'Retry after the rate limit window resets, or reduce concurrent requests.'
    }

    default: {
      return undefined
    }
  }
}
