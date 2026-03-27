import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toTechnicianSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class TechsList extends BaseCommand {
  public static override description = 'List technicians'

  public static override examples = [
    '<%= config.bin %> techs list',
    '<%= config.bin %> techs list --active --limit 10',
    '<%= config.bin %> techs list --fields id,name,email --output json',
  ]

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      description: 'Only include active technicians',
    }),
    limit: Flags.integer({
      description: 'Maximum number of technicians to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all technician pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(TechsList)
    const {client} = await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const technicians = await paginate<UnknownRecord>(
      client!,
      '/technicians',
      {
        active: flags.active ? true : undefined,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(technicians.map(technician => toTechnicianSummary(technician)), {
      defaultFields: ['id', 'name', 'phone', 'email', 'active'],
      fields: this.parseFields(flags.fields),
    })
  }
}
