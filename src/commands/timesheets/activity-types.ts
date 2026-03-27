import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class TimesheetsActivityTypes extends BaseCommand {
  public static override description = 'List timesheet activity types'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(TimesheetsActivityTypes)
    await this.initializeRuntime(flags)
    const response = await this.requireClient().get<unknown>('/activity-types')
    const activityTypes = extractResponseRecords(response)

    await this.renderRecords(activityTypes, {
      defaultFields: ['id', 'name', 'code', 'active'],
    })
  }
}
