import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toTechnicianDetail} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class TechsGet extends BaseCommand {
  public static override description = 'Get a single technician'

  public static override flags = {
    ...baseFlags,
    name: Flags.string({
      description: 'Find a technician by name instead of ID',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Technician ID',
      required: false,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(TechsGet)
    await this.initializeRuntime(flags)
    const searchName = typeof flags.name === 'string' ? flags.name : undefined
    const technicianId = typeof args.id === 'string' ? args.id : undefined
    let technician: UnknownRecord | undefined

    if (searchName) {
      const technicians = await paginate<UnknownRecord>(this.requireClient(), '/technicians', {}, {all: true, pageSize: 5000})
      technician = findByName(technicians, searchName)
    } else if (technicianId) {
      technician = await this.requireClient().get<UnknownRecord>(`/technicians/${technicianId}`)
    } else {
      throw new Error('Provide a technician ID or use --name.')
    }

    if (!technician) {
      throw new Error('Technician not found.')
    }

    await this.renderRecord(toTechnicianDetail(technician), {
      defaultFields: ['id', 'name', 'phone', 'email', 'active', 'businessUnit', 'employeeId'],
    })
  }
}

function findByName(records: UnknownRecord[], query: string): UnknownRecord | undefined {
  const normalizedQuery = query.trim().toLowerCase()
  const exact = records.find(record => {
    const name = getTechnicianName(record).trim().toLowerCase()
    return name === normalizedQuery
  })

  if (exact) {
    return exact
  }

  return records.find(record => {
    const name = getTechnicianName(record).toLowerCase()
    return name.includes(normalizedQuery)
  })
}

function getTechnicianName(record: UnknownRecord): string {
  const name = toTechnicianDetail(record).name
  return typeof name === 'string' ? name : ''
}
