# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.3] - 2026-03-26

### Added
- MIT `LICENSE` file (also added to `package.json` `files` array)
- CI, npm version, and MIT license badges to README
- Requirements section to README (Node >=20, `libsecret` on Linux)
- Environment Variables reference section to README
- `.editorconfig`

### Changed
- Auth login error messages improved — specific guidance for 401 and 403 responses

### Fixed
- `promptSecret` now throws a clear error on non-interactive stdin (TTY guard)

## [0.2.2] - 2026-03-26

### Fixed
- Revenue command (`st revenue`) rewritten to use **Report 175** (Business Unit Dashboard via the Reporting API) instead of invoice aggregation. Revenue now matches the ServiceTitan dashboard within 0.24% — the old approach was off by up to 7× due to missing server-side date filtering on the invoices endpoint.
- Falls back to invoice aggregation only in test contexts where `post()` is unavailable
- Updated `revenue.test.ts` and `snapshot.test.ts` to mock Report 175 responses
- 150/150 tests passing

## [0.2.1] - 2026-03-26

### Fixed
- Customer list `phone`/`email` extraction — correctly reads from `contacts[]` array with fallback chain; empty values on list responses are now expected and documented
- Entity mapper cleanup for remaining fields across all domains
- Entity mapper field corrections for invoices, estimates, dispatch, and jobs:
  - Invoices: handle nested `status` object `{value: '...'}`
  - Jobs: read `jobStatus` (not `status`); fall back ID→name for `customer`/`type`/`businessUnit`
  - Estimates: handle nested `status`, resolve customer from ID or nested object
  - Dispatch: add `arrivalWindowStart`/`arrivalWindowEnd` for appointment times
- Revenue/snapshot date filter params corrected; total string parsing fixed
- Added entity unit tests (`test/lib/entities.test.ts`)

## [0.2.0] - 2026-03-26

### Added
- **Telecom/Calls commands** — `st calls list`
- **Payroll commands** — `st payroll list`
- **Inventory commands** — `st inventory list`, purchase orders, vendors, warehouses
- **Timesheets/Activities commands** — `st timesheets list`, `st activities list`
- Coverage gap fill for existing domains:
  - `st locations list/get`
  - `st business-units list`
  - `st employees list`
  - `st job-types list`
  - `st appointments list`

## [0.1.6] - 2026-03-26

### Fixed
- Entity mapper field paths corrected for jobs, invoices, memberships, estimates, dispatch, and customers (P0 + P1 issues):
  - Jobs: `jobStatus` (not `status`), ID→name fallback for customer/type/businessUnit
  - Invoices: nested `status` object handling
  - Memberships: `from`/`to` date fields (not `start`/`end`), type/customer resolution from IDs or nested objects
  - Estimates: nested `status`, customer from ID or nested object
  - Dispatch: `arrivalWindowStart`/`arrivalWindowEnd` for appointment times
  - Customers: phone/email extracted from `contacts[]` array
- Revenue: filter out void/cancelled AND zero-value invoices
- Snapshot: use `jobStatus` param (not `status`), fix `jobs_this_week` date range

## [0.1.5] - 2026-03-26

### Added
- Comprehensive audit of CLI behavior; hardened edge cases across commands
- Expanded test suite: `test/commands/auth.test.ts`, `test/commands/get-commands.test.ts`, `test/commands/pagination-flags.test.ts`, `test/commands/write-ops.test.ts`, `test/lib/auth.test.ts`, `test/lib/entities.test.ts` (total 75 tests → 100+)
- `--active` / `--inactive` filter flags on list commands that support them (customers, jobs, invoices, estimates, bookings, leads, memberships, pricebook)
- `st jobs book` — `priority` flag added
- Auth: detect and report stale or revoked tokens

### Changed
- README expanded with full command reference, flags documentation, output format examples, and troubleshooting section

### Fixed
- Dispatch capacity: correct field mapping for available/scheduled counts
- CI workflow: add Node matrix, run typecheck before tests

