import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, toSTDateTime, toSTDateTimeExclusiveEnd} from '../../lib/date-ranges.js'
import {toAppointmentSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class AppointmentsList extends BaseCommand {
  public static override description = 'List appointments'

  public static override flags = {
    ...baseFlags,
    job: Flags.integer({
      description: 'Job ID filter',
    }),
    status: Flags.string({
      description: 'Appointment status filter',
    }),
    from: Flags.string({
      description: 'Created-on-or-after date (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'Created-before date, inclusive (YYYY-MM-DD)',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of appointments to return',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AppointmentsList)
    await this.initializeRuntime(flags)
    const createdOnOrAfter = flags.from
      ? toSTDateTime(assertDateString(flags.from, 'From date'))
      : undefined
    const createdBefore = flags.to
      ? toSTDateTimeExclusiveEnd(assertDateString(flags.to, 'To date'))
      : undefined
    const limit = flags.limit ?? 50
    const appointments = await paginate<UnknownRecord>(
      this.requireClient(),
      '/appointments',
      {
        createdBefore,
        createdOnOrAfter,
        jobId: flags.job,
        page: flags.page,
        status: flags.status,
      },
      {
        limit,
        pageSize: limit,
      },
    )

    await this.renderRecords(appointments.map(appointment => toAppointmentSummary(appointment)), {
      defaultFields: [
        'id',
        'jobId',
        'appointmentNumber',
        'start',
        'end',
        'arrivalWindowStart',
        'arrivalWindowEnd',
        'status',
        'isConfirmed',
      ],
    })
  }
}
