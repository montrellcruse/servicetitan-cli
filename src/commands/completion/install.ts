import {appendFile, mkdir, readFile, writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
import {basename, dirname, join} from 'node:path'

import {Flags} from '@oclif/core'

import {BaseCommand, baseFlags} from '../../lib/base-command.js'
import {printInfo, printSuccess} from '../../lib/output.js'
import {confirmAction} from '../../lib/prompts.js'

type ShellName = 'bash' | 'fish' | 'zsh'

interface CompletionCommand {
  flags: string[]
  id: string
}

const MARKER_START = '# st completion start'
const MARKER_END = '# st completion end'
const GLOBAL_FLAGS = ['--help', '--output', '--profile', '--color', '--no-color', '--compact']

export default class CompletionInstall extends BaseCommand {
  public static override description = 'Install shell completion for the ServiceTitan CLI'

  public static override flags = {
    ...baseFlags,
    shell: Flags.string({
      description: 'Shell to install completion for',
      options: ['bash', 'zsh', 'fish'],
    }),
    yes: Flags.boolean({
      description: 'Skip the confirmation prompt',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(CompletionInstall)
    await this.initializeRuntime(flags, {requireAuth: false})
    const shell = resolveShell(flags.shell)
    const builtInCommand = findBuiltInCompletionCommand(this.config.commandIDs)

    if (builtInCommand) {
      await this.config.runCommand(builtInCommand, ['--shell', shell])
      return
    }

    const targetPath = getTargetPath(shell)
    const shouldInstall = await confirmAction(
      `Install ${shell} completion in ${targetPath}?`,
      flags.yes ?? false,
    )

    if (!shouldInstall) {
      printInfo('Skipped shell completion installation.')
      return
    }

    const commands = this.config.commands
      .filter(command => !command.hidden)
      .map(command => ({
        flags: getFlagSuggestions(command.flags),
        id: command.id,
      }))
    const script = buildCompletionScript(shell, this.config.bin, commands)

    if (shell === 'fish') {
      await writeCompletionFile(targetPath, script)
    } else {
      await appendCompletionBlock(targetPath, script)
    }

    printSuccess(`Installed ${shell} completion at ${targetPath}`)
  }
}

function resolveShell(value: string | undefined): ShellName {
  if (value === 'bash' || value === 'zsh' || value === 'fish') {
    return value
  }

  const shell = basename(process.env.SHELL ?? '')

  if (shell === 'bash' || shell === 'zsh' || shell === 'fish') {
    return shell
  }

  throw new Error('Unable to detect your shell. Use --shell bash, --shell zsh, or --shell fish.')
}

function findBuiltInCompletionCommand(commandIDs: string[]): string | undefined {
  return commandIDs.find(id =>
    ['autocomplete', 'autocomplete:script', 'completion', 'completion:script'].includes(id),
  )
}

function getTargetPath(shell: ShellName): string {
  const home = homedir()

  switch (shell) {
    case 'bash': {
      return join(home, '.bashrc')
    }

    case 'fish': {
      return join(home, '.config', 'fish', 'completions', 'st.fish')
    }

    case 'zsh': {
      return join(home, '.zshrc')
    }
  }
}

function getFlagSuggestions(flags: Record<string, unknown>): string[] {
  const suggestions = new Set<string>(GLOBAL_FLAGS)

  for (const [name, value] of Object.entries(flags)) {
    suggestions.add(`--${name}`)

    if (
      value &&
      typeof value === 'object' &&
      'allowNo' in value &&
      (value as {allowNo?: boolean}).allowNo
    ) {
      suggestions.add(`--no-${name}`)
    }

    if (value && typeof value === 'object' && 'char' in value) {
      const char = (value as {char?: unknown}).char

      if (typeof char === 'string' && char.trim()) {
        suggestions.add(`-${char}`)
      }
    }
  }

  return [...suggestions].sort()
}

function buildCompletionScript(
  shell: ShellName,
  bin: string,
  commands: CompletionCommand[],
): string {
  switch (shell) {
    case 'bash': {
      return buildBashLikeScript(bin, commands)
    }

    case 'fish': {
      return buildFishScript(bin, commands)
    }

    case 'zsh': {
      return [
        MARKER_START,
        'autoload -Uz bashcompinit',
        'bashcompinit',
        buildBashLikeFunction(bin, commands),
        `complete -F __${bin}_completion ${bin}`,
        MARKER_END,
      ].join('\n')
    }
  }
}

function buildBashLikeScript(bin: string, commands: CompletionCommand[]): string {
  return [MARKER_START, buildBashLikeFunction(bin, commands), `complete -F __${bin}_completion ${bin}`, MARKER_END].join(
    '\n',
  )
}

function buildBashLikeFunction(bin: string, commands: CompletionCommand[]): string {
  const topLevelSuggestions = buildTopLevelSuggestions(commands)
  const topicBlocks = buildTopicBlocks(commands, 'bash')
  const nestedBlocks = buildNestedCommandBlocks(commands, 'bash')
  const singleCommandBlocks = buildSingleCommandBlocks(commands, 'bash')

  return [
    `__${bin}_completion() {`,
    '  local cur first second command_key',
    '  COMPREPLY=()',
    '  cur="${COMP_WORDS[COMP_CWORD]}"',
    '  first="${COMP_WORDS[1]}"',
    '  second="${COMP_WORDS[2]}"',
    '  if [[ ${COMP_CWORD} -eq 1 ]]; then',
    `    COMPREPLY=( $(compgen -W "${topLevelSuggestions}" -- "$cur") )`,
    '    return 0',
    '  fi',
    '  if [[ ${COMP_CWORD} -eq 2 ]]; then',
    '    case "$first" in',
    ...topicBlocks.map(line => `  ${line}`),
    '    esac',
    '  fi',
    '  command_key=""',
    '  if [[ -n "$second" && "$second" != -* ]]; then',
    '    command_key="${first}:${second}"',
    '  fi',
    '  case "$command_key" in',
    ...nestedBlocks,
    '  esac',
    '  case "$first" in',
    ...singleCommandBlocks,
    '  esac',
    '  return 0',
    '}',
  ].join('\n')
}

function buildFishScript(bin: string, commands: CompletionCommand[]): string {
  const topLevelSuggestions = buildTopLevelSuggestions(commands)
  const topicBlocks = buildTopicBlocks(commands, 'fish')
  const nestedBlocks = buildNestedCommandBlocks(commands, 'fish')
  const singleCommandBlocks = buildSingleCommandBlocks(commands, 'fish')

  return [
    MARKER_START,
    `function __${bin}_completion`,
    '  set -l words (commandline -opc)',
    '  set -l current (commandline -ct)',
    '  if test (count $words) -gt 0',
    '    set words $words[2..-1]',
    '  end',
    '  if test (count $words) -eq 0',
    `    printf '%s\\n' ${toFishWords(topLevelSuggestions)}`,
    '    return',
    '  end',
    '  if test (count $words) -eq 1; and test -n "$current"',
    `    printf '%s\\n' ${toFishWords(topLevelSuggestions)}`,
    '    return',
    '  end',
    '  set -l first ""',
    '  set -l second ""',
    '  if test (count $words) -ge 1',
    '    set first $words[1]',
    '  end',
    '  if test (count $words) -ge 2',
    '    set second $words[2]',
    '  end',
    '  if test (count $words) -eq 1',
    '    switch $first',
    ...topicBlocks.map(line => `  ${line}`),
    '    end',
    '  end',
    '  switch "$first:$second"',
    ...nestedBlocks,
    '  end',
    '  switch $first',
    ...singleCommandBlocks,
    '  end',
    'end',
    `complete -c ${bin} -f -a "(__${bin}_completion)"`,
    MARKER_END,
  ].join('\n')
}

function buildTopLevelSuggestions(commands: CompletionCommand[]): string {
  const suggestions = new Set<string>(GLOBAL_FLAGS)

  for (const command of commands) {
    suggestions.add(command.id.split(':')[0])
  }

  return [...suggestions].sort().join(' ')
}

function buildTopicBlocks(commands: CompletionCommand[], shell: ShellName): string[] {
  const topics = new Map<string, string[]>()

  for (const command of commands) {
    const parts = command.id.split(':')

    if (parts.length < 2) {
      continue
    }

    const topic = parts[0]
    const subcommand = parts[1]
    const existing = topics.get(topic) ?? []

    if (!existing.includes(subcommand)) {
      existing.push(subcommand)
      existing.sort()
      topics.set(topic, existing)
    }
  }

  return [...topics.entries()].flatMap(([topic, subcommands]) => {
    const suggestions = subcommands.join(' ')

    if (shell === 'fish') {
      return [
        `    case ${topic}`,
        `      printf '%s\\n' ${toFishWords(suggestions)}`,
        '      return',
      ]
    }

    return [
      `    ${topic})`,
      `      COMPREPLY=( $(compgen -W "${suggestions}" -- "$cur") )`,
      '      return 0',
      '      ;;',
    ]
  })
}

function buildNestedCommandBlocks(commands: CompletionCommand[], shell: ShellName): string[] {
  return commands
    .filter(command => command.id.includes(':'))
    .flatMap(command => {
      const suggestions = command.flags.join(' ')

      if (shell === 'fish') {
        return [
          `    case ${command.id}`,
          `      printf '%s\\n' ${toFishWords(suggestions)}`,
          '      return',
        ]
      }

      return [
        `    ${command.id})`,
        `      COMPREPLY=( $(compgen -W "${suggestions}" -- "$cur") )`,
        '      return 0',
        '      ;;',
      ]
    })
}

function buildSingleCommandBlocks(commands: CompletionCommand[], shell: ShellName): string[] {
  return commands
    .filter(command => !command.id.includes(':'))
    .flatMap(command => {
      const suggestions = command.flags.join(' ')

      if (shell === 'fish') {
        return [
          `    case ${command.id}`,
          `      printf '%s\\n' ${toFishWords(suggestions)}`,
          '      return',
        ]
      }

      return [
        `    ${command.id})`,
        `      COMPREPLY=( $(compgen -W "${suggestions}" -- "$cur") )`,
        '      return 0',
        '      ;;',
      ]
    })
}

function toFishWords(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map(word => `'${word}'`)
    .join(' ')
}

async function appendCompletionBlock(targetPath: string, script: string): Promise<void> {
  await mkdir(dirname(targetPath), {recursive: true})

  let existing = ''
  let missingFile = false

  try {
    existing = await readFile(targetPath, 'utf8')
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error
    }

    missingFile = true
  }

  if (missingFile) {
    await writeFile(targetPath, `${script}\n`, 'utf8')
    return
  }

  if (existing.includes(MARKER_START) && existing.includes(MARKER_END)) {
    const nextContent = upsertBlock(existing, script)

    if (nextContent === existing) {
      return
    }

    await writeFile(targetPath, nextContent, 'utf8')
    return
  }

  const prefix = existing.endsWith('\n') ? '' : '\n'
  await appendFile(targetPath, `${prefix}${script}\n`, 'utf8')
}

async function writeCompletionFile(targetPath: string, script: string): Promise<void> {
  await mkdir(dirname(targetPath), {recursive: true})
  await writeFile(targetPath, `${script}\n`, 'utf8')
}

function upsertBlock(existing: string, nextBlock: string): string {
  if (!existing.includes(MARKER_START) || !existing.includes(MARKER_END)) {
    return existing
  }

  const pattern = new RegExp(`${escapeRegExp(MARKER_START)}[\\s\\S]*?${escapeRegExp(MARKER_END)}`, 'm')
  return existing.replace(pattern, nextBlock)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
