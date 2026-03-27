# Architecture

This document describes the internal design of the ServiceTitan CLI (`st`).

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLI Entry Point                          │
│                    bin/run.js  →  oclif/core                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
         ┌───────────────────▼───────────────────┐
         │            Command Layer               │
         │  src/commands/<group>/<action>.ts      │
         │  All extend BaseCommand                │
         └──────────────┬────────────────────────┘
                        │
      ┌─────────────────▼──────────────────────┐
      │             BaseCommand                 │
      │  initializeRuntime() → auth + client    │
      │  renderRecords() / renderRecord()       │
      │  outputFormat, compact, profile flags   │
      └─────┬──────────┬──────────┬────────────┘
            │          │          │
    ┌───────▼──┐ ┌─────▼───┐ ┌───▼──────────┐
    │  Config  │ │  Auth   │ │    Client     │
    │  (XDG)   │ │ (keytar)│ │ (axios HTTP) │
    └──────────┘ └─────────┘ └──────┬───────┘
                                    │
              ┌─────────────────────▼──────────────────┐
              │           ServiceTitan REST API         │
              │  auth.servicetitan.io  (OAuth token)    │
              │  api.servicetitan.io   (domain data)    │
              └────────────────────────────────────────┘
```

Supporting libraries used by commands and BaseCommand:

```
src/lib/
  auth.ts          Keytar credential storage + env var override
  base-command.ts  Abstract base class for all commands
  client.ts        HTTP client, route table, retry logic
  config.ts        XDG config, profile management
  date-ranges.ts   Period/date range resolution for revenue/snapshot
  data.ts          Path access helpers, formatting utilities
  entities.ts      Response → domain object mappers
  intelligence.ts  Revenue (Report 175) + Snapshot aggregation
  output.ts        Table / JSON / CSV printers
  pagination.ts    hasMore-based auto-pagination
  prompts.ts       promptText, promptSecret, confirmAction
  types.ts         Shared TypeScript types
  write-ops.ts     Body builders and normalization for write commands
```

---

## Command Structure

Commands are organized as oclif **topics** (directories) with individual action files:

```
src/commands/
  auth/           login, logout, status, token
  customers/      list, get, create, update
  jobs/           list, get, book, update, cancel, complete
  invoices/       list, get
  techs/          list, get
  memberships/    list, get, types
  estimates/      list, get
  leads/          list, get, convert, dismiss
  bookings/       list, get, accept, dismiss
  pricebook/      services, materials, equipment
  dispatch/       board, capacity, assign
  reporting/      list, run
  appointments/   list
  locations/      list, get
  business-units/ list
  employees/      list
  job-types/      list
  calls/          list
  payroll/        list
  timesheets/     list
  activities/     list
  inventory/      list
  api/            get, post, put, delete  (escape hatch)
  completion/     install
  revenue.ts      (top-level command)
  snapshot.ts     (top-level command)
