import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../../lib/output.js'
import {confirmAction} from '../../../lib/prompts.js'
import {hasResponseBody, parseIntegerList} from '../../../lib/write-ops.js'

export default class JobsEquipmentDetachBulk extends BaseCommand {
  public static override description = 'Detach one or more installed equipment IDs from a job'

  public static override flags = {
    ...baseFlags,
    'equipment-ids': Flags.string({
      description: 'Comma-separated installed equipment IDs to detach',
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
    const {args, flags} = await this.parse(JobsEquipmentDetachBulk)
    await this.initializeRuntime(flags)
    const jobId = typeof args.jobId === 'string' ? args.jobId : undefined

    if (!jobId) {
      throw new Error('Job ID is required.')
    }

    const path = `/jobs/${jobId}/equipment`
    const body = {
      equipmentIds: parseIntegerList(flags['equipment-ids'], 'Equipment IDs') ?? [],
    }

    if (flags['dry-run']) {
      printDryRun('DELETE', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(
      `Detach ${body.equipmentIds.length} equipment item${body.equipmentIds.length === 1 ? '' : 's'} from job ${jobId}?`,
      flags.yes ?? false,
    )

    if (!confirmed) {
      return
    }

    const response = await this.requireClient().deleteWithBody<unknown>(path, body)
    printSuccess('Equipment detached from job.')
    if (hasResponseBody(response)) {
      await this.renderPayload(response)
    }
  }
}
