import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toBusinessUnitSummary} from '../../lib/entities.js'

export default class BusinessUnitsList extends BaseCommand {
  public static override description = 'List business units'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(BusinessUnitsList)
    const {client} = await this.initializeRuntime(flags)
    const response = await client!.get<unknown>('/business-units')
    const businessUnits = extractResponseRecords(response)

    await this.renderRecords(businessUnits.map(unit => toBusinessUnitSummary(unit)), {
      defaultFields: ['id', 'name', 'active'],
    })
  }
}
