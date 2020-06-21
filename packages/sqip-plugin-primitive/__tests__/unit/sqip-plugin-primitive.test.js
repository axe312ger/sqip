import path from 'path'
import execaMock from 'execa'
import fsMock from 'fs-extra'
import osMock from 'os'

import PrimitivePlugin from '../../src/sqip-plugin-primitive'

jest.mock('execa')
jest.mock('fs-extra')

jest.mock('os', () => ({
  ...jest.requireActual('os'),
  platform: jest.fn(() => 'unknownOS'),
  arch: jest.fn(() => 'nonExistingArch'),
  cpus: () => 1
}))

const VENDOR_DIR = path.resolve(__dirname, '../../vendor')
let originalExit = null

describe('checkForPrimitive', () => {
  const primitivePlugin = new PrimitivePlugin({})

  beforeAll(() => {
    originalExit = global.process.exit
    global.process.exit = jest.fn()
  })

  beforeEach(() => {
    osMock.platform.mockImplementation(() => 'unknownOS')
    osMock.arch.mockImplementation(() => 'x64')
  })

  afterEach(() => {
    execaMock.mockReset()
    fsMock.exists.mockClear()
    osMock.arch.mockClear()
    osMock.platform.mockClear()
    global.process.exit.mockClear()
  })

  afterAll(() => {
    global.process.exit = originalExit
  })

  test('bundled executable exists', async () => {
    osMock.platform.mockImplementation(() => 'linux')
    fsMock.exists.mockImplementationOnce(() => true)

    await primitivePlugin.checkForPrimitive()

    expect(global.process.exit).not.toHaveBeenCalled()
    expect(execaMock).not.toHaveBeenCalled()
  })

  test('uses where for windows, type for POSIX', async () => {
    osMock.platform.mockImplementation(() => 'win32')
    await primitivePlugin.checkForPrimitive()
    expect(execaMock).toHaveBeenCalledWith('where', ['primitive'])
    expect(fsMock.exists.mock.calls[0][0]).toMatch(/\.exe$/)

    osMock.platform.mockImplementation(() => 'linux')
    await primitivePlugin.checkForPrimitive()
    expect(execaMock).toHaveBeenCalledWith('type', ['primitive'])
  })

  test('bundled executable does not exist but primitive is globally installed', async () => {
    await expect(primitivePlugin.checkForPrimitive()).resolves.toBeUndefined()
  })

  test('bundled executable does not exist, primitive not installed globally', async () => {
    execaMock.mockImplementationOnce(() => {
      throw new Error('not installed')
    })

    await expect(
      primitivePlugin.checkForPrimitive()
    ).rejects.toThrowErrorMatchingSnapshot()
  })
})

describe('runPrimitive', () => {
  let config, metadata
  const filePath = '/path/to/input/file.jpg'
  const fileContent = Buffer.from('mocked')

  beforeEach(() => {
    execaMock.mockResolvedValue({ stdout: {} })
    config = {}
    metadata = {
      width: 100,
      height: 200,
      type: 'jpg',
      palette: {
        DarkMuted: { getHex: () => '#123456' }
      }
    }
  })

  afterEach(() => {
    execaMock.mockReset()
  })

  test('executes primitive with default config', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: config,
      metadata,
      filePath
    })
    await primitivePlugin.apply(fileContent)
    expect(execaMock.mock.calls).toHaveLength(2)
    expect(execaMock.mock.calls[1]).toHaveLength(3)
    fixProcessArgumentsForSnapshot(execaMock)
    expect(execaMock.mock.calls[1]).toMatchSnapshot()
  })

  test('executes primitive with custom config, applying default number of primitives', async () => {
    config = {
      mode: 5
    }
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: config,
      metadata,
      filePath
    })
    await primitivePlugin.apply(fileContent)
    expect(execaMock.mock.calls).toHaveLength(2)
    expect(execaMock.mock.calls[1]).toHaveLength(3)
    fixProcessArgumentsForSnapshot(execaMock)
    expect(execaMock.mock.calls[1]).toMatchSnapshot()
  })

  test('executes primitive with landscape dimensions', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: config,
      metadata: { ...metadata, width: 600, height: 300 },
      filePath
    })
    await primitivePlugin.apply(fileContent)
    expect(execaMock.mock.calls).toHaveLength(2)
    expect(execaMock.mock.calls[1]).toHaveLength(3)
    fixProcessArgumentsForSnapshot(execaMock)
    expect(execaMock.mock.calls[1]).toMatchSnapshot()
  })

  test('allows avg as value for background', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: {
        background: 'avg'
      },
      metadata,
      filePath
    })
    await primitivePlugin.apply(fileContent)
    expect(execaMock.mock.calls).toHaveLength(2)
    expect(execaMock.mock.calls[1]).toHaveLength(3)
    fixProcessArgumentsForSnapshot(execaMock)
    expect(execaMock.mock.calls[1]).toMatchSnapshot()
  })

  test('allows hex as value for background', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: {
        background: '#654321'
      },
      metadata,
      filePath
    })
    await primitivePlugin.apply(fileContent)
    expect(execaMock.mock.calls).toHaveLength(2)
    expect(execaMock.mock.calls[1]).toHaveLength(3)
    fixProcessArgumentsForSnapshot(execaMock)
    expect(execaMock.mock.calls[1]).toMatchSnapshot()
  })
})

function fixProcessArgumentsForSnapshot(execaMock) {
  execaMock.mock.calls[1][0] = execaMock.mock.calls[1][0].replace(
    VENDOR_DIR,
    '/VENDOR/DIR'
  )
  execaMock.mock.calls[1][1] = execaMock.mock.calls[1][1].map((arg) => {
    if (typeof arg !== 'string') {
      return arg
    }
    return arg.replace(
      /primitive-tempfile-[0-9]+.svg/g,
      'primitive-tempfile.svg'
    )
  })
}
