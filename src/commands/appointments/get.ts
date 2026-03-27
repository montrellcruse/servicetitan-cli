import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toAppointmentSummary} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

const APPOINTMENT_FIELDS = [
  'id',
  'jobId',
  'appointmentNumber',
  'start',
  'end',
  'arrivalWindowStart',
  'arrivalWindowEnd',
  'status',
  'isConfirmed',
]

export default class AppointmentsGet extends BaseCommand {
  public static override description = 'Get a single appointment'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Appointment ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AppointmentsGet)
    await this.initializeRuntime(flags)
    const appointmentId = typeof args.id === 'string' ? args.id : undefined

    if (!appointmentId) {
      throw new Error('Appointment ID is required.')
    }

    const appointment = await this.requireClient().get<UnknownRecord>(`/appointments/${appointmentId}`)
    const record = flags.full ? appointment : toAppointmentSummary(appointment)

    await this.renderRecord(record, {
      defaultFields: flags.full ? undefined : APPOINTMENT_FIELDS,
    })
  }
}