## [0.1.4] - 2026-03-26

### Added
- **Full Phase 1 → Phase 3 feature set in a single release:**
  - Phase 1: Authentication (OAuth 2.0 client credentials), `st customers`, `st jobs`, `st invoices`, `st techs`
  - Phase 2: `st memberships`, `st estimates`, `st leads`, `st pricebook`, `st dispatch`, `st reporting`, `st revenue`, `st snapshot`, `st api` (escape hatch)
  - Phase 3 (write operations): `st customers create/update`, `st jobs book/update/cancel/complete`, `st dispatch assign`, `st leads convert/dismiss`, `st bookings accept/dismiss`
  - Shell completion installer (`st completion install`)
- GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- GitHub Actions release workflow (`.github/workflows/release.yml`)
- Homebrew formula (`Formula/servicetitan-cli.rb`)
- `.npmignore` — excludes `__mocks__`, test files, and dev config from published package
- `test/helpers.ts` — `createTestContext()` and mock factories for Vitest
- `src/lib/intelligence.ts` — `getRevenueSummary()` and `getSnapshotSummary()` (intelligence layer)
- `src/lib/date-ranges.ts` — date range resolution for revenue/snapshot periods
- `src/lib/write-ops.ts` — shared helpers for write operation body building and confirmation
- `src/lib/prompts.ts` — `promptText()`, `promptSecret()`, `confirmAction()`
- `ST_AGENT_MODE=1` environment variable for compact JSON output in AI/automation contexts
- `--dry-run` mode for all mutating commands — prints the request body without executing
- `--yes` flag for all mutating commands — skips confirmation prompts
- `--fields` flag on all list/get commands for selective field output
- `--compact` flag and `compact` config option for trimmed output
- `--output table|json|csv` flag (and `ST_OUTPUT` env var) on all commands
- `--profile` flag and `ST_PROFILE` env var for multi-tenant support
- Agent mode output (`ST_AGENT_MODE=1`) strips null/empty fields from JSON
- 75 tests across all command groups and lib modules

### Changed
- `BaseCommand` significantly expanded: `initializeRuntime()`, `renderRecords()`, `renderRecord()`, `renderPayload()`, `parseFields()`, formatting helpers
- `ServiceTitanClient` expanded: full ROUTE_TABLE (80+ paths), retry logic for 401/429, per-report throttling for Reporting API, `get/post/put/patch/delete` + Raw variants
- Config schema validated with Zod; config files created with `0o600` permissions

## [0.1.0] - 2026-03-26

### Added
- Initial release — 46 commands, 14 command groups, OAuth2, full ServiceTitan API coverage
- Core library (`src/lib/client.ts`, `src/lib/auth.ts`, `src/lib/config.ts`, `src/lib/entities.ts`, `src/lib/output.ts`, `src/lib/pagination.ts`, `src/lib/prompts.ts`)
- Commands: `st auth login/logout/status/token`, `st customers list/get`, `st invoices list/get`, `st jobs list/get`, `st techs list/get`
- Pagination (`hasMore`-based, `--all` flag, `--page-size` flag)
- Table, JSON, and CSV output formats
- Profile-based multi-tenant configuration (`~/.config/st/config.json`)
- Keytar-based credential storage in OS keychain
- Integration and production environment support

[Unreleased]: https://github.com/montrellcruse/servicetitan-cli/compare/v0.2.3...HEAD
[0.2.3]: https://github.com/montrellcruse/servicetitan-cli/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/montrellcruse/servicetitan-cli/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/montrellcruse/servicetitan-cli/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/montrellcruse/servicetitan-cli/compare/v0.1.6...v0.2.0
[0.1.6]: https://github.com/montrellcruse/servicetitan-cli/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/montrellcruse/servicetitan-cli/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/montrellcruse/servicetitan-cli/compare/v0.1.0...v0.1.4
[0.1.0]: https://github.com/montrellcruse/servicetitan-cli/releases/tag/v0.1.0
