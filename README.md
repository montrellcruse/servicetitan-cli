# ServiceTitan CLI

> A first-party quality CLI for the ServiceTitan API.

ServiceTitan CLI brings customer, job, invoice, dispatch, reporting, and operational intelligence workflows into a single `st` binary. It is built for developers, operators, and AI agents that need clean output, secure auth, fast scripting, and a reliable escape hatch when the named commands do not cover a niche endpoint yet.

Highlights:

- Secure profile-based auth with credentials stored outside the config file.
- Human-friendly tables by default, with JSON and CSV when you need to pipe or export.
- Safe write operations, including raw API mutations, with confirmation prompts and `--dry-run`.
- An intelligence layer for revenue rollups and daily ops snapshots.
- Agent-friendly compact output with `ST_AGENT_MODE=1`.

## Installation

The package installs a single binary: `st`.

### npm

```bash
npm install -g @rowvyn/servicetitan-cli
st --version
```

### Homebrew

```bash
brew tap montrellcruse/servicetitan-cli
brew install servicetitan-cli
st --version
```

### Direct download

Standalone binaries are not published for `v0.1.0`. Use the npm package or Homebrew formula instead.

## Quick Start

### Authentication

The first run is usually under a minute: authenticate once, then use named profiles for production and integration tenants.

```bash
$ st auth login
Profile name: acme
Environment: production
Client ID: cid_live_01JQ7Q2W9GQK1Q8D
Client Secret: ********************************
App Key: ak_live_01JQ7Q8X74A8K4X1
Tenant ID: 985798691
✓ Authenticated profile "acme" and set it as the default profile.
```

```bash
$ st auth status
Name        Environment  TenantId   Credentials  Default
acme      production   985798691  yes          true
acme-int  integration  985798691  yes          false
```

You can also print the current bearer token for one-off debugging:

```bash
st auth token
```

Optional but useful on day one:

```bash
st completion install
```

## Commands

Every command supports `--profile`, `--output table|json|csv`, `--compact`, and `--no-color`. Most list commands also support `--fields`, and most list-style endpoints support `--all` for autopagination.

### auth

Manage ServiceTitan profiles and credentials.

```bash
$ st auth login --profile branch-ops --env integration
Client ID: cid_test_01JQ7R4Q6A8G1H2N
Client Secret: ********************************
App Key: ak_test_01JQ7R6VDQW3M4TY
Tenant ID: 985798691
✓ Authenticated profile "branch-ops".
```

```bash
$ st auth status
Name        Environment  TenantId   Credentials  Default
acme      production   985798691  yes          true
branch-ops  integration  985798691  yes          false
```

```bash
$ st auth logout --profile branch-ops
✓ Removed profile "branch-ops".
```

### customers

Browse CRM customers, inspect a single record, and create or update customers safely.

```text
$ st customers list --help
USAGE
  $ st customers list [--output table|json|csv] [--profile <value>] [--color] [--compact] [--search <value>] [--active] [--limit <value>] [--all] [--fields <value>]

FLAGS
  --search=<value>   Customer search string
  --active           Only include active customers
  --limit=<value>    Maximum number of customers to return
  --all              Fetch all customer pages
  --fields=<value>   Comma-separated fields to include
```

```bash
$ st customers list --search "martinez" --limit 3
Id      Name                  Phone           Email                      Active  Created
403219  Martinez, Elena       602-555-0182    elena@desertmesa.co       true    2023-09-14T16:22:09Z
417004  Martinez, Carlos      602-555-0199    carlos.m@sunsetflow.com   true    2024-02-08T11:05:44Z
422771  Martinez Family HOA   480-555-0117    hoa@martinezgroves.org    true    2024-11-21T08:39:02Z
```

```bash
$ st customers get 403219
Field    Value
Id       403219
Name     Martinez, Elena
Phone    602-555-0182
Email    elena@desertmesa.co
Active   true
Created  2023-09-14T16:22:09Z
Address  1842 S Desert Willow Dr
City     Mesa
State    AZ
Zip      85209
```

