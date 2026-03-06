import { vi, type MockedFunction } from 'vitest'
import { fstatSync } from 'fs'
import { sqip, resolvePlugins } from 'sqip'
import sqipCLI from '../../src/sqip-cli'

import semver from 'semver'

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return { ...actual, fstatSync: vi.fn(actual.fstatSync) }
})

const mockedFstatSync = fstatSync as MockedFunction<typeof fstatSync>

vi.mock('sqip', () => ({
  sqip: vi.fn(async () => []),
  resolvePlugins: vi.fn(() => [
    {
      name: 'mocked',
      Plugin: {
        cliOptions: [
          {
            name: 'mocked-plugin-option',
            type: Boolean,
            description: 'This is mocked'
          }
        ]
      }
    }
  ])
}))

const mockedSqip = sqip as MockedFunction<typeof sqip>
const mockedResolvePlugins = resolvePlugins as MockedFunction<
  typeof resolvePlugins
>

const logSpy = vi.spyOn(global.console, 'log').mockImplementation(() => null)
const errorSpy = vi
  .spyOn(global.console, 'error')
  .mockImplementation(() => null)

const proccessExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

const originalArgv = process.argv

describe('sqip-plugin-cli', () => {
  afterEach(() => {
    logSpy.mockClear()
    errorSpy.mockClear()
    proccessExitSpy.mockClear()
    mockedSqip.mockClear()
    mockedResolvePlugins.mockClear()
    mockedFstatSync.mockRestore()
    process.argv = originalArgv
  })

  afterAll(() => {
    logSpy.mockReset()
    errorSpy.mockReset()
    proccessExitSpy.mockReset()
  })

  it('no args: show help and require input option', async () => {
    await sqipCLI()

    expect(mockedSqip).not.toHaveBeenCalled()
    expect(mockedResolvePlugins.mock.calls).toMatchSnapshot('resolve')
    expect(logSpy.mock.calls[0][0]).toMatch(/-h.*Show help/)
    expect(logSpy.mock.calls[0][0]).toMatch(/-p.*One or more plugins/)
    expect(logSpy.mock.calls[0][0]).toMatch(
      /--output.*Define the path of the resulting file/
    )
    expect(logSpy.mock.calls[0][0]).toMatch(/Examples/)
    expect(errorSpy).toHaveBeenCalledWith(
      '\nPlease provide the following arguments: input'
    )
    expect(global.process.exit).toHaveBeenCalledWith(1)
  })

  it('--version: show version', async () => {
    process.argv = ['', '', '--version']

    await sqipCLI()

    expect(mockedSqip).not.toHaveBeenCalled()
    expect(mockedResolvePlugins.mock.calls).toMatchSnapshot('resolve')
    expect(semver.valid(logSpy.mock.calls[0][0])).toBe(logSpy.mock.calls[0][0])
    expect(errorSpy.mock.calls).toMatchSnapshot('error')
    expect(global.process.exit).toHaveBeenCalledWith(0)
  })

  it('--help: show help', async () => {
    process.argv = ['', '', '--help']

    await sqipCLI()

    expect(mockedSqip).not.toHaveBeenCalled()
    expect(mockedResolvePlugins.mock.calls).toMatchSnapshot('resolve')
    expect(logSpy.mock.calls[0][0]).toMatch(/-h.*Show help/)
    expect(logSpy.mock.calls[0][0]).toMatch(/-p.*One or more plugins/)
    expect(logSpy.mock.calls[0][0]).toMatch(
      /--output.*Define the path of the resulting file/
    )
    expect(logSpy.mock.calls[0][0]).toMatch(/Examples/)
    expect(errorSpy.mock.calls).toMatchSnapshot('error')
    expect(global.process.exit).toHaveBeenCalledWith(0)
  })

  it('throws on missing input', async () => {
    process.argv = ['', '']

    await sqipCLI()

    expect(errorSpy.mock.calls).toMatchSnapshot('error')
    expect(mockedSqip).not.toHaveBeenCalled()
  })

  it('passes all given args to library', async () => {
    process.argv = [
      '',
      '',
      '-p',
      'primitive',
      'blur',
      'svgo',
      '-i',
      'mocked-image.jpg',
      '-o',
      '/tmp/mocked-image.svg'
    ]

    await sqipCLI()

    expect(errorSpy).not.toHaveBeenCalled()
    expect(mockedSqip).toHaveBeenCalled()
    expect(mockedSqip.mock.calls).toMatchSnapshot()
  })

  it('parses plugin-specific options from CLI args', async () => {
    process.argv = [
      '',
      '',
      '-i',
      'mocked-image.jpg',
      '--mocked-mocked-plugin-option'
    ]

    await sqipCLI()

    expect(mockedSqip).toHaveBeenCalled()
    const callArgs = mockedSqip.mock.calls[0][0]
    const mockedPlugin = callArgs.plugins?.find(
      (p: { name: string }) => p.name === 'mocked'
    ) as { name: string; options: Record<string, unknown> } | undefined
    expect(mockedPlugin).toBeDefined()
    expect(mockedPlugin?.options).toEqual({ 'mocked-plugin-option': true })
  })

  it('handles resolvePlugins errors gracefully', async () => {
    mockedResolvePlugins.mockRejectedValueOnce(new Error('plugin not found'))
    process.argv = ['', '', '-i', 'mocked-image.jpg']

    // process.exit is mocked so execution continues past the catch block,
    // causing a secondary TypeError. We only care that the error was reported.
    await sqipCLI().catch(() => {})

    expect(errorSpy).toHaveBeenCalled()
    expect(proccessExitSpy).toHaveBeenCalledWith(1)
  })

  it('handles sqip errors gracefully', async () => {
    mockedSqip.mockRejectedValueOnce(new Error('test error'))
    process.argv = ['', '', '-i', 'mocked-image.jpg']

    await sqipCLI()

    expect(errorSpy).toHaveBeenCalled()
    expect(proccessExitSpy).toHaveBeenCalledWith(1)
  })

  describe('stdin support', () => {
    const fakeImageBuffer = Buffer.from('fake-image-data')

    const originalToArray = process.stdin.toArray

    afterEach(() => {
      process.stdin.toArray = originalToArray
    })

    function mockStdin(data: Buffer) {
      mockedFstatSync.mockReturnValue({ isFIFO: () => true } as ReturnType<typeof fstatSync>)
      process.stdin.toArray = (() => Promise.resolve([data])) as typeof process.stdin.toArray
    }

    it('reads input from stdin when no --input flag', async () => {
      mockStdin(fakeImageBuffer)
      process.argv = ['', '', '-p', 'mocked']

      await sqipCLI()

      expect(mockedSqip).toHaveBeenCalled()
      const callArgs = mockedSqip.mock.calls[0][0]
      expect(Buffer.isBuffer(callArgs.input)).toBe(true)
      expect(callArgs.input).toEqual(fakeImageBuffer)
    })

    it('--input flag takes precedence over stdin', async () => {
      mockStdin(fakeImageBuffer)
      process.argv = ['', '', '-i', 'mocked-image.jpg', '-p', 'mocked']

      await sqipCLI()

      expect(mockedSqip).toHaveBeenCalled()
      const callArgs = mockedSqip.mock.calls[0][0]
      expect(callArgs.input).toBe('mocked-image.jpg')
    })

    it('defaults print to true for stdin input', async () => {
      mockStdin(fakeImageBuffer)
      process.argv = ['', '', '-p', 'mocked']

      await sqipCLI()

      expect(mockedSqip).toHaveBeenCalled()
      const callArgs = mockedSqip.mock.calls[0][0]
      expect(callArgs.print).toBe(true)
    })

    it('does not set output when input is from stdin', async () => {
      mockStdin(fakeImageBuffer)
      process.argv = ['', '', '-p', 'mocked']

      await sqipCLI()

      expect(mockedSqip).toHaveBeenCalled()
      const callArgs = mockedSqip.mock.calls[0][0]
      expect(callArgs.output).toBeUndefined()
    })

    it('sets outputFileName to stdin for stdin input', async () => {
      mockStdin(fakeImageBuffer)
      process.argv = ['', '', '-p', 'mocked']

      await sqipCLI()

      expect(mockedSqip).toHaveBeenCalled()
      const callArgs = mockedSqip.mock.calls[0][0]
      expect(callArgs.outputFileName).toBe('stdin')
    })

    it('respects -o flag with stdin input', async () => {
      mockStdin(fakeImageBuffer)
      process.argv = ['', '', '-p', 'mocked', '-o', '/tmp/out.svg']

      await sqipCLI()

      expect(mockedSqip).toHaveBeenCalled()
      const callArgs = mockedSqip.mock.calls[0][0]
      expect(callArgs.output).toBe('/tmp/out.svg')
    })

    it('defaults silent to true for stdin input', async () => {
      mockStdin(fakeImageBuffer)
      process.argv = ['', '', '-p', 'mocked']

      await sqipCLI()

      expect(mockedSqip).toHaveBeenCalled()
      const callArgs = mockedSqip.mock.calls[0][0]
      expect(callArgs.silent).toBe(true)
    })
  })
})
