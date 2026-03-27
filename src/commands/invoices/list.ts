import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toInvoiceSummary} from '../../lib/entities.js'
import {paginate} from '../../lib/pagination.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class InvoicesList extends BaseCommand {
  public static override description = 'List invoices'

  public static override flags = {
    ...baseFlags,
    status: Flags.string({
      description: 'Invoice status filter (paid, unpaid, void)',
      options: ['paid', 'unpaid', 'void'],
    }),
    limit: Flags.integer({
      description: 'Maximum number of invoices to return',
    }),
    all: Flags.boolean({
      description: 'Fetch all invoice pages',
    }),
    fields: Flags.string({
      description: 'Comma-separated fields to include',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(InvoicesList)
    const {client} = await this.initializeRuntime(flags)
    const effectiveLimit = flags.all ? flags.limit : flags.limit ?? 50
    const invoices = await paginate<UnknownRecord>(
      client!,
      '/invoices',
      {
        status: flags.status,
      },
      {
        all: flags.all,
        limit: effectiveLimit,
        pageSize: flags.all ? Math.min(flags.limit ?? 5000, 5000) : effectiveLimit,
      },
    )

    await this.renderRecords(invoices.map(invoice => toInvoiceSummary(invoice)), {
      defaultFields: ['id', 'status', 'customer', 'total', 'balance', 'created'],
      fields: this.parseFields(flags.fields),
    })
  }
}
