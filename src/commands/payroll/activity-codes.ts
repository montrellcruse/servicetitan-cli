import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class PayrollActivityCodes extends BaseCommand {
  public static override description = 'List payroll activity codes'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PayrollActivityCodes)
    const {client} = await this.initializeRuntime(flags)
    const response = await client!.get<unknown>('/activity-codes')
    const activityCodes = extractResponseRecords(response)

    await this.renderRecords(activityCodes, {
      defaultFields: ['id', 'code', 'name', 'active'],
    })
  }
}
