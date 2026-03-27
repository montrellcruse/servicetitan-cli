import {afterEach, describe, expect, it, vi} from 'vitest'

const createInterfaceMock = vi.hoisted(() => vi.fn())

vi.mock('node:readline/promises', () => ({
  createInterface: createInterfaceMock,
}))

import {confirmAction} from '../../src/lib/prompts.js'

const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')

describe('confirmAction', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    createInterfaceMock.mockReset()

    if (originalIsTTY) {
      Object.defineProperty(process.stdin, 'isTTY', originalIsTTY)
    } else {
      delete (process.stdin as {isTTY?: boolean}).isTTY
    }
  })

  it('returns true when autoConfirm is enabled', async () => {
    const confirmed = await confirmAction('Create customer?', true)

    expect(confirmed).toBe(true)
    expect(createInterfaceMock).not.toHaveBeenCalled()
  })

  it('throws when stdin is not a TTY', async () => {
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: false,
    })

    await expect(confirmAction('Create customer?', false)).rejects.toThrow(
      'Cannot prompt in non-interactive mode. Use --yes to skip confirmation.',
    )
    expect(createInterfaceMock).not.toHaveBeenCalled()
  })

  it('returns true when the user types y', async () => {
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    })

    const close = vi.fn()
    const question = vi.fn().mockResolvedValue('y')
    createInterfaceMock.mockReturnValue({close, question})

    const confirmed = await confirmAction('Create customer?', false)

    expect(confirmed).toBe(true)
    expect(question).toHaveBeenCalledWith('Create customer? (y/N): ')
    expect(close).toHaveBeenCalledOnce()
  })

  it('returns false when the user types n', async () => {
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    })

    const close = vi.fn()
    const question = vi.fn().mockResolvedValue('n')
    createInterfaceMock.mockReturnValue({close, question})

    const confirmed = await confirmAction('Create customer?', false)

    expect(confirmed).toBe(false)
    expect(close).toHaveBeenCalledOnce()
  })
})