```bash
$ st customers create --name "Harper Family" --phone "480-555-0104" --email "harper@example.com" --city "Gilbert" --state "AZ" --zip "85295" --dry-run
[DRY RUN] POST https://api.servicetitan.io/crm/v2/tenant/985798691/customers
Body:
{
  "name": "Harper Family",
  "phone": "480-555-0104",
  "email": "harper@example.com",
  "address": {
    "city": "Gilbert",
    "state": "AZ",
    "zip": "85295"
  }
}
```

### jobs

Inspect the operational core of the tenant: job queues, schedules, totals, and safe write operations.

```text
$ st jobs list --help
USAGE
  $ st jobs list [--output table|json|csv] [--profile <value>] [--color] [--compact] [--status <value>] [--date <value>] [--date-range <value>] [--limit <value>] [--all] [--fields <value>]

FLAGS
  --status=<value>      Comma-separated job statuses
  --date=<value>        Exact date to filter by (YYYY-MM-DD)
  --date-range=<value>  Date range to filter by (YYYY-MM-DD..YYYY-MM-DD)
  --limit=<value>       Maximum number of jobs to return
  --fields=<value>      Comma-separated fields to include
```

```bash
$ st jobs list --status Scheduled,InProgress --date 2026-03-26 --limit 4
Id      Status       Customer             Type                  Scheduled             Total
845102  Scheduled    Johnson Family       Precision Tune-Up     2026-03-26T09:00:00Z 189
845118  InProgress   Parkview Dental      RTU Cooling Repair    2026-03-26T10:30:00Z 1240
845131  Scheduled    Bell Residence       Water Heater Replace  2026-03-26T13:00:00Z 0
845144  Scheduled    Copper State Suites  Plumbing Inspection   2026-03-26T15:30:00Z 0
```

```bash
$ st jobs get 845118
Field         Value
Id            845118
Status        InProgress
Customer      Parkview Dental
Type          RTU Cooling Repair
Scheduled     2026-03-26T10:30:00Z
Total         1240
Summary       Rear rooftop package unit not cooling
Business Unit Commercial HVAC
Technician    Ava Thompson
Created       2026-03-25T18:02:14Z
```

```bash
$ st jobs book --customer 403219 --type 117 --date 2026-03-29 --tech 52 --priority urgent --summary "No cooling - upstairs system down" --location 550912 --business-unit 14 --dry-run
[DRY RUN] POST https://api.servicetitan.io/jpm/v2/tenant/985798691/jobs
Body:
{
  "customerId": 403219,
  "jobTypeId": 117,
  "scheduledDate": "2026-03-29",
  "technicianId": 52,
  "priority": "Urgent",
  "summary": "No cooling - upstairs system down",
  "locationId": 550912,
  "businessUnitId": 14
}
```

### invoices

Review receivables, balances, and invoice detail from accounting.

```text
$ st invoices list --help
USAGE
  $ st invoices list [--output table|json|csv] [--profile <value>] [--color] [--compact] [--status paid|unpaid|void] [--limit <value>] [--all] [--fields <value>]

FLAGS
  --status=<option>  Invoice status filter (paid, unpaid, void)
  --limit=<value>    Maximum number of invoices to return
  --all              Fetch all invoice pages
  --fields=<value>   Comma-separated fields to include
```

```bash
$ st invoices list --status unpaid --limit 3
Id       Status  Customer             Total    Balance  Created
992410   unpaid  Bell Residence       412.50   412.50   2026-03-23T19:12:05Z
992417   unpaid  Parkview Dental      1240     620      2026-03-24T17:44:18Z
992422   unpaid  Copper State Suites  1880     1880     2026-03-25T20:11:40Z
```

