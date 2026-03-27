import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toBookingSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'
import {normalizeBookingStatus} from '../../lib/write-ops.js'

export default class BookingsList extends BaseCommand {
  public static override description = 'List bookings'

  public static override flags = {
    ...baseFlags,
    status: Flags.string({
      description: 'Booking status filter',
      options: ['open', 'converted', 'dismissed'],
    }),
    limit: Flags.integer({
      description: 'Maximum number of bookings to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all booking pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(BookingsList)
    const {client} = await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const bookings = await paginate<UnknownRecord>(
      client!,
      '/bookings',
      {
        status: normalizeBookingStatus(flags.status),
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(bookings.map(booking => toBookingSummary(booking)), {
      defaultFields: ['id', 'status', 'customer', 'source', 'created'],
      fields: this.parseFields(flags.fields),
    })
  }
}
