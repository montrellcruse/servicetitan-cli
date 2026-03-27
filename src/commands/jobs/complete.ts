import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'

export default class JobsComplete extends BaseCommand {
  public static override description = 'Mark a job as complete'

  public static override flags = {
    ...baseFlags,
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
    const {args, flags} = await this.parse(JobsComplete)
    const {client} = await this.initializeRuntime(flags)
    const jobId = typeof args.id === 'string' ? args.id : undefined

    if (!jobId) {
      throw new Error('Job ID is required.')
    }

    const path = `/jobs/${jobId}/complete`
    const body = {}

    if (flags['dry-run']) {
      printDryRun('POST', client!.resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Mark job ${jobId} as complete?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    await client!.post<unknown>(path, body)
    printSuccess(`Job ${jobId} marked complete.`)
  }
}
