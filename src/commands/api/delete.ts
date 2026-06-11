import {Args, Flags} from '@oclif/core'

import {parseParamsFlag, parseRequestBody} from '../../lib/api.js'
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
    body: Flags.string({
      description: 'JSON request body',
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
    await this.initializeRuntime(flags)
    const path = typeof args.path === 'string' ? args.path : undefined

    if (!path) {
      throw new Error('Path is required.')
    }

    const resolvedPath = this.requireClient().resolveRawPath(path)

    const body = flags.body ? parseRequestBody(flags.body) : undefined

    if (flags['dry-run']) {
      printDryRun('DELETE', resolvedPath, body)
      return
    }

    const confirmed = await confirmAction(`Send DELETE to ${resolvedPath}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    const params = parseParamsFlag(flags.params)
    const response =
      body === undefined
        ? await this.requireClient().deleteRaw<unknown>(path, params)
        : await this.requireClient().deleteRawWithBody<unknown>(path, body, params)

    if (!hasResponseBody(response)) {
      printSuccess('DELETE request succeeded.')
      return
    }

    await this.renderPayload(response)
  }
}
