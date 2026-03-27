import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toCallSummary} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class CallsGet extends BaseCommand {
  public static override description = 'Get a single call'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Call ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(CallsGet)
    await this.initializeRuntime(flags)
    const callId = typeof args.id === 'string' ? args.id : undefined

    if (!callId) {
      throw new Error('Call ID is required.')
    }

    const call = await this.requireClient().get<UnknownRecord>(`/calls/${callId}`)
    const record = flags.full ? call : toCallSummary(call)

    await this.renderRecord(record, {
      defaultFields: flags.full ? undefined : ['id', 'status', 'duration', 'createdOn', 'answeredBy', 'customer', 'reason'],
    })
  }
}
