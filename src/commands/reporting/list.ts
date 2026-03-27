import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toReportCategoryRows} from '../../lib/entities.js'

export default class ReportingList extends BaseCommand {
  public static override description = 'List available reporting categories'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ReportingList)
    const {client} = await this.initializeRuntime(flags)
    const response = await client!.get<unknown>('/report-categories')
    const rows = toReportCategoryRows(response)

    await this.renderRecords(rows, {
      defaultFields: ['category', 'report', 'id'],
    })
  }
}
