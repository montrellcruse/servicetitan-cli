import {Flags} from '@oclif/core'

import {deleteCredentials} from '../../lib/auth.js'
import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {deleteProfile, getActiveProfileName} from '../../lib/config.js'
import {printInfo, printSuccess} from '../../lib/output.js'

export default class AuthLogout extends BaseCommand {
  public static override description = 'Remove a stored profile and delete its credentials'

  public static override flags = {
    ...baseFlags,
    profile: Flags.string({
      description: 'Profile name to remove',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AuthLogout)
    await this.initializeRuntime(flags, {requireAuth: false})
    const providedProfile = typeof flags.profile === 'string' ? flags.profile : undefined

    const profileName = providedProfile ?? (await getActiveProfileName())

    if (typeof profileName !== 'string') {
      printInfo('No active profile configured. Nothing to remove.')
      return
    }

    await deleteCredentials(profileName)
    await deleteProfile(profileName)
    printSuccess(`Removed profile "${profileName}".`)
  }
}
