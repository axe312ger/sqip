import { resolve } from 'path'
import { tmpdir } from 'os'

import fs from 'fs-extra'

import sqip from '../../src/sqip'
import primitive from 'sqip-plugin-primitive'
import blur from 'sqip-plugin-blur'
import svgo from 'sqip-plugin-svgo'
import datauri from 'sqip-plugin-data-uri'

const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['pixels']
}

const FILE_NOT_EXIST = '/this/file/does/not/exist.jpg'
const FILE_DEMO_BEACH = resolve(
  __dirname,
  '../../../..',
  '__tests__',
  'fixtures',
  'beach.jpg'
)
const EXAMPLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" stroke="#000" stroke-width="3"/></svg>'

const logSpy = jest.spyOn(global.console, 'log')
const errorSpy = jest.spyOn(global.console, 'error')

jest.mock('sqip-plugin-primitive')
jest.mock('sqip-plugin-blur')
jest.mock('sqip-plugin-svgo')
jest.mock('sqip-plugin-data-uri')

primitive.mockImplementation(function primitiveMock() {
  return {
    apply: jest.fn(() => Buffer.from(EXAMPLE_SVG)),
    checkForPrimitive: jest.fn()
  }
})

blur.mockImplementation(function blurMock() {
  return {
    apply: jest.fn(() => Buffer.from(EXAMPLE_SVG))
  }
})

svgo.mockImplementation(function svgoMock() {
  return {
    apply: jest.fn(() => Buffer.from(EXAMPLE_SVG))
  }
})

datauri.mockImplementation(function datauriMock({ metadata }) {
  return {
    apply: jest.fn(() => {
      metadata.dataURI = 'data:image/svg+xml,dataURI'
      metadata.dataURIBase64 = 'data:image/svg+xml;base64,dataURIBase64=='
      return Buffer.from(EXAMPLE_SVG)
    })
  }
})

function expectValidResult(result) {
  // Metadata has valid palette
  expect(Object.keys(result.metadata.palette).sort()).toStrictEqual(
    [
      'Vibrant',
      'LightVibrant',
      'DarkVibrant',
      'Muted',
      'LightMuted',
      'DarkMuted'
    ].sort()
  )
  expect(result.metadata.palette.Vibrant.constructor.name).toBe('Swatch')

  // Clean result from values that depend on OS and snapshot test it
  const jsonCompatibleResult = { ...result, metadata: { ...result.metadata } }
  jsonCompatibleResult.metadata.palette = 'mocked'
  jsonCompatibleResult.content = jsonCompatibleResult.content.toString()
  expect(jsonCompatibleResult).toMatchSnapshot()
}

describe('node api', () => {
  afterEach(() => {
    logSpy.mockClear()
    errorSpy.mockClear()
  })

  test('no config passed', async () => {
    await expect(sqip(mockedConfig)).rejects.toThrowErrorMatchingSnapshot()
  })

  test('empty config passed', async () => {
    await expect(sqip(mockedConfig)).rejects.toThrowErrorMatchingSnapshot()
  })

  test('invalid input path', async () => {
    await expect(
      sqip({ ...mockedConfig, input: FILE_NOT_EXIST })
    ).rejects.toThrowErrorMatchingSnapshot()
  })

  test('resolves valid input path', async () => {
    const result = await sqip({ ...mockedConfig, input: FILE_DEMO_BEACH })
    expectValidResult(result)
  })

  test('accepts buffers as input', async () => {
    const input = await fs.readFile(FILE_DEMO_BEACH)
    const result = await sqip({ ...mockedConfig, input })
    expectValidResult(result)
  })

  describe('output', () => {
    let output: string
    beforeAll(() => {
      output = resolve(tmpdir(), `sqip-index-test-${new Date().getTime()}.svg`)
    })

    afterAll(async () => {
      await fs.unlink(output)
    })

    test('outputs to file path', async () => {
      const result = await sqip({
        ...mockedConfig,
        input: FILE_DEMO_BEACH,
        output
      })
      expectValidResult(result)
    })
  })

  test('throws nicely when plugin not found', async () => {
    await expect(
      sqip({
        ...mockedConfig,
        input: FILE_DEMO_BEACH,
        plugins: ['i-dont-exist']
      })
    ).rejects.toThrowErrorMatchingSnapshot()
  })

  describe('width', () => {
    test('default resizes as expected', async () => {
      const result = await sqip({ ...mockedConfig, input: FILE_DEMO_BEACH })
      expect(result.metadata.width).toBe(300)
      expect(result.metadata.height).toBe(188)
    })

    test('custom resizes as expected', async () => {
      const result = await sqip({
        ...mockedConfig,
        input: FILE_DEMO_BEACH,
        width: 600
      })
      expect(result.metadata.width).toBe(600)
      expect(result.metadata.height).toBe(375)
    })

    test('value 0 falls back to original', async () => {
      const result = await sqip({ input: FILE_DEMO_BEACH, width: 0 })
      expect(result.metadata.width).toBe(1024)
      expect(result.metadata.height).toBe(640)
    })

    test('negative value falls back to original', async () => {
      const result = await sqip({ input: FILE_DEMO_BEACH, width: -1 })
      expect(result.metadata.width).toBe(1024)
      expect(result.metadata.height).toBe(640)
    })
  })

  describe('silent', () => {
    test('does not log by default on node', async () => {
      await sqip({ ...mockedConfig, input: FILE_DEMO_BEACH })
      expect(logSpy).not.toHaveBeenCalled()
    })
    test('does not log when enabled', async () => {
      await sqip({ ...mockedConfig, input: FILE_DEMO_BEACH, silent: true })
      expect(logSpy).not.toHaveBeenCalled()
    })
    test('logs when disabled', async () => {
      await sqip({ ...mockedConfig, input: FILE_DEMO_BEACH, silent: false })
      expect(logSpy).toHaveBeenCalled()
    })
  })
})
