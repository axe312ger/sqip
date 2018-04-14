const SVGO = require('svgo')

const {
  runSVGO,
  prepareSVG,
  applyBlurFilter
} = require('../../../src/utils/svg')

jest.mock('svgo')

test('runSVGO', () => {
  const inputSVG = '<svg />'
  runSVGO(inputSVG)
  expect(SVGO).toHaveBeenCalledTimes(1)
  expect(SVGO).toHaveBeenLastCalledWith({ multipass: true, floatPrecision: 1 })
  expect(SVGO.mock.instances[0].optimize).toHaveBeenCalledTimes(1)
  expect(SVGO.mock.instances[0].optimize.mock.calls[0][0]).toBe(inputSVG)
  // @todo switch to async svgo, this will allow proper testing
})

const sampleNoViewBox =
  '<svg><rect fill="#bada55"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
const sampleNoBg =
  '<svg viewBox="0 0 1024 768"><path fill="#bada55" d="M0 0h1024v640H0z"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
const sampleWithGroup =
  '<svg viewBox="0 0 1024 768"><rect fill="#bada55"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
const sampleWithoutGroup =
  '<svg viewBox="0 0 1024 768"><rect fill="#bada55"/><polygon points="0,100 50,25 50,75 100,0" /></svg>'

describe('does prepare svg properly', () => {
  test('svg without viewport, not given width & height', () => {
    expect(() => prepareSVG(sampleNoViewBox, {})).toThrowErrorMatchingSnapshot()
  })
  test('svg without viewport, given width & height', () => {
    const result = prepareSVG(sampleNoViewBox, { width: 1024, height: 640 })
    expect(result).toMatchSnapshot()
  })
  test('svg with group, with config', () => {
    const result = prepareSVG(sampleWithGroup, { width: 1024, height: 640 })
    expect(result).toMatchSnapshot()
  })
  test('svg without group, config with dimensions only', () => {
    const result = prepareSVG(sampleWithoutGroup, {
      width: 1024,
      height: 640
    })
    expect(result).toMatchSnapshot()
  })
  test('svg with missing background', () => {
    expect(() =>
      prepareSVG(sampleNoBg, {
        width: 1024,
        height: 640
      })
    ).toThrowErrorMatchingSnapshot()
  })
})

describe('applies blur filter', () => {
  test('do nothing when no blur is given', () => {
    const result = applyBlurFilter(sampleWithGroup, {
      blur: 0
    })
    expect(result).toMatchSnapshot()
  })
  test('svg with group and blur', () => {
    const result = applyBlurFilter(sampleWithGroup, {
      blur: 5
    })
    expect(result).toMatchSnapshot()
  })
  test('svg without group and blur', () => {
    const result = applyBlurFilter(sampleWithoutGroup, {
      blur: 5
    })
    expect(result).toMatchSnapshot()
  })
})
