import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'
import {buildRequestBody} from '../../lib/write-ops.js'

export default class AppointmentsSetSummary extends BaseCommand {
  public static override description =
    'Set an appointment summary. Private preview: only works for accounts with the ServiceTitan feature enabled.'

  public static override flags = {
    ...baseFlags,
    notes: Flags.string({
      description: 'Work performed notes',
      required: true,
    }),
    technician: Flags.integer({
      description: 'Technician ID for the summary',
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
    id: Args.string({
      description: 'Appointment ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AppointmentsSetSummary)
    await this.initializeRuntime(flags)
    const appointmentId = typeof args.id === 'string' ? args.id : undefined

    if (!appointmentId) {
      throw new Error('Appointment ID is required.')
    }

    const path = `/appointments/${appointmentId}/summaries`
    const body = buildRequestBody([
      ['notes', flags.notes],
      ['technicianId', flags.technician],
    ])

    if (flags['dry-run']) {
      printDryRun('POST', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(
      `Set summary for appointment ${appointmentId}?`,
      flags.yes ?? false,
    )

    if (!confirmed) {
      return
    }

    const response = await this.requireClient().post<unknown>(path, body)
    printSuccess('Appointment summary set.')
    await this.renderPayload(response)
  }
}
