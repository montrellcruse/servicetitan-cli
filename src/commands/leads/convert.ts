import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'

export default class LeadsConvert extends BaseCommand {
  public static override description = 'Convert a lead into a booking'

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
      description: 'Lead ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(LeadsConvert)
    const {client} = await this.initializeRuntime(flags)
    const leadId = typeof args.id === 'string' ? args.id : undefined

    if (!leadId) {
      throw new Error('Lead ID is required.')
    }

    const path = `/leads/${leadId}/convert`
    const body = {}

    if (flags['dry-run']) {
      printDryRun('POST', client!.resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Convert lead ${leadId} to a booking?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    await client!.post<unknown>(path, body)
    printSuccess(`Lead ${leadId} converted.`)
  }
}