```

### BaseCommand Pattern

Every command extends `BaseCommand`, which provides:

1. **`initializeRuntime(flags, options?)`** — loads config, resolves active profile, retrieves credentials from keychain (or env vars), and constructs a `ServiceTitanClient`. Returns `{ client, config, profile, profileName }`.

2. **`renderRecords(records, options?)`** — renders a list to table/JSON/CSV using `outputFormat`, applying field projection and compact shaping.

3. **`renderRecord(record, options?)`** — renders a single record as a two-column key/value table or JSON/CSV row.

4. **`renderPayload(payload, options?)`** — auto-detects single vs. multi-record and delegates to `renderRecord`/`renderRecords`.

5. **`parseFields(fields)`** — splits a comma-separated `--fields` string into an array.

6. **`catch(error)`** — uniform error handling: `ServiceTitanApiError` with actionable tips, generic `Error`, or fallback.

**Base flags** available on every command:
| Flag | Description |
|------|-------------|
| `--output table\|json\|csv` | Output format (also `ST_OUTPUT` env var) |
| `--profile <name>` | Profile to use (also `ST_PROFILE` env var) |
| `--color/--no-color` | Enable/disable color |
| `--compact` | Strip null/empty fields (also `ST_AGENT_MODE=1`) |

---

## Authentication Flow

### Credential Storage

Credentials (`clientId`, `clientSecret`) are stored as JSON in the **OS keychain** via `keytar`:

- **Service name:** `@rowvyn/servicetitan-cli`
- **Account name:** profile name (e.g. `default`, `production`)
- **Legacy fallback:** also checks `servicetitan-cli` for backwards compatibility

On `st auth login`, the user is prompted for `clientId` and `clientSecret` (with TTY guard — throws in non-interactive mode). Credentials are serialized to JSON and saved via `keytar.setPassword`.

### Environment Variable Override

For CI/CD pipelines where keychain access is unavailable, credentials can be injected via environment variables:

```
ST_CLIENT_ID=<id>
ST_CLIENT_SECRET=<secret>
```

When both are set, `getCredentials()` returns them directly and skips the keychain lookup entirely.

### Profile Resolution Order

1. `--profile <name>` flag
2. `ST_PROFILE` environment variable
3. `config.default` field in `~/.config/st/config.json`
4. First key in `config.profiles` (if default is missing/invalid)

### OAuth Token Lifecycle

`ServiceTitanClient` manages tokens via a simple in-memory cache:

1. On first request, `ensureToken()` calls `POST /connect/token` with `client_credentials` grant type to `auth.servicetitan.io` (or `auth-integration.servicetitan.io`).
2. The response `access_token` and computed `expiresAt` (`Date.now() + expires_in * 1000`) are cached.
3. Subsequent requests use the cached token if `expiresAt - 60_000ms` has not passed (60-second buffer).
4. **On 401:** the token is cleared, a fresh token is fetched, and the original request is retried once (`__stRetried401` guard prevents infinite loops).
5. **Concurrent requests:** a single `tokenRequest` promise is shared — parallel requests await the same fetch instead of racing.

All API requests include:
- `Authorization: Bearer <token>`
- `ST-App-Key: <appKey>` (app key from profile config)

---

## API Client

`ServiceTitanClient` (`src/lib/client.ts`) wraps axios with two instances:

| Instance | Base URL | Purpose |
|----------|----------|---------|
| `authHttp` | `https://auth[.environment].servicetitan.io` | OAuth token endpoint only |
| `http` | `https://api[.environment].servicetitan.io` | All domain API calls |

### Environments

| Name | Auth Host | API Host |
|------|-----------|----------|
| `integration` | `auth-integration.servicetitan.io` | `api-integration.servicetitan.io` |
| `production` | `auth.servicetitan.io` | `api.servicetitan.io` |

### Route Table & Module-Prefix Resolution

ServiceTitan's API groups endpoints under module-versioned prefixes:
`/<module>/v2/tenant/<tenantId>/<endpoint>`

`addApiPrefix(path)` resolves this automatically using `ROUTE_TABLE`:

```typescript
export const ROUTE_TABLE: Record<string, ServiceTitanModule> = {
  '/customers':    'crm',
  '/jobs':         'jpm',
  '/invoices':     'accounting',
  '/technicians':  'settings',
  '/memberships':  'memberships',
  '/estimates':    'sales',
  '/leads':        'crm',
  '/bookings':     'crm',
  '/dispatch':     'dispatch',
  '/calls':        'telecom',
  '/payrolls':     'payroll',
  // ... 80+ routes total
}
```

Resolution algorithm:
1. Normalize path (ensure leading `/`)
2. If path already matches `/<module>/v<n>/...`, pass through unchanged (supports `api` escape hatch)
3. Longest-match lookup in `ROUTE_TABLE`
4. Prepend `/<module>/v2/tenant/<tenantId>`

The `{tenant}` placeholder in raw paths is replaced with the actual tenant ID via `resolveRawPath()`.

### Rate Limiting & Retry Logic

**Reporting API throttle:** The Reporting API enforces a ~1 req/min per report. `throttleReportingCall(reportId)` tracks the last call timestamp per report ID and inserts a `12_000ms` minimum gap.

