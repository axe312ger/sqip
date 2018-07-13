import sqip from '../../src'

jest.mock('../../src/utils/helpers.js', () => ({
  encodeBase64: jest.fn(() => 'base64EncodedSVG'),
  getDimensions: jest.fn(() => ({ width: 1024, height: 768 })),
  printFinalResult: jest.fn()
}))

jest.mock('../../src/utils/primitive.js', () => ({
  runPrimitive: jest.fn(() => 'primitiveResult'),
  checkForPrimitive: jest.fn()
}))

jest.mock('../../src/utils/svg.js', () => ({
  runSVGO: jest.fn(() => 'svgoResult'),
  prepareSVG: jest.fn(() => 'preparedSVGResult'),
  applyBlurFilter: jest.fn(() => 'blurredSVGResult')
}))

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
})
