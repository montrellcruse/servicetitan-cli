import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../../lib/output.js'
import {confirmAction} from '../../../lib/prompts.js'
import {hasResponseBody} from '../../../lib/write-ops.js'

export default class JobsEquipmentDetach extends BaseCommand {
  public static override description = 'Detach one installed equipment item from a job'

  public static override flags = {
    ...baseFlags,
    'equipment-id': Flags.integer({
      description: 'Installed equipment ID to detach',
      required: true,
    }),
    yes: Flags.boolean({
      description: 'Skip the confirmation prompt',
    }),
    'dry-run': Flags.boolean({
      description: 'Print the request without sending it',
    }),
  }

  public static override args = {
    jobId: Args.string({
      description: 'Job ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(JobsEquipmentDetach)
    await this.initializeRuntime(flags)
    const jobId = typeof args.jobId === 'string' ? args.jobId : undefined

    if (!jobId) {
      throw new Error('Job ID is required.')
    }

    const path = `/jobs/${jobId}/equipment/${flags['equipment-id']}`

    if (flags['dry-run']) {
      printDryRun('DELETE', this.requireClient().resolvePath(path))
      return
    }

    const confirmed = await confirmAction(
      `Detach equipment ${flags['equipment-id']} from job ${jobId}?`,
      flags.yes ?? false,
    )

    if (!confirmed) {
      return
    }

    const response = await this.requireClient().delete<unknown>(path)
    printSuccess('Equipment detached from job.')
    if (hasResponseBody(response)) {
      await this.renderPayload(response)
    }
  }
}
