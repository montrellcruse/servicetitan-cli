import {Flags} from '@oclif/core'

import {extractResponseRecords} from '../../lib/api.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class PricebookCategories extends BaseCommand {
  public static override description = 'List pricebook categories'

  public static override flags = {
    ...baseFlags,
    active: Flags.boolean({
      allowNo: true,
      description: 'Filter categories by active status',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PricebookCategories)
    await this.initializeRuntime(flags)
    const response = await this.requireClient().get<unknown>('/categories', {
      active: flags.active,
    })
    const categories = extractResponseRecords(response)

    await this.renderRecords(categories, {
      defaultFields: ['id', 'name', 'active'],
    })
  }
}
