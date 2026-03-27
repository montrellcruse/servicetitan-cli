import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'

export default class BookingsAccept extends BaseCommand {
  public static override description = 'Accept a booking'

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
      description: 'Booking ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BookingsAccept)
    const {client} = await this.initializeRuntime(flags)
    const bookingId = typeof args.id === 'string' ? args.id : undefined

    if (!bookingId) {
      throw new Error('Booking ID is required.')
    }

    const path = `/bookings/${bookingId}`
    const body = {status: 'Converted'}

    if (flags['dry-run']) {
      printDryRun('PATCH', client!.resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(`Accept booking ${bookingId}?`, flags.yes ?? false)

    if (!confirmed) {
      return
    }

    await client!.patch<unknown>(path, body)
    printSuccess(`Booking ${bookingId} accepted.`)
  }
}