```bash
$ st invoices get 992417
Field          Value
Id             992417
Status         unpaid
Customer       Parkview Dental
Total          1240
Balance        620
Created        2026-03-24T17:44:18Z
Job Id         845118
Invoice Number INV-104982
Due Date       2026-04-08
```

```bash
$ st invoices list --fields id,customer,total,balance --output csv
id,customer,total,balance
992410,Bell Residence,412.5,412.5
992417,Parkview Dental,1240,620
992422,Copper State Suites,1880,1880
```

### techs

List technicians and inspect the people behind the dispatch board.

```text
$ st techs list --help
USAGE
  $ st techs list [--output table|json|csv] [--profile <value>] [--color] [--compact] [--active] [--limit <value>] [--all] [--fields <value>]

FLAGS
  --active           Only include active technicians
  --limit=<value>    Maximum number of technicians to return
  --all              Fetch all technician pages
  --fields=<value>   Comma-separated fields to include
```

```bash
$ st techs list --active --limit 4
Id   Name             Phone         Email                        Active
52   Ava Thompson     602-555-0125  ava.thompson@example.com true
61   Luis Ortega      602-555-0141  lortega@example.com      true
77   Mia Campbell     480-555-0132  mcampbell@example.com    true
84   Jordan Reeves    480-555-0154  jreeves@example.com      true
```

```bash
$ st techs get 52
Field          Value
Id             52
Name           Ava Thompson
Phone          602-555-0125
Email          ava.thompson@example.com
Active         true
Business Unit  Residential HVAC
Employee Id    EMP-1042
```

```bash
$ st techs list --fields id,name,email --output json
[
  {
    "id": 52,
    "name": "Ava Thompson",
    "email": "ava.thompson@example.com"
  }
]
```

### memberships

Track active agreement revenue, filter by customer, and inspect membership types.

```bash
$ st memberships list --limit 3
Id      Type                 Customer           Status  Start        End          Recurring
51012   Comfort Club Gold    Harper Family      Active  2025-07-12   2026-07-11   true
51027   Plumbing Peace Plan  Bell Residence     Active  2025-10-02   2026-10-01   true
51043   Commercial Priority  Parkview Dental    Active  2026-01-15   2027-01-14   true
```

```bash
$ st memberships get 51012
Field              Value
Id                 51012
Type               Comfort Club Gold
Customer           Harper Family
Status             Active
Start              2025-07-12
End                2026-07-11
Recurring          true
Customer Id        403219
Location Id        550912
Price              29
Billing Frequency  Monthly
Created            2025-07-12T15:20:43Z
```

```bash
$ st memberships types --active
Id    Name                Duration  Price  Active
901   Comfort Club Gold   12        29     true
902   Plumbing Peace Plan 12        24     true
930   Commercial Priority 12        149    true
```

### estimates

Review open and sold estimates without leaving the terminal.

```bash
$ st estimates list --status open --limit 3
Id      Status  Customer            Job     Total    Created
730118  open    Harper Family       845102  6850     2026-03-24T18:10:11Z
730141  open    Copper State Suites 845144  12400    2026-03-25T21:02:49Z
730155  open    Bell Residence      845131  980      2026-03-26T16:27:38Z
```

```bash
$ st estimates get 730118
Field         Value
Id            730118
Status        open
Customer      Harper Family
Job           845102
Total         6850
Created       2026-03-24T18:10:11Z
Name          3-ton heat pump replacement
Sold On
Dismissed On
Created By    Ava Thompson
```

```bash
$ st estimates list --job 845102 --fields id,status,total --output json
[
  {
    "id": 730118,
    "status": "open",
    "total": 6850
  }
]
```

### leads

Monitor lead flow and safely convert or dismiss leads.

