import {Args, Flags} from '@oclif/core'

import {parseRequestBody} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'

export default class ApiPost extends BaseCommand {
  public static override description = 'Call any ServiceTitan POST endpoint directly'

  public static override flags = {
    ...baseFlags,
    body: Flags.string({
      description: 'JSON request body',
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
    path: Args.string({
      description: 'Raw API path',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ApiPost)
    const {client} = await this.initializeRuntime(flags)
    const path = typeof args.path === 'string' ? args.path : undefined

    if (!path) {
      throw new Error('Path is required.')
    }

    const resolvedPath = client!.resolveRawPath(path)
    const body = parseRequestBody(flags.body)

    if (flags['dry-run']) {
      printDryRun('POST', resolvedPath, body)
      return
    }

    const confirmed = await confirmAction(`Send POST to ${resolvedPath}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    const response = await client!.postRaw<unknown>(path, body)
    await this.renderPayload(response)
  }
}
