import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class InventoryTrucks extends BaseCommand {
  public static override description = 'List inventory trucks'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InventoryTrucks)
    await this.initializeRuntime(flags)
    const response = await this.requireClient().get<unknown>('/trucks')
    const trucks = extractResponseRecords(response)

    await this.renderRecords(trucks, {
      defaultFields: ['id', 'name', 'number', 'active'],
    })
  }
}
