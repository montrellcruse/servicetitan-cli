import {BaseCommand, baseFlags} from '../../lib/base-command.js'

export default class AuthToken extends BaseCommand {
  public static override description = 'Print the current bearer token to stdout'

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthToken)
    const {client} = await this.initializeRuntime(flags)

    process.stdout.write(`${await client!.ensureToken()}\n`)
  }
}
