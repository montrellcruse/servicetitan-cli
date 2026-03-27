import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class InventoryWarehouses extends BaseCommand {
  public static override description = 'List inventory warehouses'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InventoryWarehouses)
    const {client} = await this.initializeRuntime(flags)
    const response = await client!.get<unknown>('/warehouses')
    const warehouses = extractResponseRecords(response)

    await this.renderRecords(warehouses, {
      defaultFields: ['id', 'name', 'active'],
    })
  }
}
