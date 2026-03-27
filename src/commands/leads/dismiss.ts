import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'

export default class LeadsDismiss extends BaseCommand {
  public static override description = 'Dismiss a lead'

  public static override flags = {
    ...baseFlags,
    reason: Flags.string({
      description: 'Dismissal reason',
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
      description: 'Lead ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(LeadsDismiss)
    await this.initializeRuntime(flags)
    const leadId = typeof args.id === 'string' ? args.id : undefined

    if (!leadId) {
      throw new Error('Lead ID is required.')
    }

    const path = `/leads/${leadId}/dismiss`
    const body = flags.reason ? {reason: flags.reason} : {}

    if (flags['dry-run']) {
      printDryRun('POST', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Dismiss lead ${leadId}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    await this.requireClient().post<unknown>(path, body)
    printSuccess(`Lead ${leadId} dismissed.`)
  }
}
