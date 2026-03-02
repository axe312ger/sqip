import { vi, type MockedFunction } from 'vitest'
import { execa } from 'execa'
import fs from 'fs/promises'
import os from 'os'

import TrianglePlugin from '../../src/sqip-plugin-triangle'
import { SqipImageMetadata, mockedMetadata } from 'sqip'

const triangleMockedMetadata: SqipImageMetadata = {
  ...mockedMetadata,
  type: 'pixel'
}

vi.mock('execa')
vi.mock('fs/promises')
vi.mock('os', async () => {
  const actual = await vi.importActual<typeof os>('os')
  return {
    ...actual,
    default: {
      ...actual,
      platform: vi.fn(() => 'unknownOS'),
      arch: vi.fn(() => 'nonExistingArch'),
      cpus: () => [1]
    },
    platform: vi.fn(() => 'unknownOS'),
    arch: vi.fn(() => 'nonExistingArch'),
    cpus: () => [1]
  }
})

const mockedExeca = execa as unknown as MockedFunction<typeof execa>
mockedExeca.mockImplementation((() => {
  return {
    stdout:
      '<svg viewBox="0 0 1024 768"><path fill="#fff" d="M300,188 L0,188 L174,146 L300,188"/></svg>'
  }
}) as any)

const mockedFsAccess = fs.access as MockedFunction<typeof fs.access>

const mockedFsReadFile = fs.readFile as MockedFunction<typeof fs.readFile>
mockedFsReadFile.mockImplementation(() =>
  Promise.resolve(
    Buffer.from(
      '<svg viewBox="0 0 1024 768"><path fill="#fff" d="M300,188 L0,188 L174,146 L300,188"/></svg>'
    )
  )
)

mockedFsAccess.mockImplementation(async () =>
  Promise.reject(new Error('Mocked: Binary not available'))
)
const mockedOsArch = os.arch as MockedFunction<typeof os.arch>
const mockedOsPlatform = os.platform as MockedFunction<typeof os.platform>

const proccessExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['triangle']
}

describe('checkForTriangle', () => {
  const trianglePlugin = new TrianglePlugin({
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

    await trianglePlugin.checkForTriangle()

    expect(global.process.exit).not.toHaveBeenCalled()
    expect(mockedExeca).not.toHaveBeenCalled()
  })

  test('uses where for windows, type for POSIX', async () => {
    mockedOsPlatform.mockImplementationOnce(() => 'win32')
    await trianglePlugin.checkForTriangle()
    expect(mockedExeca).toHaveBeenCalledWith('where', ['triangle'])
    expect(mockedFsAccess.mock.calls[0][0]).toMatch(/\.exe$/)

    mockedOsPlatform.mockImplementationOnce(() => 'linux')
    await trianglePlugin.checkForTriangle()
    expect(mockedExeca).toHaveBeenCalledWith('type', ['triangle'])
  })

  test('bundled executable does not exist but triangle is globally installed', async () => {
    await expect(trianglePlugin.checkForTriangle()).resolves.toBeUndefined()
  })

  test('bundled executable does not exist, triangle not installed globally', async () => {
    mockedExeca.mockImplementationOnce(() => {
      throw new Error('not installed')
    })

    await expect(
      trianglePlugin.checkForTriangle()
    ).rejects.toThrowErrorMatchingSnapshot()
  })
})

describe('runTriangle', () => {
  // Source: https://www.mjt.me.uk/posts/smallest-png/
  const fileContent = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEW10NBjBBbqAAAAH0lEQVRoge3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAvg0hAAABmmDh1QAAAABJRU5ErkJggg==',
    'base64'
  )

  afterEach(() => {
    mockedExeca.mockClear()
  })

  test('executes triangle with default config', async () => {
    const trianglePlugin = new TrianglePlugin({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    await trianglePlugin.apply(fileContent, { ...triangleMockedMetadata })
    expect(mockedExeca.mock.calls).toHaveLength(2)
    expect(mockedExeca.mock.calls[1]).toHaveLength(2)
    const args = (mockedExeca.mock.calls[1][1] as string[]) || []
    args[1] = 'mocked'
    args[args.length - 1] = 'mocked'
    expect(args).toMatchSnapshot()
  })

  test('executes triangle with custom config, applying default number of triangles', async () => {
    const trianglePlugin = new TrianglePlugin({
      pluginOptions: { nf: 1 },
      options: {},

      sqipConfig: mockedConfig
    })
    await trianglePlugin.apply(fileContent, { ...triangleMockedMetadata })
    expect(mockedExeca.mock.calls).toHaveLength(2)
    expect(mockedExeca.mock.calls[1]).toHaveLength(2)
    const args = (mockedExeca.mock.calls[1][1] as string[]) || []
    args[1] = 'mocked'
    args[args.length - 1] = 'mocked'
    expect(args).toMatchSnapshot()
  })

  test('executes triangle with landscape dimensions', async () => {
    const trianglePlugin = new TrianglePlugin({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    await trianglePlugin.apply(fileContent, {
      ...triangleMockedMetadata,
      width: 600,
      height: 300
    })
    expect(mockedExeca.mock.calls).toHaveLength(2)
    expect(mockedExeca.mock.calls[1]).toHaveLength(2)
    const args = (mockedExeca.mock.calls[1][1] as string[]) || []
    args[1] = 'mocked'
    args[args.length - 1] = 'mocked'
    expect(args).toMatchSnapshot()
  })

  test('allows hex as value for background', async () => {
    const trianglePlugin = new TrianglePlugin({
      pluginOptions: {
        bg: '#654321'
      },
      options: {},
      sqipConfig: mockedConfig
    })
    await trianglePlugin.apply(fileContent, { ...triangleMockedMetadata })
    expect(mockedExeca.mock.calls).toHaveLength(2)
    expect(mockedExeca.mock.calls[1]).toHaveLength(2)
    const args = (mockedExeca.mock.calls[1][1] as string[]) || []
    args[1] = 'mocked'
    args[args.length - 1] = 'mocked'
    expect(args).toMatchSnapshot()
  })
})

test('cliOptions returns array of option definitions', () => {
  expect(Array.isArray(TrianglePlugin.cliOptions)).toBe(true)
  expect(TrianglePlugin.cliOptions.length).toBeGreaterThan(0)
})

test('throws when input is svg', async () => {
  const plugin = new TrianglePlugin({
    pluginOptions: {},
    options: {},
    sqipConfig: mockedConfig
  })
  const svgMetadata: SqipImageMetadata = { ...triangleMockedMetadata, type: 'svg' }
  await expect(
    plugin.apply(Buffer.from('test'), svgMetadata)
  ).rejects.toThrow('raster image')
})
