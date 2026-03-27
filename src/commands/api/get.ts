import {Args, Flags} from '@oclif/core'

import {parseParamsFlag} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class ApiGet extends BaseCommand {
  public static override description = 'Call any ServiceTitan GET endpoint directly'

  public static override examples = [
    '<%= config.bin %> api get /crm/v2/tenant/{tenant}/customers',
    '<%= config.bin %> api get /crm/v2/tenant/{tenant}/customers --params "page=1,pageSize=2"',
  ]

  public static override flags = {
    ...baseFlags,
    params: Flags.string({
      description: 'Comma-separated key=value query parameters',
    }),
  }

  public static override args = {
    path: Args.string({
      description: 'Raw API path',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ApiGet)
    const {client} = await this.initializeRuntime(flags)
    const path = typeof args.path === 'string' ? args.path : undefined

    if (!path) {
      throw new Error('Path is required.')
    }

    const response = await client!.getRaw<unknown>(path, parseParamsFlag(flags.params))
    await this.renderPayload(response)
  }
}
