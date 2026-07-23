import {readFileSync} from 'node:fs'
import {isDeepStrictEqual} from 'node:util'

const shrinkwrap = JSON.parse(readFileSync('npm-shrinkwrap.json', 'utf8'))
const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'))

if (!isDeepStrictEqual(shrinkwrap, packageLock)) {
  console.error('npm-shrinkwrap.json and package-lock.json are out of sync.')
  console.error('Regenerate the shrinkwrap, then update the package-lock audit mirror.')
  process.exit(1)
}

console.log(`Lockfiles agree on ${Object.keys(shrinkwrap.packages).length} package entries.`)
