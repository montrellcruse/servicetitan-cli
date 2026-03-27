import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'

export default class JobsCancel extends BaseCommand {
  public static override description = 'Cancel a job'

  public static override flags = {
    ...baseFlags,
    reason: Flags.string({
      description: 'Cancellation reason',
    }),
    yes: Flags.boolean({
      description: 'Skip the confirmation prompt',
    }),
    'dry-run': Flags.boolean({
      description: 'Print the request without sending it',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Job ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(JobsCancel)
    const {client} = await this.initializeRuntime(flags)
    const jobId = typeof args.id === 'string' ? args.id : undefined

    if (!jobId) {
      throw new Error('Job ID is required.')
    }

    const path = `/jobs/${jobId}/cancel`
    const body = flags.reason ? {reason: flags.reason} : {}

    if (flags['dry-run']) {
      printDryRun('POST', client!.resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(
      `Cancel job ${jobId}? This cannot be undone.`,
      flags.yes ?? false,
    )

    if (!confirmed) {
      return
    }

    await client!.post<unknown>(path, body)
    printSuccess(`Job ${jobId} cancelled.`)
  }
}
