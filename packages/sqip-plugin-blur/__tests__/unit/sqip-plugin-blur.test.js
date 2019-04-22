import SvgPlugin from '../../src/sqip-plugin-blur'

const sampleNoViewBox =
  '<svg><rect fill="#bada55"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
const sampleNoBg =
  '<svg viewBox="0 0 1024 768"><path fill="#bada55" d="M0 0h1024v640H0z"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
const sampleWithGroup =
  '<svg viewBox="0 0 1024 768"><rect fill="#bada55"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
const sampleWithoutGroup =
  '<svg viewBox="0 0 1024 768"><rect fill="#bada55"/><polygon points="0,100 50,25 50,75 100,0" /></svg>'

describe('does prepare svg properly', () => {
  const svgPlugin = new SvgPlugin({})
  test('svg without viewport, not given width & height', () => {
    expect(() =>
      svgPlugin.prepareSVG(sampleNoViewBox, {})
    ).toThrowErrorMatchingSnapshot()
  })
  test('svg without viewport, given width & height', () => {
    const svgPlugin = new SvgPlugin({
      dimensions: {
        width: 1024,
        height: 640
      }
    })
    const result = svgPlugin.prepareSVG(sampleNoViewBox)
    expect(result).toMatchSnapshot()
  })
  test('svg with group, with config', () => {
    const svgPlugin = new SvgPlugin({
      dimensions: {
        width: 1024,
        height: 640
      }
    })
    const result = svgPlugin.prepareSVG(sampleWithGroup)
    expect(result).toMatchSnapshot()
  })
  test('svg without group, config with dimensions only', () => {
    const svgPlugin = new SvgPlugin({
      dimensions: {
        width: 1024,
        height: 640
      }
    })
    const result = svgPlugin.prepareSVG(sampleWithoutGroup)
    expect(result).toMatchSnapshot()
  })
  test('svg with missing background', () => {
    const svgPlugin = new SvgPlugin({
      dimensions: {
        width: 1024,
        height: 640
      }
    })
    expect(() =>
      svgPlugin.prepareSVG(sampleNoBg)
    ).toThrowErrorMatchingSnapshot()
  })
})

describe('applies blur filter', () => {
  test('do nothing when no blur is given', () => {
    const svgPlugin = new SvgPlugin({
      blur: 0
    })
    const result = svgPlugin.applyBlurFilter(sampleWithGroup)
    expect(result).toMatchSnapshot()
  })
  test('svg with group and blur', () => {
    const svgPlugin = new SvgPlugin({
      blur: 5
    })
    const result = svgPlugin.applyBlurFilter(sampleWithGroup)
    expect(result).toMatchSnapshot()
  })
  test('svg without group and blur', () => {
    const svgPlugin = new SvgPlugin({
      blur: 5
    })
    const result = svgPlugin.applyBlurFilter(sampleWithoutGroup)
    expect(result).toMatchSnapshot()
  })
})
