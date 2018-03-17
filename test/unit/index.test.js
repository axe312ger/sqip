const { node: sqip } = require('../../src/index')

const { runPrimitive } = require('../../src/utils/primitive.js')

jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'primitiveResult')
}))

jest.mock('../../src/utils/helpers.js', () => ({
  encodeBase64: jest.fn(() => 'base64EncodedSVG'),
  getDimensions: jest.fn(() => ({ width: 1024, height: 768 }))
}))

jest.mock('../../src/utils/primitive.js', () => ({
  runPrimitive: jest.fn(() => 'primitiveResult'),
  checkForPrimitive: jest.fn()
}))

jest.mock('../../src/utils/svg.js', () => ({
  runSVGO: jest.fn(() => 'svgoResult'),
  replaceSVGAttrs: jest.fn(() => 'fixedSVGResult')
}))

describe('node api', () => {
  const filename = '/path/to/input/image.jpg'

  test('no config passed', () => {
    expect(sqip).toThrowErrorMatchingSnapshot()
  })

  test('empty config passed', () => {
    expect(() => sqip({})).toThrowErrorMatchingSnapshot()
  })

  test('filename only', () => {
    const result = sqip({ filename })
    expect(result).toMatchSnapshot()
  })
})
