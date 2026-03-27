import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {extractResponseRecords} from '../../lib/api.js'

export default class Whoami extends BaseCommand {
  public static override description = 'Show the current auth profile and tenant info'

  public static override examples = [
    '<%= config.bin %> auth whoami',
    '<%= config.bin %> auth whoami --output json',
  ]

  public static override flags = {
    ...baseFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Whoami)
    const {profile, profileName} = await this.initializeRuntime(flags)
    const client = this.requireClient()

    // Fetch business units to confirm credentials work and gather tenant info
    const response = await client.get<unknown>('/business-units')
    const businessUnits = extractResponseRecords(response)

    const info: Record<string, unknown> = {
      profile: profileName ?? 'default',
      environment: profile?.environment ?? 'production',
      tenantId: profile?.tenantId ?? 'unknown',
      appKey: profile?.appKey ? `${profile.appKey.slice(0, 8)}...` : 'not set',
      businessUnits: businessUnits.length,
    }

    await this.renderRecord(info, {
      defaultFields: ['profile', 'environment', 'tenantId', 'appKey', 'businessUnits'],
    })
  }
}