```bash
$ st leads list --status open --limit 3
Id      Status  Customer           Campaign               Created
210411  open    Rivera Residence   Google Local Services  2026-03-26T14:05:10Z
210419  open    Mesa Animal Clinic Spring Tune-Up Email   2026-03-26T14:28:31Z
210427  open    Parkview Dental    Referral Program       2026-03-26T15:02:44Z
```

```bash
$ st leads get 210411
Field        Value
Id           210411
Status       open
Customer     Rivera Residence
Campaign     Google Local Services
Created      2026-03-26T14:05:10Z
Phone        480-555-0178
Email        service@riveraresidence.com
Assigned To  Intake Team
Source       website
```

```bash
$ st leads convert 210411 --dry-run
[DRY RUN] POST https://api.servicetitan.io/crm/v2/tenant/985798691/leads/210411/convert
Body:
{}
```

### pricebook

Search the catalog your field teams actually sell from: services, materials, and equipment.

```bash
$ st pricebook services --search "tune" --limit 3
Id    Name                       Price  Duration  Active
117   Precision Tune-Up          189    90        true
118   Premium AC Tune-Up         249    120       true
212   Commercial RTU Tune-Up     425    180       true
```

```bash
$ st pricebook materials --search "capacitor" --limit 3
Id     Name                     Price  Unit Cost  Active
4412   Dual Run Capacitor 45/5  189    42         true
4418   Dual Run Capacitor 40/5  179    39         true
4426   Start Capacitor Kit      129    24         true
```

```bash
$ st pricebook equipment --active --fields id,name,price --output json
[
  {
    "id": 8801,
    "name": "3 Ton Heat Pump 15.2 SEER2",
    "price": 6850
  }
]
```

### dispatch

Use dispatch-focused views for appointments, capacity, and assignment changes.

```bash
$ st dispatch board --date 2026-03-26
Appointment  Job     Tech           Start                End                  Status
401992       845102  Ava Thompson   2026-03-26 09:00     2026-03-26 10:30     Scheduled
401997       845118  Luis Ortega    2026-03-26 10:30     2026-03-26 12:00     InProgress
402011       845144  Mia Campbell   2026-03-26 15:30     2026-03-26 17:00     Scheduled
```

```bash
$ st dispatch capacity --date 2026-03-26
Business Unit       Available  Scheduled
Residential HVAC    6          18
Commercial HVAC     3          7
Plumbing            4          9
```

```bash
$ st dispatch assign --appointment 402011 --tech 84 --dry-run
[DRY RUN] POST https://api.servicetitan.io/dispatch/v2/tenant/985798691/appointment-assignments
Body:
{
  "appointmentId": 402011,
  "technicianId": 84
}
```

### reporting

Run ServiceTitan reports directly from the reporting API without leaving your shell.

```bash
$ st reporting list
Category     Report                        Id
operations   Revenue by Technician         175
operations   Completed Jobs by Day         214
marketing    Leads by Campaign             308
```

```bash
$ st reporting run --category operations --report 175 --from 2026-03-01 --to 2026-03-31 --output json
{
  "data": [
    {
      "technician": "Ava Thompson",
      "completedRevenue": 84210.44,
      "completedJobs": 96
    },
    {
      "technician": "Luis Ortega",
      "completedRevenue": 73122.18,
      "completedJobs": 88
    }
  ]
}
```

```bash
$ st reporting run --category operations --report 214 --limit 10 --output csv
date,completedJobs,avgTicket
2026-03-20,18,612.44
2026-03-21,14,588.12
2026-03-22,11,540.09
```

### revenue

Use the intelligence layer when you want business answers, not raw endpoint spelunking.

```text
$ st revenue --help
USAGE
  $ st revenue [--output table|json|csv] [--profile <value>] [--color] [--compact] [--period day|week|month|year|ytd] [--from <value>] [--to <value>]

FLAGS
  --period=<option>  [default: month] Revenue period
  --from=<value>     Start date (YYYY-MM-DD)
  --to=<value>       End date (YYYY-MM-DD)
  --output=<option>  Output format
  --compact          Trim output for scripts and AI agents
```

