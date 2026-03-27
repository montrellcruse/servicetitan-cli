import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class InventoryWarehouses extends BaseCommand {
  public static override description = 'List inventory warehouses'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InventoryWarehouses)
    await this.initializeRuntime(flags)
    const response = await this.requireClient().get<unknown>('/warehouses')
    const warehouses = extractResponseRecords(response)

    await this.renderRecords(warehouses, {
      defaultFields: ['id', 'name', 'active'],
    })
  }
}
