import {Args, Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {toInvoiceDetail} from '../../lib/entities.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class InvoicesGet extends BaseCommand {
  public static override description = 'Get a single invoice'

  public static override flags = {
    ...baseFlags,
    full: Flags.boolean({
      description: 'Return the full API response',
    }),
  }

  public static override args = {
    id: Args.string({
      description: 'Invoice ID',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(InvoicesGet)
    const {client} = await this.initializeRuntime(flags)
    const invoiceId = typeof args.id === 'string' ? args.id : undefined

    if (!invoiceId) {
      throw new Error('Invoice ID is required.')
    }

    const invoice = await client!.get<UnknownRecord>(`/invoices/${invoiceId}`)
    const record = flags.full ? invoice : toInvoiceDetail(invoice)

    await this.renderRecord(record, {
      defaultFields: flags.full
        ? undefined
        : ['id', 'status', 'customer', 'total', 'balance', 'created', 'invoiceNumber', 'jobId', 'dueDate'],
    })
  }
}
