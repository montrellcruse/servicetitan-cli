import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class DispatchZones extends BaseCommand {
  public static override description = 'List dispatch zones'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DispatchZones)
    const {client} = await this.initializeRuntime(flags)
    const response = await client!.get<unknown>('/zones')
    const zones = extractResponseRecords(response)

    await this.renderRecords(zones, {
      defaultFields: ['id', 'name', 'active'],
    })
  }
}