**429 retry:** On `429 Too Many Requests`, the request is retried up to **2 times**:
- Parses `Retry-After` header (supports seconds-as-number, seconds-as-string, and HTTP-date format)
- Falls back to exponential backoff: `min(2^attempt * 1000, 30_000)ms`
- `__stRetryCount429` guard prevents retry loops

**401 retry:** One automatic retry after token refresh (see [Authentication Flow](#authentication-flow)).

**Error messages:** `ServiceTitanApiError` attempts to extract a human-readable message from the response body by checking `message`, `error`, `detail`, and `title` keys.

**Timeout:** Default 30 seconds. Overridable via `ST_TIMEOUT` environment variable (milliseconds).

---

## Intelligence Layer

`src/lib/intelligence.ts` provides two high-level aggregation functions.

### `getRevenueSummary(client, options)`

Calculates revenue for a given date range/period.

**Primary path — Report 175 (Reporting API):**

```
POST /report-category/business-unit-dashboard/reports/175/data
Body: { parameters: [{ name: 'From', value: '...' }, { name: 'To', value: '...' }] }
```

Report 175 is ServiceTitan's native "Business Unit Dashboard → Revenue" report. It's the same data source used by the ST dashboard, and matches within rounding. The response contains rows indexed by position:

| Index | Field |
|-------|-------|
| 0 | Name |
| 1 | CompletedRevenue |
| 2 | OpportunityJobAverage |
| 3 | OpportunityConversionRate |
| 4 | Opportunity |
| 5 | ConvertedJobs |
| 6 | CustomerSatisfaction |
| 7 | AdjustmentRevenue |
| 8 | **TotalRevenue** |
| 9 | NonJobRevenue |

**Why not invoice aggregation?**
The `/invoices` endpoint does not support server-side date filtering — it returns all invoices and expects client-side filtering. For large tenants this means paginating through thousands of records while still getting inaccurate results (no void/cancelled exclusion by default). Report 175 handles all of this server-side.

**Fallback path:** When `client.post` is unavailable (test contexts using a mock that only implements `get`), the function falls back to invoice aggregation, filtering out void/cancelled and zero-value invoices.

### `getSnapshotSummary(client, date)`

Returns a point-in-time business snapshot for a given date. Six metrics are fetched **concurrently** via `Promise.allSettled`:

| Metric | Source |
|--------|--------|
| `jobs_today` | `GET /jobs?scheduledOnOrAfter=<date>&scheduledOnOrBefore=<date>&jobStatus=Scheduled,InProgress` |
| `jobs_this_week` | `GET /jobs?scheduledOnOrAfter=<weekStart>&scheduledOnOrBefore=<weekEnd>` |
| `open_leads` | `GET /leads?status=open` (totalCount) |
| `open_estimates` | `GET /estimates?status=open` (totalCount) |
| `active_memberships` | `GET /memberships?active=true` (totalCount) |
| `revenue_mtd` | `getRevenueSummary(client, { period: 'month', referenceDate: date })` |

Failures for individual metrics are captured in `summary.errors` — a single failing metric does not abort the snapshot.

**Count optimization:** `countResults()` requests `pageSize=1` and reads `totalCount` from the response if available. Only if `totalCount` is absent and `hasMore` is true does it fall back to full pagination.

---

## Output System

`src/lib/output.ts` provides format-specific print functions. `BaseCommand` dispatches to them based on `this.outputFormat`.

### Format Selection Priority

1. `--output <format>` flag
2. `ST_OUTPUT` environment variable
3. `config.output` (default: `table`)

### Formats

**Table:** Uses `cli-ux` table renderer with auto-generated column headers (`titleCase(field)`). Currency fields (matching `/amount|balance|cost|price|revenue|total/i`) are formatted as `$1,234.56`. ISO date strings are formatted as `MM/DD/YYYY` or `MM/DD/YYYY HH:MM`.

**JSON:** `JSON.stringify` with 2-space indent, printed to stdout.

**CSV:** Header row derived from field list; values serialized with proper quoting.

### Compact Mode

Enabled by `--compact`, `config.compact: true`, or `ST_AGENT_MODE=1`.

When compact mode is active, `shapeRecord()` runs each record through `compactValue()` (`src/lib/data.ts`), which recursively strips `null`, `undefined`, and empty-string values. This produces minimal JSON payloads suitable for AI agents and scripts.

### Field Projection

`--fields id,name,status` projects output to only the specified columns. The `parseFields()` helper splits and trims the comma-separated value. Projection is applied after entity mapping and compaction.

---

## Pagination

`src/lib/pagination.ts` — `paginate<T>(client, path, params, options)`

ServiceTitan uses a `{ data: T[], hasMore: boolean, totalCount?: number }` envelope.

### Single Page (default)

Without `--all`, one request is made with the resolved `page` and `pageSize`. If `--limit N` is set, the result is sliced to `N` records.

### Auto-Pagination (`--all`)

With `--all` (maps to `options.all: true`):

1. Starts at `page=1`, increments by 1 per request
2. Appends `response.data` to results
3. Stops when `response.hasMore === false` or `response.data.length === 0`
4. Respects `--limit N` (stops early when `results.length >= limit`)
5. Shows a `ora` spinner with live count (suppressed when `stdout` is not a TTY)

**Default page size:** 50 records  
**Max page size:** 5000 records (capped via `normalizePageSize`)

---

## Config System

`src/lib/config.ts` — JSON config file with Zod validation.

### File Location

| Condition | Path |
|-----------|------|
| `ST_CONFIG_DIR` set | `$ST_CONFIG_DIR/config.json` |
| `XDG_CONFIG_HOME` set | `$XDG_CONFIG_HOME/st/config.json` |
| Default (macOS/Linux) | `~/.config/st/config.json` |

### Schema (v1)

```typescript
{
  version: '1',
  default: string,       // active profile name
  output: 'table' | 'json' | 'csv',
  color: boolean,
  compact: boolean,
  profiles: {
    [name: string]: {
      environment: 'integration' | 'production',
      tenantId: string,
      appKey: string,
    }
  }
}
```

Validated with Zod on read; falls back to `DEFAULT_CONFIG` if file is missing (`ENOENT`). Throws on parse errors.

### Write Safety

`saveConfig()` and `saveProfile()` use `chmod(configPath, 0o600)` after writing — config files are owner read/write only. The config directory is created with `mode: 0o700`.

### Profile Lifecycle

| Operation | Function |
|-----------|----------|
| Add/update profile | `saveProfile(name, profile)` |
| Set active profile | `setDefaultProfile(name)` |
| Delete profile | `deleteProfile(name)` — auto-selects next profile as default |
| Read active profile | `getActiveProfileName()` — checks `ST_PROFILE` env var first |

---

## Write Safety

All mutating commands follow a three-layer safety model:

### 1. `--dry-run`

Prints the request body (as JSON) without making any API call. Implemented in each write command before the actual `client.post/put/patch/delete` call.

### 2. `confirmAction(message, autoConfirm)`

Interactive Y/N prompt before executing destructive operations (cancel job, dismiss lead, etc.):

- If `autoConfirm = true` (from `--yes` flag): skips prompt and returns `true`
- If stdin is not a TTY and `autoConfirm = false`: throws with instructions to use `--yes`
- Otherwise: prompts `"<message> (y/N):"` — defaults to `N`

### 3. Environment variable overrides

Profile config fields can be overridden per-invocation:

| Env Var | Overrides |
|---------|-----------|
| `ST_APP_KEY` | `profile.appKey` |
| `ST_TENANT_ID` | `profile.tenantId` |
| `ST_ENVIRONMENT` | `profile.environment` |
| `ST_CLIENT_ID` | credential `clientId` |
| `ST_CLIENT_SECRET` | credential `clientSecret` |

This pattern supports CI/CD pipelines and per-command overrides without modifying stored config.
