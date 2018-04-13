const path = require('path')

const childProcessMock = require('child_process')
const fsMock = require('fs')
const osMock = require('os')

const {
  checkForPrimitive,
  runPrimitive
} = require('../../../src/utils/primitive')

jest.mock('child_process', () => ({
  execSync: jest.fn(),
  execFileSync: jest.fn()
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(() => 'primitiveResult')
}))

jest.mock('os', () => ({
  platform: jest.fn(() => 'unknownOS'),
  arch: jest.fn(() => 'nonExistingArch'),
  tmpdir: jest.fn(() => '/path/to/output')
}))

const logSpy = jest.spyOn(global.console, 'log')

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
    childProcessMock.execSync.mockClear()
    childProcessMock.execFileSync.mockClear()
    osMock.arch.mockClear()
    osMock.platform.mockClear()
    global.process.exit.mockClear()
    logSpy.mockClear()
  })
  afterAll(() => {
    global.process.exit = originalExit
  })
  test('bundled executable exists', () => {
    osMock.platform.mockImplementation(() => 'linux')
    osMock.arch.mockImplementation(() => 'x64')
    fsMock.existsSync.mockImplementationOnce(() => true)
    expect(checkForPrimitive).not.toThrow()
    expect(global.process.exit).not.toBeCalled()
    expect(childProcessMock.execSync).not.toBeCalled()
    expect(logSpy).not.toBeCalled()
  })
  test('uses where for windows, type for POSIX', () => {
    osMock.platform.mockImplementation(() => 'win32')
    expect(checkForPrimitive).not.toThrow()
    expect(childProcessMock.execSync).toBeCalledWith('where primitive')

    osMock.platform.mockImplementation(() => 'linux')
    expect(checkForPrimitive).not.toThrow()
    expect(childProcessMock.execSync).toBeCalledWith('type primitive')
  })
  test('bundled executable does not exist but primitive is globally installed', () => {
    expect(checkForPrimitive).not.toThrow()
    expect(global.process.exit).not.toBeCalled()
    expect(logSpy).not.toBeCalled()
  })
  test('bundled executable does not exist, primitive not installed globally', () => {
    childProcessMock.execSync.mockImplementationOnce(() => {
      throw new Error('not installed')
    })
    expect(checkForPrimitive).not.toThrow()
    expect(global.process.exit).toBeCalled()
    expect(logSpy).toBeCalledWith(
      'Please ensure that Primitive (https://github.com/fogleman/primitive, written in Golang) is installed and globally available'
    )
  })
  test('bundled executable does not exist, primitive not installed globally, given shouldThrow true', () => {
    childProcessMock.execSync.mockImplementationOnce(() => {
      throw new Error('not installed')
    })
    expect(() => checkForPrimitive(true)).toThrowErrorMatchingSnapshot()
    expect(global.process.exit).not.toBeCalled()
    expect(logSpy).not.toBeCalled()
  })
})

describe('runPrimitive', () => {
  let config, dimensions
  const inputFile = '/path/to/input/file.jpg'

  beforeEach(() => {
    config = {}
    dimensions = {
      width: 100,
      height: 200
    }
  })

  afterEach(() => {
    childProcessMock.execFileSync.mockClear()
  })

  test('executes primitive with default config', () => {
    runPrimitive(inputFile, config, dimensions)
    expect(childProcessMock.execFileSync.mock.calls).toHaveLength(1)
    expect(childProcessMock.execFileSync.mock.calls[0]).toHaveLength(2)
    childProcessMock.execFileSync.mock.calls[0][0] = childProcessMock.execFileSync.mock.calls[0][0].replace(
      VENDOR_DIR,
      '/VENDOR/DIR'
    )
    expect(childProcessMock.execFileSync.mock.calls[0]).toMatchSnapshot()
  })

  test('executes primitive with custom config, applying default number of primitives', () => {
    config = {
      mode: 5
    }
    runPrimitive(inputFile, config, dimensions)
    expect(childProcessMock.execFileSync.mock.calls).toHaveLength(1)
    expect(childProcessMock.execFileSync.mock.calls[0]).toHaveLength(2)
    childProcessMock.execFileSync.mock.calls[0][0] = childProcessMock.execFileSync.mock.calls[0][0].replace(
      VENDOR_DIR,
      '/VENDOR/DIR'
    )
    expect(childProcessMock.execFileSync.mock.calls[0]).toMatchSnapshot()
  })

  test('executes primitive with landscape dimensions', () => {
    dimensions = {
      width: 600,
      height: 300
    }
    runPrimitive(inputFile, config, dimensions)
    expect(childProcessMock.execFileSync.mock.calls).toHaveLength(1)
    expect(childProcessMock.execFileSync.mock.calls[0]).toHaveLength(2)
    childProcessMock.execFileSync.mock.calls[0][0] = childProcessMock.execFileSync.mock.calls[0][0].replace(
      VENDOR_DIR,
      '/VENDOR/DIR'
    )
    expect(childProcessMock.execFileSync.mock.calls[0]).toMatchSnapshot()
  })
})
