import {Args, Flags} from '@oclif/core'

import {parseParamsFlag} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'
import {hasResponseBody} from '../../lib/write-ops.js'

export default class ApiDelete extends BaseCommand {
  public static override description = 'Call any ServiceTitan DELETE endpoint directly'

  public static override flags = {
    ...baseFlags,
    params: Flags.string({
      description: 'Comma-separated key=value query parameters',
    }),
    yes: Flags.boolean({
      description: 'Skip the confirmation prompt',
    }),
    'dry-run': Flags.boolean({
      description: 'Print the request without sending it',
    }),
  }

  public static override args = {
    path: Args.string({
      description: 'Raw API path',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ApiDelete)
    const {client} = await this.initializeRuntime(flags)
    const path = typeof args.path === 'string' ? args.path : undefined

    if (!path) {
      throw new Error('Path is required.')
    }

    const resolvedPath = client!.resolveRawPath(path)

    if (flags['dry-run']) {
      printDryRun('DELETE', resolvedPath)
      return
    }

    const confirmed = await confirmAction(`Send DELETE to ${resolvedPath}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    const response = await client!.deleteRaw<unknown>(path, parseParamsFlag(flags.params))

    if (!hasResponseBody(response)) {
      printSuccess('DELETE request succeeded.')
      return
    }

    await this.renderPayload(response)
  }
}
