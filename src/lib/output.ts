import process from 'node:process'

import chalk, {Chalk} from 'chalk'
import Table from 'cli-table3'
import {stringify} from 'csv-stringify'

let colorOverride: boolean | undefined
const noColorChalk = new Chalk({level: 0})

export function setColorEnabled(enabled: boolean | undefined): void {
  colorOverride = enabled
}

export function printTable(headers: string[], rows: Array<Array<unknown>>): void {
  const table = new Table({
    head: headers,
    style: {
      head: [],
      border: [],
    },
  })

  for (const row of rows) {
    table.push(row.map(cell => stringifyCell(cell)))
  }

  process.stdout.write(`${table.toString()}\n`)
}

export function printJSON(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`)
}

export async function printCSV(
  headers: string[],
  rows: Array<Array<unknown>>,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const stream = stringify({
      header: true,
      columns: headers,
    })

    stream.on('error', reject)
    stream.on('end', resolve)
    stream.pipe(process.stdout, {end: false})

    for (const row of rows) {
      stream.write(row.map(cell => stringifyCell(cell)))
    }

    stream.end()
  })
}

export function printError(message: string, tip?: string): void {
  const chalk = getChalk()
  process.stderr.write(`${chalk.red('✗ Error:')} ${message}\n`)

  if (tip) {
    process.stderr.write(`${chalk.dim('Tip:')} ${tip}\n`)
  }
}

export function printSuccess(message: string): void {
  const chalk = getChalk()
  process.stdout.write(`${chalk.green('✓')} ${message}\n`)
}

export function printInfo(message: string): void {
  const chalk = getChalk()
  process.stdout.write(`${chalk.dim(message)}\n`)
}

export function printDryRun(method: string, url: string, body?: unknown): void {
  const chalk = getChalk()
  process.stdout.write(`${chalk.yellow('[DRY RUN]')} ${method} ${url}\n`)

  if (body !== undefined) {
    process.stdout.write('Body:\n')
    process.stdout.write(`${JSON.stringify(body, null, 2)}\n`)
  }
}

function getChalk() {
  const noColor =
    colorOverride === false || Boolean(process.env.NO_COLOR) || process.env.ST_NO_COLOR === '1'

  if (noColor) {
    return noColorChalk
  }

  return chalk
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }

  return JSON.stringify(value)
}