```bash
$ st revenue --period month
Revenue Summary — March 2026
Metric         Value
Total Revenue  $248,421.72
Total Jobs     312
Avg Job Value  $796.22
Date Range     Mar 1 - Mar 26, 2026
```

```bash
$ st revenue --period ytd --output json
{
  "avg_job_value": 802.51,
  "from": "2026-01-01",
  "period": "ytd",
  "to": "2026-03-26",
  "total_jobs": 2316,
  "total_revenue": 1850603.16
}
```

```bash
$ st revenue --from 2026-03-01 --to 2026-03-15 --compact
{"avg_job_value":784.37,"from":"2026-03-01","period":"month","to":"2026-03-15","total_jobs":177,"total_revenue":138833.49}
```

### snapshot

Get the daily operations briefing your team cares about first thing in the morning.

```bash
$ st snapshot
Snapshot — March 26, 2026
Operations
Metric          Value
Jobs Today      22
Jobs This Week  87
Revenue MTD     $248,421.72
Pipeline
Metric              Value
Open Estimates      14
Active Memberships  1287
Open Leads          7
```

```bash
$ st snapshot --date 2026-03-25 --output json
{
  "date": "2026-03-25",
  "jobs_today": 19,
  "jobs_this_week": 81,
  "revenue_mtd": 240181.54,
  "open_estimates": 13,
  "active_memberships": 1285,
  "open_leads": 8
}
```

```bash
$ st snapshot --compact
{"date":"2026-03-26","jobs_today":22,"jobs_this_week":87,"revenue_mtd":248421.72,"open_estimates":14,"active_memberships":1287,"open_leads":7}
```

### api

For anything not covered yet by a named command, call the raw API directly while still reusing auth, profiles, and output rendering.

```bash
$ st api get /crm/v2/tenant/{tenant}/customers --params "page=1,pageSize=2" --output json
[
  {
    "id": 403219,
    "name": "Martinez, Elena"
  },
  {
    "id": 417004,
    "name": "Martinez, Carlos"
  }
]
```

```bash
$ st api post /crm/v2/tenant/{tenant}/customers --body '{"name":"Greenway Fitness","phone":"602-555-0190","email":"ops@greenwayfit.com"}' --yes
Field    Value
Id       430221
Name     Greenway Fitness
Phone    602-555-0190
Email    ops@greenwayfit.com
```

```bash
$ st api delete /crm/v2/tenant/{tenant}/tags/118 --yes
✓ DELETE request succeeded.
```

## Intelligence Layer

The named intelligence commands exist for the questions people actually ask every day:

- `st revenue --period ytd` answers, "How much revenue have we booked year to date?"
- `st snapshot` answers, "What does the business look like right now?"

That matters for human operators, but it matters even more for AI agents. A generic MCP integration often needs large tool schemas, endpoint descriptions, and follow-up discovery calls before the model can answer a simple ops question. The CLI avoids that overhead by pushing the business question into the command name itself.

Example:

```bash
$ st revenue --period ytd --compact
{"avg_job_value":802.51,"from":"2026-01-01","period":"ytd","to":"2026-03-26","total_jobs":2316,"total_revenue":1850603.16}
```

```bash
$ st snapshot --compact
{"date":"2026-03-26","jobs_today":22,"jobs_this_week":87,"revenue_mtd":248421.72,"open_estimates":14,"active_memberships":1287,"open_leads":7}
```

For agent workflows, those payloads are effectively zero-schema output:

- No endpoint discovery round-trip.
- No large tool definition injected into the prompt.
- No empty arrays, null-heavy objects, or audit metadata when `--compact` or `ST_AGENT_MODE=1` is enabled.
- A single command produces exactly the slice of business context an agent needs.

If you are comparing shell access to an MCP server, this is the tradeoff: fewer schema tokens, less orchestration overhead, and a much tighter prompt footprint.

