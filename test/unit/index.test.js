const sqip = require('../../src/index')

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
  test('no config passed', () => {
    expect(sqip).toThrowErrorMatchingSnapshot()
  })

  test('empty config passed', () => {
    expect(() => sqip({})).toThrowErrorMatchingSnapshot()
  })

  test('invalid input path', () => {
    const input = '/this/file/does/not/exist.jpg'
    expect(() => sqip({ input })).toThrowErrorMatchingSnapshot()
  })
  test('resolves valid input path', () => {
    const input = `${__dirname}/../../demo/beach.jpg`
    const result = sqip({ input })
    expect(result).toMatchSnapshot()
  })
})
