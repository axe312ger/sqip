import { sqip, resolvePlugins } from 'sqip'
import sqipCLI from '../../src/sqip-cli'

import semver from 'semver'

jest.mock('sqip', () => ({
  __esModule: true,
  sqip: jest.fn(async () => []),
  resolvePlugins: jest.fn(() => [
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

const mockedSqip = sqip as jest.MockedFunction<typeof sqip>
const mockedResolvePlugins = resolvePlugins as jest.MockedFunction<
  typeof resolvePlugins
>

const logSpy = jest.spyOn(global.console, 'log').mockImplementation(() => null)
const errorSpy = jest
  .spyOn(global.console, 'error')
  .mockImplementation(() => null)

const proccessExitSpy = jest.spyOn(process, 'exit').mockImplementation()

describe('sqip-plugin-cli', () => {
  afterEach(() => {
    logSpy.mockClear()
    errorSpy.mockClear()
    proccessExitSpy.mockClear()
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
    expect(errorSpy).toBeCalledWith(
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
})
