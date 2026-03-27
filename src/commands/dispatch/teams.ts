import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class DispatchTeams extends BaseCommand {
  public static override description = 'List dispatch teams'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(DispatchTeams)
    await this.initializeRuntime(flags)
    const response = await this.requireClient().get<unknown>('/teams')
    const teams = extractResponseRecords(response)

    await this.renderRecords(teams, {
      defaultFields: ['id', 'name', 'active'],
    })
  }
}
