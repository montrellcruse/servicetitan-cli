import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'

export default class EstimatesSell extends BaseCommand {
  public static override description = 'Sell an estimate'

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
      description: 'Estimate ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(EstimatesSell)
    await this.initializeRuntime(flags)
    const estimateId = typeof args.id === 'string' ? args.id : undefined

    if (!estimateId) {
      throw new Error('Estimate ID is required.')
    }

    const path = `/estimates/${estimateId}/sell`
    const body = {}

    if (flags['dry-run']) {
      printDryRun('POST', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Sell estimate ${estimateId}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    await this.requireClient().post<unknown>(path, body)
    printSuccess(`Estimate ${estimateId} sold.`)
  }
}
