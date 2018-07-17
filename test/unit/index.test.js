import fs from 'fs-extra'
import { resolve } from 'path'
import { tmpdir } from 'os'

import sqip from '../../src'
import primitive from '../../src/plugins/primitive.js'
import svg from '../../src/plugins/svg.js'
import svgo from '../../src/plugins/svgo.js'

jest.mock('../../src/utils/helpers.js', () => ({
  encodeBase64: jest.fn(() => 'base64EncodedSVG'),
  getDimensions: jest.fn(() => ({ width: 1024, height: 768 })),
  printFinalResult: jest.fn()
}))
jest.mock('../../src/plugins/primitive.js')
jest.mock('../../src/plugins/svg.js')
jest.mock('../../src/plugins/svgo.js')

primitive.mockImplementation(function primitiveMock() {
  return {
    apply: jest.fn(() => 'primitiveResult'),
    checkForPrimitive: jest.fn()
  }
})

svg.mockImplementation(function svgMock() {
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
    const input = `${__dirname}/../../demo/beach.jpg`
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
      const input = `${__dirname}/../../demo/beach.jpg`

      await expect(sqip({ input, output })).resolves.toMatchSnapshot()
    })
  })
})
