import path from 'path'
import execaMock from 'execa'
import fsMock from 'fs-extra'
import osMock from 'os'

import { checkForPrimitive, runPrimitive } from '../../../src/utils/primitive'

jest.mock('execa')

jest.mock('fs-extra')

jest.mock('os', () => ({
  platform: jest.fn(() => 'unknownOS'),
  arch: jest.fn(() => 'nonExistingArch')
}))

const VENDOR_DIR = path.resolve(__dirname, '../../../vendor')
let originalExit = null

describe('checkForPrimitive', () => {
  beforeAll(() => {
    originalExit = global.process.exit
    global.process.exit = jest.fn()
  })

  beforeEach(() => {
    osMock.arch.mockImplementation(() => 'unknownOS')
    osMock.platform.mockImplementation(() => 'nonExistingArch')
  })

  afterEach(() => {
    execaMock.mockReset()
    osMock.arch.mockClear()
    osMock.platform.mockClear()
    global.process.exit.mockClear()
  })

  afterAll(() => {
    global.process.exit = originalExit
  })

  test('bundled executable exists', async () => {
    osMock.platform.mockImplementation(() => 'linux')
    osMock.arch.mockImplementation(() => 'x64')
    fsMock.exists.mockImplementationOnce(() => true)

    await checkForPrimitive()

    expect(global.process.exit).not.toBeCalled()
    expect(execaMock).not.toBeCalled()
  })

  test('uses where for windows, type for POSIX', async () => {
    osMock.platform.mockImplementation(() => 'win32')
    await checkForPrimitive()
    expect(execaMock).toBeCalledWith('where', ['primitive'])

    osMock.platform.mockImplementation(() => 'linux')
    await checkForPrimitive()
    expect(execaMock).toBeCalledWith('type', ['primitive'])
  })

  test('bundled executable does not exist but primitive is globally installed', async () => {
    await expect(checkForPrimitive()).resolves.toBeUndefined()
  })

  test('bundled executable does not exist, primitive not installed globally', async () => {
    execaMock.mockImplementationOnce(() => {
      throw new Error('not installed')
    })

    await expect(checkForPrimitive()).rejects.toThrowErrorMatchingSnapshot()
  })
})

describe('runPrimitive', () => {
  let config, dimensions
  const inputFile = '/path/to/input/file.jpg'

  beforeEach(() => {
    execaMock.mockResolvedValue({ stdout: {} })
    config = {}
    dimensions = {
      width: 100,
      height: 200
    }
  })

  afterEach(() => {
    execaMock.mockReset()
  })

  test('executes primitive with default config', async () => {
    await runPrimitive(inputFile, config, dimensions)
    expect(execaMock.mock.calls).toHaveLength(1)
    expect(execaMock.mock.calls[0]).toHaveLength(2)
    fixProcessArgumentsForSnapshot(execaMock)
    expect(execaMock.mock.calls[0]).toMatchSnapshot()
  })

  test('executes primitive with custom config, applying default number of primitives', async () => {
    config = {
      mode: 5
    }
    await runPrimitive(inputFile, config, dimensions)
    expect(execaMock.mock.calls).toHaveLength(1)
    expect(execaMock.mock.calls[0]).toHaveLength(2)
    fixProcessArgumentsForSnapshot(execaMock)
    expect(execaMock.mock.calls[0]).toMatchSnapshot()
  })

  test('executes primitive with landscape dimensions', async () => {
    dimensions = {
      width: 600,
      height: 300
    }
    await runPrimitive(inputFile, config, dimensions)
    expect(execaMock.mock.calls).toHaveLength(1)
    expect(execaMock.mock.calls[0]).toHaveLength(2)
    fixProcessArgumentsForSnapshot(execaMock)
    expect(execaMock.mock.calls[0]).toMatchSnapshot()
  })
})

function fixProcessArgumentsForSnapshot(execaMock) {
  execaMock.mock.calls[0][0] = execaMock.mock.calls[0][0].replace(
    VENDOR_DIR,
    '/VENDOR/DIR'
  )
  execaMock.mock.calls[0][1] = execaMock.mock.calls[0][1].map(arg => {
    if (typeof arg !== 'string') {
      return arg
    }
    return arg.replace(
      /primitive-tempfile-[0-9]+.svg/g,
      'primitive-tempfile.svg'
    )
  })
}
