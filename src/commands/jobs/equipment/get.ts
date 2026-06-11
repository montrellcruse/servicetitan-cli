import {Args} from '@oclif/core'

import {extractResponseRecords} from '../../../lib/api.js'
import {BaseCommand, baseFlags} from '../../../lib/base-command.js'
import type {UnknownRecord} from '../../../lib/types.js'

export default class JobsEquipmentGet extends BaseCommand {
  public static override description = 'Get installed equipment attached to a job'

  public static override flags = {
    ...baseFlags,
  }

  public static override args = {
    jobId: Args.string({
      description: 'Job ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(JobsEquipmentGet)
    await this.initializeRuntime(flags)
    const jobId = typeof args.jobId === 'string' ? args.jobId : undefined

    if (!jobId) {
      throw new Error('Job ID is required.')
    }

    const response = await this.requireClient().get<unknown>(`/jobs/${jobId}/equipment`)
    const records = extractResponseRecords(response)

    if (records.length > 0) {
      await this.renderRecords(records, {
        defaultFields: ['equipmentIds'],
      })
      return
    }

    await this.renderRecord({equipmentIds: getEquipmentIds(response)})
  }
}

function getEquipmentIds(value: unknown): unknown[] {
  if (value && typeof value === 'object' && Array.isArray((value as UnknownRecord).equipmentIds)) {
    return (value as UnknownRecord).equipmentIds as unknown[]
  }

  return []
}
