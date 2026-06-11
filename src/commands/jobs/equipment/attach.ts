import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../../lib/output.js'
import {confirmAction} from '../../../lib/prompts.js'
import {parseIntegerList} from '../../../lib/write-ops.js'

export default class JobsEquipmentAttach extends BaseCommand {
  public static override description = 'Attach installed equipment to a job'

  public static override flags = {
    ...baseFlags,
    'equipment-ids': Flags.string({
      description: 'Comma-separated installed equipment IDs to attach',
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
    const {args, flags} = await this.parse(JobsEquipmentAttach)
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
      printDryRun('POST', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(
      `Attach ${body.equipmentIds.length} equipment item${body.equipmentIds.length === 1 ? '' : 's'} to job ${jobId}?`,
      flags.yes ?? false,
    )

    if (!confirmed) {
      return
    }

    const response = await this.requireClient().post<unknown>(path, body)
    printSuccess('Equipment attached to job.')
    await this.renderPayload(response)
  }
}
