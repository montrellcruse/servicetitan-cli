import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printDryRun, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'

export default class DispatchAssign extends BaseCommand {
  public static override description = 'Assign a technician to an appointment'

  public static override flags = {
    ...baseFlags,
    appointment: Flags.integer({
      description: 'Appointment ID',
      required: true,
    }),
    tech: Flags.integer({
      description: 'Technician ID',
      required: true,
    }),
    yes: Flags.boolean({
      description: 'Skip the confirmation prompt',
    }),
    'dry-run': Flags.boolean({
      description: 'Print the request without sending it',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DispatchAssign)
    await this.initializeRuntime(flags)
    const path = '/appointment-assignments'
    const body = {
      appointmentId: flags.appointment,
      technicianId: flags.tech,
    }

    if (flags['dry-run']) {
      printDryRun('POST', this.requireClient().resolvePath(path), body)
      return
    }

    const confirmed = await confirmAction(
      `Assign technician ${flags.tech} to appointment ${flags.appointment}?`,
      flags.yes ?? false,
    )

    if (!confirmed) {
      return
    }

    await this.requireClient().post<unknown>(path, body)
    printSuccess('Assignment created.')
  }
}
