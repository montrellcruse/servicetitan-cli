import {Flags} from '@oclif/core'

import {saveCredentials} from '../../lib/auth.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {ServiceTitanClient} from '../../lib/client.js'
import {saveProfile} from '../../lib/config.js'
import {printSuccess} from '../../lib/output.js'
import {promptSecret, promptText} from '../../lib/prompts.js'

export default class AuthLogin extends BaseCommand {
  public static override description = 'Authenticate a ServiceTitan profile and store credentials securely'

  public static override examples = [
    '<%= config.bin %> auth login',
    '<%= config.bin %> auth login --profile acme-int --env integration',
  ]

  public static override flags = {
    ...baseFlags,
    env: Flags.string({
      description: 'ServiceTitan environment',
      options: ['production', 'integration'],
    }),
    profile: Flags.string({
      description: 'Profile name to create or update',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthLogin)
    const config = (await this.initializeRuntime(flags, {requireAuth: false})).config
    const providedProfile = typeof flags.profile === 'string' ? flags.profile : undefined
    const profileName =
      providedProfile ?? (await promptText('Profile name', {defaultValue: 'default'}))
    const providedEnvironment = typeof flags.env === 'string' ? flags.env : undefined
    const environmentInput =
      providedEnvironment ??
      (await promptText('Environment', {defaultValue: 'production'})).toLowerCase()

    if (environmentInput !== 'production' && environmentInput !== 'integration') {
      throw new Error('Environment must be "production" or "integration".')
    }

    const environment = environmentInput

    const clientId = await promptText('Client ID')
    const clientSecret = await promptSecret('Client Secret')
    const appKey = await promptText('App Key')
    const tenantId = await promptText('Tenant ID')

    const client = new ServiceTitanClient({
      appKey,
      clientId,
      clientSecret,
      environment,
      tenantId,
    })

    await client.get('/settings/v2/tenant/{tenant}/business-units')
    await saveProfile(profileName, {appKey, environment, tenantId})
    await saveCredentials(profileName, clientId, clientSecret)

    const wasFirstProfile = Object.keys(config.profiles).length === 0
    const suffix = wasFirstProfile ? ' and set it as the default profile.' : '.'
    printSuccess(`Authenticated profile "${profileName}"${suffix}`)
  }
}