## Agent Mode

Set `ST_AGENT_MODE=1` to trim output for scripts and agents. For list and detail commands, pair it with `--output json` for compact machine-readable payloads. For `st revenue` and `st snapshot`, compact mode already emits single-line JSON.

```bash
export ST_AGENT_MODE=1
```

```bash
$ st jobs list --status Scheduled --limit 2 --output json | jq '.[].id'
845102
845131
```

```bash
$ st snapshot --output json | jq '{date, jobs_today, revenue_mtd}'
{
  "date": "2026-03-26",
  "jobs_today": 22,
  "revenue_mtd": 248421.72
}
```

For one-off calls, use `--compact` without changing your shell environment:

```bash
st customers list --search "martinez" --output json --compact
```

## Output Formats

Choose the renderer that matches the job:

- `--output table` for interactive terminal work.
- `--output json` for `jq`, scripts, agents, and downstream tooling.
- `--output csv` for exports into spreadsheets or BI pipelines.

Field projection keeps large responses focused:

```bash
st jobs list --date-range 2026-03-01..2026-03-31 --fields id,status,customer,total --output csv
```

Compact mode removes dead weight from responses:

```bash
st techs list --fields id,name,email --output json --compact
```

Common combinations:

```bash
st customers list --output json
st invoices list --fields id,customer,total,balance --output csv
st revenue --period ytd --compact
```

## Escape Hatch

Named commands cover the common workflows. When you need something obscure or newly released, use the raw API verbs:

```bash
st api get /crm/v2/tenant/{tenant}/customers --params "page=1,pageSize=50"
st api post /crm/v2/tenant/{tenant}/customers --body '{"name":"Acme Mechanical"}' --yes
st api put /crm/v2/tenant/{tenant}/customers/403219 --body '{"phone":"602-555-0199"}' --yes
st api delete /crm/v2/tenant/{tenant}/tags/118 --yes
```

Mutation verbs prompt before sending unless `--yes` is passed. Use `--dry-run` to print the resolved method, path, and JSON body without making the request.

The escape hatch still gives you:

- Stored auth and profile selection.
- `{tenant}` substitution against the active profile.
- Table, JSON, or CSV output formatting when the response is record-like.

## Configuration

Profiles live in `~/.config/st/config.json` by default. Secrets do not: client credentials are stored separately in the OS keychain. The config file tracks the default profile, output settings, color preference, compact mode, and non-secret profile metadata such as `tenantId`, `appKey`, and `environment`.

Typical setup:

```bash
st auth login --profile acme-prod --env production
st auth login --profile acme-int --env integration
st --profile acme-int snapshot
```

Supported environments:

- `production` for live tenant access.
- `integration` for sandbox and pre-production workflows.

Environment and runtime overrides:

| Variable | Purpose |
| --- | --- |
| `ST_PROFILE` | Override the active profile |
| `ST_OUTPUT` | Default output format: `table`, `json`, or `csv` |
| `ST_AGENT_MODE` | Enable compact agent-oriented shaping |
| `ST_NO_COLOR` | Disable colorized terminal output |
| `ST_ENVIRONMENT` | Override stored environment at runtime |
| `ST_TENANT_ID` | Override tenant ID at runtime |
| `ST_APP_KEY` | Override app key at runtime |
| `ST_CONFIG_DIR` | Use a non-default config directory |

Examples:

```bash
ST_PROFILE=acme-int st jobs list --status Scheduled
ST_OUTPUT=json st customers list --limit 5
ST_ENVIRONMENT=integration st revenue --period month
```

## Contributing

Issues and pull requests are welcome at [github.com/montrellcruse/servicetitan-cli](https://github.com/montrellcruse/servicetitan-cli). If you are working on the CLI locally, the standard validation loop is:

```bash
npm run typecheck
npm run lint
npm test
```

## License

MIT
