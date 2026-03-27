import {afterEach, describe, expect, it, vi} from 'vitest'

import BookingsAccept from '../../src/commands/bookings/accept.js'
import BookingsDismiss from '../../src/commands/bookings/dismiss.js'
import CustomersCreate from '../../src/commands/customers/create.js'
import CustomersUpdate from '../../src/commands/customers/update.js'
import DispatchAssign from '../../src/commands/dispatch/assign.js'
import EstimatesSell from '../../src/commands/estimates/sell.js'
import EstimatesUnsell from '../../src/commands/estimates/unsell.js'
import JobsBook from '../../src/commands/jobs/book.js'
import JobsCancel from '../../src/commands/jobs/cancel.js'
import JobsComplete from '../../src/commands/jobs/complete.js'
import JobsUpdate from '../../src/commands/jobs/update.js'
import LeadsConvert from '../../src/commands/leads/convert.js'
import LeadsDismiss from '../../src/commands/leads/dismiss.js'
import LocationsCreate from '../../src/commands/locations/create.js'
import LocationsUpdate from '../../src/commands/locations/update.js'
import type {ServiceTitanClient} from '../../src/lib/client.js'
import {createTestContext, stripAnsi} from '../helpers.js'

describe('write ops dry run', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints the expected dry-run output for customers create', async () => {
    const {client, output, patchSpy, postSpy} = createDryRunContext()

    await runCommand(CustomersCreate, ['--name', 'Alice Smith', '--email', 'alice@example.com', '--dry-run'], client)

    expect(stripAnsi(output())).toContain('[DRY RUN] POST /crm/v2/tenant/12345/customers')
    expect(stripAnsi(output())).toContain('Body:')
    expect(stripAnsi(output())).toContain('"name": "Alice Smith"')
    expect(stripAnsi(output())).toContain('"email": "alice@example.com"')
    expect(postSpy).not.toHaveBeenCalled()
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('prints the expected dry-run output for jobs book', async () => {
    const {client, output, patchSpy, postSpy} = createDryRunContext()

    await runCommand(
      JobsBook,
      [
        '--customer',
        '42',
        '--type',
        '7',
        '--date',
        '2026-03-26',
        '--priority',
        'high',
        '--location',
        '99',
        '--dry-run',
      ],
      client,
    )

    expect(stripAnsi(output())).toContain('[DRY RUN] POST /jpm/v2/tenant/12345/jobs')
    expect(stripAnsi(output())).toContain('"customerId": 42')
    expect(stripAnsi(output())).toContain('"jobTypeId": 7')
    expect(stripAnsi(output())).toContain('"locationId": 99')
    expect(stripAnsi(output())).toContain('"scheduledDate": "2026-03-26"')
    expect(stripAnsi(output())).toContain('"priority": "High"')
    expect(postSpy).not.toHaveBeenCalled()
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('prints the expected dry-run output for jobs cancel', async () => {
    const {client, output, patchSpy, postSpy} = createDryRunContext()

    await runCommand(JobsCancel, ['123', '--dry-run'], client)

    expect(stripAnsi(output())).toContain('[DRY RUN] POST /jpm/v2/tenant/12345/jobs/123/cancel')
    expect(stripAnsi(output())).toContain('Body:')
    expect(stripAnsi(output())).toContain('{}')
    expect(postSpy).not.toHaveBeenCalled()
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it('prints the expected dry-run output for locations create', async () => {
    const {client, output, patchSpy, postSpy} = createDryRunContext()

    await runCommand(
      LocationsCreate,
      ['--name', 'Main Residence', '--address', '123 Oak St', '--customer', '42', '--dry-run'],
      client,
    )

    expect(stripAnsi(output())).toContain('[DRY RUN] POST /crm/v2/tenant/12345/locations')
    expect(stripAnsi(output())).toContain('"name": "Main Residence"')
    expect(stripAnsi(output())).toContain('"customerId": 42')
    expect(stripAnsi(output())).toContain('"street": "123 Oak St"')
    expect(postSpy).not.toHaveBeenCalled()
    expect(patchSpy).not.toHaveBeenCalled()
  })

  it.each([
    {
      argv: ['42', '--phone', '602-555-0101', '--dry-run'],
      command: CustomersUpdate,
      expected: ['[DRY RUN] PATCH /crm/v2/tenant/12345/customers/42', '"phone": "602-555-0101"'],
      label: 'customers update',
    },
    {
      argv: ['42', '--summary', 'Return visit', '--dry-run'],
      command: JobsUpdate,
      expected: ['[DRY RUN] PATCH /jpm/v2/tenant/12345/jobs/42', '"summary": "Return visit"'],
      label: 'jobs update',
    },
    {
      argv: ['42', '--address', '456 Elm St', '--dry-run'],
      command: LocationsUpdate,
      expected: ['[DRY RUN] PATCH /crm/v2/tenant/12345/locations/42', '"street": "456 Elm St"'],
      label: 'locations update',
    },
    {
      argv: ['42', '--dry-run'],
      command: JobsComplete,
      expected: ['[DRY RUN] POST /jpm/v2/tenant/12345/jobs/42/complete', '{}'],
      label: 'jobs complete',
    },
    {
      argv: ['--appointment', '401992', '--tech', '52', '--dry-run'],
      command: DispatchAssign,
      expected: [
        '[DRY RUN] POST /dispatch/v2/tenant/12345/appointment-assignments',
        '"appointmentId": 401992',
        '"technicianId": 52',
      ],
      label: 'dispatch assign',
    },
    {
      argv: ['210411', '--dry-run'],
      command: LeadsConvert,
      expected: ['[DRY RUN] POST /crm/v2/tenant/12345/leads/210411/convert', '{}'],
      label: 'leads convert',
    },
    {
      argv: ['210411', '--reason', 'Not qualified', '--dry-run'],
      command: LeadsDismiss,
      expected: ['[DRY RUN] POST /crm/v2/tenant/12345/leads/210411/dismiss', '"reason": "Not qualified"'],
      label: 'leads dismiss',
    },
    {
      argv: ['310511', '--dry-run'],
      command: BookingsAccept,
      expected: [
        '[DRY RUN] PATCH /crm/v2/tenant/12345/bookings/310511',
        '"status": "Converted"',
      ],
      label: 'bookings accept',
    },
    {
      argv: ['310511', '--reason', 'Duplicate inquiry', '--dry-run'],
      command: BookingsDismiss,
      expected: [
        '[DRY RUN] PATCH /crm/v2/tenant/12345/bookings/310511',
        '"status": "Dismissed"',
        '"reason": "Duplicate inquiry"',
      ],
      label: 'bookings dismiss',
    },
    {
      argv: ['730118', '--dry-run'],
      command: EstimatesSell,
      expected: ['[DRY RUN] POST /sales/v2/tenant/12345/estimates/730118/sell', '{}'],
      label: 'estimates sell',
    },
    {
      argv: ['730118', '--dry-run'],
      command: EstimatesUnsell,
      expected: ['[DRY RUN] POST /sales/v2/tenant/12345/estimates/730118/unsell', '{}'],
      label: 'estimates unsell',
    },
  ])('prints the expected dry-run output for $label', async ({command, argv, expected}) => {
    const {client, output, patchSpy, postSpy} = createDryRunContext()

    await runCommand(command, argv, client)

    for (const fragment of expected) {
      expect(stripAnsi(output())).toContain(fragment)
    }

    expect(postSpy).not.toHaveBeenCalled()
    expect(patchSpy).not.toHaveBeenCalled()
  })
})

function createDryRunContext(): {
  client: ServiceTitanClient
  output: () => string
  patchSpy: ReturnType<typeof vi.spyOn>
  postSpy: ReturnType<typeof vi.spyOn>
} {
  const {client, output} = createTestContext()
  const postSpy = vi.spyOn(client, 'post')
  const patchSpy = vi.spyOn(client, 'patch')

  return {
    client,
    output,
    patchSpy,
    postSpy,
  }
}

async function runCommand(
  command:
    | typeof BookingsAccept
    | typeof BookingsDismiss
    | typeof CustomersCreate
    | typeof CustomersUpdate
    | typeof DispatchAssign
    | typeof EstimatesSell
    | typeof EstimatesUnsell
    | typeof JobsBook
    | typeof JobsCancel
    | typeof JobsComplete
    | typeof JobsUpdate
    | typeof LeadsConvert
    | typeof LeadsDismiss
    | typeof LocationsCreate
    | typeof LocationsUpdate,
  argv: string[],
  client: ServiceTitanClient,
): Promise<void> {
  void client
  await command.run(argv, process.cwd())
}
