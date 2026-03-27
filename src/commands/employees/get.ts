import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toEmployeeSummary} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class EmployeesGet extends BaseCommand {
  public static override description = 'Get a single employee'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Employee ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(EmployeesGet)
    const {client} = await this.initializeRuntime(flags)
    const employeeId = typeof args.id === 'string' ? args.id : undefined

    if (!employeeId) {
      throw new Error('Employee ID is required.')
    }

    const employee = await client!.get<UnknownRecord>(`/employees/${employeeId}`)
    const record = flags.full ? employee : toEmployeeSummary(employee)

    await this.renderRecord(record, {
      defaultFields: flags.full ? undefined : ['id', 'name', 'email', 'phoneNumber', 'role', 'active'],
    })
  }
}
