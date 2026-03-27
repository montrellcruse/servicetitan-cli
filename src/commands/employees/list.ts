import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toEmployeeSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class EmployeesList extends BaseCommand {
  public static override description = 'List employees'

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter employees by active status',
    }),
    page: Flags.integer({
      description: 'Page number to fetch (1-based)',
    }),
    limit: Flags.integer({
      description: 'Maximum number of employees to return',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(EmployeesList)
    await this.initializeRuntime(flags)
    const limit = flags.limit ?? 50
    const employees = await paginate<UnknownRecord>(
      this.requireClient(),
      '/employees',
      {
        active: flags.active,
        page: flags.page,
      },
      {
        limit,
        pageSize: limit,
      },
    )

    await this.renderRecords(employees.map(employee => toEmployeeSummary(employee)), {
      defaultFields: ['id', 'name', 'email', 'phoneNumber', 'role', 'active'],
    })
  }
}
