import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {resolveOptionalDateRange} from '../../lib/date-ranges.js'
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
      description: 'Start date filter (YYYY-MM-DD)',
    }),
    to: Flags.string({
      description: 'End date filter (YYYY-MM-DD)',
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
    const {client} = await this.initializeRuntime(flags)
    const {from, to} = resolveOptionalDateRange({
      from: flags.from,
      to: flags.to,
    })
    const limit = flags.limit ?? 50
    const appointments = await paginate<UnknownRecord>(
      client!,
      '/appointments',
      {
        from,
        jobId: flags.job,
        page: flags.page,
        status: flags.status,
        to,
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
