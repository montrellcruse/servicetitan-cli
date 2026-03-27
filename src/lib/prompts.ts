import process from 'node:process'
import {createInterface} from 'node:readline/promises'

export async function promptText(
  label: string,
  options: {defaultValue?: string; required?: boolean} = {},
): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    while (true) {
      const suffix = options.defaultValue ? ` [${options.defaultValue}]` : ''
      const answer = await rl.question(`${label}${suffix}: `)
      const value = answer.trim() || options.defaultValue || ''

      if (!options.required && !value) {
        return ''
      }

      if (value) {
        return value
      }
    }
  } finally {
    rl.close()
  }
}

export async function promptSecret(label: string): Promise<string> {
  process.stdout.write(`${label}: `)

  return await new Promise<string>(resolve => {
    const chunks: string[] = []
    const stdin = process.stdin
    const wasRaw = Boolean(stdin.isRaw)

    const cleanup = (): void => {
      stdin.setRawMode?.(wasRaw)
      stdin.pause()
      stdin.removeListener('data', onData)
      process.stdout.write('\n')
    }

    const onData = (buffer: Buffer): void => {
      const text = buffer.toString('utf8')

      if (text === '\r' || text === '\n') {
        cleanup()
        resolve(chunks.join('').trim())
        return
      }

      if (text === '\u0003') {
        cleanup()
        process.exit(1)
      }

      if (text === '\u007f') {
        chunks.pop()
        return
      }

      chunks.push(text)
    }

    stdin.setRawMode?.(true)
    stdin.resume()
    stdin.on('data', onData)
  })
}
