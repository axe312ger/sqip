import execa, { ExecaChildProcess } from 'execa'
import fs from 'fs/promises'
import os from 'os'

import PrimitivePlugin from '../../src/sqip-plugin-primitive'
import { SqipImageMetadata, mockedMetadata } from 'sqip'

const sqipMockedMetadata: SqipImageMetadata = {
  ...mockedMetadata,
  type: 'pixel'
}

jest.mock('execa')
jest.mock('fs/promises')
jest.mock('os', () => ({
  ...(jest.requireActual('os') as typeof os),
  platform: jest.fn(() => 'unknownOS'),
  arch: jest.fn(() => 'nonExistingArch'),
  cpus: () => [1]
}))

const mockedExeca = execa as jest.MockedFunction<typeof execa>
mockedExeca.mockImplementation(() => {
  const result = {
    stdout:
      '<svg viewBox="0 0 1024 768"><rect fill="#bada5500"/><g></g></svg>'
  } as unknown as ExecaChildProcess<Buffer>
  return result
})

const mockedFsAccess = fs.access as jest.MockedFunction<typeof fs.access>

mockedFsAccess.mockImplementation(async () =>
  Promise.reject(new Error('Mocked: Binary not available'))
)
const mockedOsArch = os.arch as jest.MockedFunction<typeof os.arch>
const mockedOsPlatform = os.platform as jest.MockedFunction<typeof os.platform>

const proccessExitSpy = jest.spyOn(process, 'exit').mockImplementation()

const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['primitive']
}

describe('checkForPrimitive', () => {
  const primitivePlugin = new PrimitivePlugin({
    pluginOptions: {},
    options: {},
    sqipConfig: mockedConfig
  })

  afterEach(() => {
    mockedExeca.mockClear()
    mockedFsAccess.mockClear()
    mockedOsArch.mockClear()
    mockedOsPlatform.mockClear()
    proccessExitSpy.mockClear()
  })

  afterAll(() => {
    proccessExitSpy.mockReset()
  })

  test('bundled executable exists', async () => {
    mockedFsAccess.mockImplementationOnce(async () => Promise.resolve())

    await primitivePlugin.checkForPrimitive()

    expect(global.process.exit).not.toHaveBeenCalled()
    expect(mockedExeca).not.toHaveBeenCalled()
  })

  test('uses where for windows, type for POSIX', async () => {
    mockedOsPlatform.mockImplementationOnce(() => 'win32')
    await primitivePlugin.checkForPrimitive()
    expect(mockedExeca).toHaveBeenCalledWith('where', ['primitive'])
    expect(mockedFsAccess.mock.calls[0][0]).toMatch(/\.exe$/)

    mockedOsPlatform.mockImplementationOnce(() => 'linux')
    await primitivePlugin.checkForPrimitive()
    expect(mockedExeca).toHaveBeenCalledWith('type', ['primitive'])
  })

  test('bundled executable does not exist but primitive is globally installed', async () => {
    await expect(primitivePlugin.checkForPrimitive()).resolves.toBeUndefined()
  })

  test('bundled executable does not exist, primitive not installed globally', async () => {
    mockedExeca.mockImplementationOnce(() => {
      throw new Error('not installed')
    })

    await expect(
      primitivePlugin.checkForPrimitive()
    ).rejects.toThrowErrorMatchingSnapshot()
  })
})

describe('runPrimitive', () => {
  // A real PNG file, because the primitive plugin pipes the buffer through
  // sharp.
  //
  // Source: https://www.mjt.me.uk/posts/smallest-png/
  const fileContent = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEW10NBjBBbqAAAAH0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAvg0hAAABmmDh1QAAAABJRU5ErkJggg==',
    'base64'
  )

  afterEach(() => {
    mockedExeca.mockClear()
  })

  test('executes primitive with default config', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    await primitivePlugin.apply(fileContent, { ...sqipMockedMetadata })
    expect(mockedExeca.mock.calls).toHaveLength(2)
    expect(mockedExeca.mock.calls[1]).toHaveLength(3)
    expect(mockedExeca.mock.calls[1][1]).toMatchSnapshot()
  })

  test('executes primitive with custom config, applying default number of primitives', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: { mode: 5 },
      options: {},

      sqipConfig: mockedConfig
    })
    await primitivePlugin.apply(fileContent, { ...sqipMockedMetadata })
    expect(mockedExeca.mock.calls).toHaveLength(2)
    expect(mockedExeca.mock.calls[1]).toHaveLength(3)
    expect(mockedExeca.mock.calls[1][1]).toMatchSnapshot()
  })

  test('executes primitive with landscape dimensions', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    await primitivePlugin.apply(fileContent, {
      ...sqipMockedMetadata,
      width: 600,
      height: 300
    })
    expect(mockedExeca.mock.calls).toHaveLength(2)
    expect(mockedExeca.mock.calls[1]).toHaveLength(3)
    expect(mockedExeca.mock.calls[1][1]).toMatchSnapshot()
  })

  test('allows avg as value for background', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: {
        background: 'avg'
      },
      options: {},
      sqipConfig: mockedConfig
    })
    await primitivePlugin.apply(fileContent, { ...sqipMockedMetadata })
    expect(mockedExeca.mock.calls).toHaveLength(2)
    expect(mockedExeca.mock.calls[1]).toHaveLength(3)
    expect(mockedExeca.mock.calls[1][1]).toMatchSnapshot()
  })

  test('allows hex as value for background', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: {
        background: '#654321'
      },
      options: {},
      sqipConfig: mockedConfig
    })
    await primitivePlugin.apply(fileContent, { ...sqipMockedMetadata })
    expect(mockedExeca.mock.calls).toHaveLength(2)
    expect(mockedExeca.mock.calls[1]).toHaveLength(3)
    expect(mockedExeca.mock.calls[1][1]).toMatchSnapshot()
  })

  test('removes background rectangle when using fully transparent background', async () => {
    const primitivePlugin = new PrimitivePlugin({
      pluginOptions: {
        background: '#bada5500'
      },
      options: {},
      sqipConfig: mockedConfig
    })
    const res = await primitivePlugin.apply(fileContent, {
      ...sqipMockedMetadata
    })
    expect(res.toString()).toMatchSnapshot()
  })
})
