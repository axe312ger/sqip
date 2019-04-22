import fs from 'fs-extra'
import { resolve } from 'path'
import { tmpdir } from 'os'

import sqip from '../../src/sqip'
import primitive from 'sqip-plugin-primitive'
import blur from 'sqip-plugin-blur'
import svgo from 'sqip-plugin-svgo'

jest.mock('../../src/helpers', () => ({
  encodeBase64: jest.fn(() => 'base64EncodedSVG'),
  getDimensions: jest.fn(() => ({ width: 1024, height: 768 })),
  printFinalResult: jest.fn()
}))
jest.mock('sqip-plugin-primitive')
jest.mock('sqip-plugin-blur')
jest.mock('sqip-plugin-svgo')

primitive.mockImplementation(function primitiveMock() {
  return {
    apply: jest.fn(() => 'primitiveResult'),
    checkForPrimitive: jest.fn()
  }
})

blur.mockImplementation(function svgMock() {
  return {
    apply: jest.fn(() => 'svgResult'),
    prepareSVG: jest.fn(() => 'preparedSVGResult'),
    applyBlurFilter: jest.fn(() => 'blurredSVGResult')
  }
})

svgo.mockImplementation(function svgoMock() {
  return {
    apply: jest.fn(() => 'svgoResult'),
    prepareSVG: jest.fn(() => 'preparedSVGResult'),
    applyBlurFilter: jest.fn(() => 'blurredSVGResult')
  }
})

describe('node api', () => {
  test('no config passed', async () => {
    await expect(sqip()).rejects.toThrowErrorMatchingSnapshot()
  })

  test('empty config passed', async () => {
    await expect(sqip({})).rejects.toThrowErrorMatchingSnapshot()
  })

  test('invalid input path', async () => {
    const input = '/this/file/does/not/exist.jpg'
    await expect(sqip({ input })).rejects.toThrowErrorMatchingSnapshot()
  })

  test('resolves valid input path', async () => {
    const input = `${__dirname}/../../../../demo/beach.jpg`
    await expect(sqip({ input })).resolves.toMatchSnapshot()
  })

  describe('output', () => {
    let output
    beforeAll(() => {
      output = resolve(tmpdir(), `sqip-index-test-${new Date().getTime()}.svg`)
    })

    afterAll(async () => {
      await fs.unlink(output)
    })

    test('outputs to file path', async () => {
      const input = `${__dirname}/../../../../demo/beach.jpg`

      await expect(sqip({ input, output })).resolves.toMatchSnapshot()
    })
  })
})
