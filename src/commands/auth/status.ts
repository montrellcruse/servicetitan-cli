import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {getCredentials} from '../../lib/auth.js'
import {printInfo} from '../../lib/output.js'
import type {UnknownRecord} from '../../lib/types.js'

export default class AuthStatus extends BaseCommand {
  public static override description = 'Show configured profiles and credential status'

  public static override examples = [
    '<%= config.bin %> auth status',
    '<%= config.bin %> auth status --output json',
  ]

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthStatus)
    const config = (await this.initializeRuntime(flags, {requireAuth: false})).config

    if (Object.keys(config.profiles).length === 0) {
      printInfo('No active profile configured. Run `st auth login` first.')
      return
    }

    const rows = await Promise.all(
      Object.entries(config.profiles).map(async ([name, profile]): Promise<UnknownRecord> => ({
        name,
        environment: profile.environment,
        tenantId: profile.tenantId,
        credentials: (await getCredentials(name)) ? 'yes' : 'no',
        default: config.default === name,
      })),
    )

    await this.renderRecords(rows, {
      defaultFields: ['name', 'environment', 'tenantId', 'credentials', 'default'],
    })
  }
}
