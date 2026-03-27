import {Args} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toBookingDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class BookingsGet extends BaseCommand {
  public static override description = 'Get a single booking'

  public static override flags = {
    ...baseFlags,
  }

  public static override args = {
    id: Args.string({
      description: 'Booking ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(BookingsGet)
    const {client} = await this.initializeRuntime(flags)
    const bookingId = typeof args.id === 'string' ? args.id : undefined

    if (!bookingId) {
      throw new Error('Booking ID is required.')
    }

    const booking = await client!.get<UnknownRecord>(`/bookings/${bookingId}`)

    await this.renderRecord(toBookingDetail(booking), {
      defaultFields: ['id', 'status', 'customer', 'source', 'created', 'phone', 'email', 'address', 'notes'],
    })
  }
}
