import {afterEach, describe, expect, it, vi} from 'vitest'

import CustomersCreate from '../../src/commands/customers/create.js'
import JobsBook from '../../src/commands/jobs/book.js'
import JobsCancel from '../../src/commands/jobs/cancel.js'
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
      ['--customer', '42', '--type', '7', '--date', '2026-03-26', '--priority', 'high', '--dry-run'],
      client,
    )

    expect(stripAnsi(output())).toContain('[DRY RUN] POST /jpm/v2/tenant/12345/jobs')
    expect(stripAnsi(output())).toContain('"customerId": 42')
    expect(stripAnsi(output())).toContain('"jobTypeId": 7')
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
  command: typeof CustomersCreate | typeof JobsBook | typeof JobsCancel,
  argv: string[],
  client: ServiceTitanClient,
): Promise<void> {
  void client
  await command.run(argv, process.cwd())
}
