import sqip from 'sqip'
import sqipCLI from '../../src/sqip-cli'

jest.mock('sqip', () => ({
  default: jest.fn(),
  resolvePlugins: jest.fn(plugins =>
    plugins.map(plugin => ({
      name: plugin,
      Plugin: { cliOptions: [] }
    }))
  )
}))

const logSpy = jest.spyOn(global.console, 'log').mockImplementation(() => {})
const errorSpy = jest
  .spyOn(global.console, 'error')
  .mockImplementation(() => {})

global.process.exit = jest.fn()

describe('sqip-plugin-cli', () => {
  afterEach(() => {
    logSpy.mockClear()
    errorSpy.mockClear()
    global.process.exit.mockClear()
  })

  afterAll(() => {
    logSpy.mockReset()
    errorSpy.mockReset()
    global.process.exit.mockReset()
  })

  it('no args: show help and require input option', async () => {
    await sqipCLI()

    expect(sqip.default).not.toHaveBeenCalled()
    expect(sqip.resolvePlugins.mock.calls).toMatchSnapshot('resolve')
    expect(logSpy.mock.calls).toMatchSnapshot('log')
    expect(errorSpy.mock.calls).toMatchSnapshot('error')
    expect(global.process.exit).toHaveBeenCalledWith(1)
  })

  it('--version: show version', async () => {
    process.argv = [null, null, '--version']

    await sqipCLI()

    expect(sqip.default).not.toHaveBeenCalled()
    expect(sqip.resolvePlugins.mock.calls).toMatchSnapshot('resolve')
    expect(logSpy.mock.calls).toMatchSnapshot('log')
    expect(errorSpy.mock.calls).toMatchSnapshot('error')
    expect(global.process.exit).toHaveBeenCalledWith(0)
  })

  it('--help: show help', async () => {
    process.argv = [null, null, '--help']

    await sqipCLI()

    expect(sqip.default).not.toHaveBeenCalled()
    expect(sqip.resolvePlugins.mock.calls).toMatchSnapshot('resolve')
    expect(logSpy.mock.calls).toMatchSnapshot('log')
    expect(errorSpy.mock.calls).toMatchSnapshot('error')
    expect(global.process.exit).toHaveBeenCalledWith(0)
  })
})
