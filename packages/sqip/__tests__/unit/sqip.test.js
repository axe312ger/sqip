import fs from 'fs-extra'
import { resolve } from 'path'
import { tmpdir } from 'os'

import sqip from '../../src/sqip'
import primitive from 'sqip-plugin-primitive'
import blur from 'sqip-plugin-blur'
import svgo from 'sqip-plugin-svgo'

jest.mock('../../src/helpers', () => ({
  getDimensions: jest.fn(() => ({ width: 1024, height: 768 }))
}))
jest.mock('sqip-plugin-primitive')
jest.mock('sqip-plugin-blur')
jest.mock('sqip-plugin-svgo')

const FILE_NOT_EXIST = '/this/file/does/not/exist.jpg'
const FILE_DEMO_BEACH = resolve(
  __dirname,
  '../../../..',
  'demo',
  'public',
  'original',
  'beach.jpg'
)

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
    await expect(
      sqip({ input: FILE_NOT_EXIST })
    ).rejects.toThrowErrorMatchingSnapshot()
  })

  test('resolves valid input path', async () => {
    await expect(sqip({ input: FILE_DEMO_BEACH })).resolves.toMatchSnapshot()
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
      await expect(
        sqip({ input: FILE_DEMO_BEACH, output })
      ).resolves.toMatchSnapshot()
    })
  })

  test('throws nicely when plugin not found', async () => {
    await expect(
      sqip({ input: FILE_DEMO_BEACH, plugins: ['i-dont-exist'] })
    ).rejects.toThrowErrorMatchingSnapshot()
  })
})
