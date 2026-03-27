import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'
import {buildRequestBody} from '../../lib/write-ops.js'

export default class BookingsDismiss extends BaseCommand {
  public static override description = 'Dismiss a booking'

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
      description: 'Booking ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BookingsDismiss)
    await this.initializeRuntime(flags)
    const bookingId = typeof args.id === 'string' ? args.id : undefined

    if (!bookingId) {
      throw new Error('Booking ID is required.')
    }

    const path = `/bookings/${bookingId}`
    const body = buildRequestBody([
      ['status', 'Dismissed'],
      ['reason', flags.reason],
    ])

    if (flags['dry-run']) {
      printDryRun('PATCH', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Dismiss booking ${bookingId}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    await this.requireClient().patch<unknown>(path, body)
    printSuccess(`Booking ${bookingId} dismissed.`)
  }
}
