import {Command, Flags} from '@oclif/core'

import {getCredentials} from './auth.js'
import {extractResponseRecords, isUnknownRecord} from './api.js'
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
  json: Flags.boolean({
    description: 'Output as JSON (shorthand for --output json)',
    exclusive: ['output'],
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
  protected configData?: ConfigFile
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

  protected requireClient(): ServiceTitanClient {
    if (!this.client) {
      throw new Error('Client not initialized. Call initializeRuntime() first.')
    }

    return this.client
  }

  protected async initializeRuntime(
    flags: {
      color?: boolean
      compact?: boolean
      json?: boolean
      output?: string
      profile?: string
    },
    options: RuntimeOptions = {},
  ): Promise<RuntimeContext> {
    const config = await getConfig()
    const colorEnabled = flags.color ?? config.color
    this.outputFormat = resolveOutputFormat(flags.output, config)
    if (flags.json) {
      this.outputFormat = 'json'
    }

    this.compact = Boolean((flags.compact ?? config.compact) || process.env.ST_AGENT_MODE === '1')
    this.configData = config

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
      if (this.outputFormat === 'json') {
        printJSON([])
        return
      }

      if (this.outputFormat === 'csv') {
        const fields = options.fields ?? options.defaultFields ?? []

        if (fields.length > 0) {
          await printCSV(fields, [])
        }

        return
      }

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

  protected async renderPayload(
    payload: unknown,
    options: {defaultFields?: string[]; fields?: string[]} = {},
  ): Promise<void> {
    if (this.outputFormat === 'json') {
      printJSON(payload)
      return
    }

    const records = extractResponseRecords(payload)

    if (records.length > 1) {
      await this.renderRecords(records, options)
      return
    }

    if (records.length === 1) {
      await this.renderRecord(records[0], options)
      return
    }

    if (isUnknownRecord(payload)) {
      await this.renderRecord(payload, options)
      return
    }

    printJSON(payload)
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
      return /[T ]\d{2}:\d{2}/.test(value) ? formatDateTime(value) : formatDate(value)
    }

    return value
  }

  return JSON.stringify(value)
}

function getApiErrorTip(status: number | undefined): string | undefined {
  switch (status) {
    case 401: {
      return 'Your access token may have expired. Try `st auth login` to re-authenticate.'
    }

    case 403: {
      return 'Your app key may not have access to this resource. Check API permissions in the ServiceTitan developer portal.'
    }

    case 404: {
      return 'The resource was not found. Verify the ID and ensure it exists in your tenant.'
    }

    case 429: {
      return 'Rate limited by ServiceTitan. The CLI will retry automatically, but you may need to wait.'
    }

    case 500: {
      return 'ServiceTitan API server error. This is usually temporary — try again in a few minutes.'
    }

    default: {
      return undefined
    }
  }
}
