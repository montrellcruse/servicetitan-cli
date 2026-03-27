import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {assertDateString, getTodayDate} from '../../lib/date-ranges.js'
import {toAppointmentAssignmentSummary} from '../../lib/entities.js'
import {extractResponseRecords} from '../../lib/api.js'

export default class DispatchBoard extends BaseCommand {
  public static override description = 'Show the dispatch board'

  public static override examples = [
    '<%= config.bin %> dispatch board',
    '<%= config.bin %> dispatch board --date 2026-03-26',
    '<%= config.bin %> dispatch board --date 2026-03-26 --tech 52 --output json',
  ]

  public static override flags = {
    ...baseFlags,
    date: Flags.string({
      description: 'Dispatch date (YYYY-MM-DD)',
    }),
    tech: Flags.integer({
      description: 'Technician ID filter',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DispatchBoard)
    const {client} = await this.initializeRuntime(flags)
    const date = assertDateString(flags.date ?? getTodayDate(), 'Date')
    const response = await client!.get<unknown>('/appointment-assignments', {
      date,
      technicianId: flags.tech,
    })
    const assignments = extractResponseRecords(response)

    await this.renderRecords(assignments.map(assignment => toAppointmentAssignmentSummary(assignment)), {
      defaultFields: ['appointment', 'job', 'tech', 'assignedOn', 'status'],
    })
  }
}
