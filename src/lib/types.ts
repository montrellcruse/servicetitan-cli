export type EnvironmentName = 'integration' | 'production'

export type OutputFormat = 'table' | 'json' | 'csv'

export type ServiceTitanModule =
  | 'crm'
  | 'jpm'
  | 'dispatch'
  | 'accounting'
  | 'sales'
  | 'pricebook'
  | 'payroll'
  | 'memberships'
  | 'marketing'
  | 'telecom'
  | 'inventory'
  | 'reporting'
  | 'settings'
  | 'timesheets'
  | 'task-management'
  | 'forms'

export interface ProfileConfig {
  appKey: string
  environment: EnvironmentName
  tenantId: string
}

export interface ConfigFile {
  color: boolean
  compact: boolean
  default: string
  output: OutputFormat
  profiles: Record<string, ProfileConfig>
  version: '1'
}

export interface Credentials {
  clientId: string
  clientSecret: string
}

export interface ServiceTitanClientOptions extends ProfileConfig, Credentials {
  timeout?: number
}

export interface AccessTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export interface PaginatedResponse<T> {
  data: T[]
  hasMore?: boolean
  totalCount?: number
}

export interface PaginationOptions {
  all?: boolean
  limit?: number
  pageSize?: number
}

export type JsonPrimitive = boolean | number | null | string

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export interface JsonObject {
  [key: string]: JsonValue
}

export type UnknownRecord = Record<string, unknown>
