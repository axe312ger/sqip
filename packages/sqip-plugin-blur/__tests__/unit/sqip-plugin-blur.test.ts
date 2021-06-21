import SvgPlugin from '../../src/sqip-plugin-blur'

import { Swatch } from '@vibrant/color'

const mockedMetadata = {
  width: 1024,
  height: 640,
  type: 'svg',
  originalHeight: 1024,
  originalWidth: 640,
  palette: {
    DarkMuted: new Swatch([4, 2, 0], 420),
    DarkVibrant: new Swatch([4, 2, 1], 421),
    LightMuted: new Swatch([4, 2, 2], 422),
    LightVibrant: new Swatch([4, 2, 3], 423),
    Muted: new Swatch([4, 2, 4], 424),
    Vibrant: new Swatch([4, 2, 5], 425)
  }
}
const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['pixels']
}

const sampleNoViewBox =
  '<svg><rect fill="#bada55"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
const sampleNoBg =
  '<svg viewBox="0 0 1024 768"><path fill="#bada55" d="M0 0h1024v640H0z"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
const sampleWithGroup =
  '<svg viewBox="0 0 1024 768"><rect fill="#bada55"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
const sampleWithoutGroup =
  '<svg viewBox="0 0 1024 768"><rect fill="#bada55"/><polygon points="0,100 50,25 50,75 100,0" /></svg>'

describe('does prepare svg properly', () => {
  const svgPlugin = new SvgPlugin({
    pluginOptions: {},
    options: {},
    metadata: mockedMetadata,
    sqipConfig: mockedConfig
  })
  test('svg without viewport, not given width & height', () => {
    expect(() =>
      svgPlugin.prepareSVG(sampleNoViewBox)
    ).toThrowErrorMatchingSnapshot()
  })
  test('svg without viewport, given width & height', () => {
    const svgPlugin = new SvgPlugin({
      pluginOptions: {},
      options: {},
      metadata: mockedMetadata,
      sqipConfig: mockedConfig
    })
    const result = svgPlugin.prepareSVG(sampleNoViewBox)
    expect(result).toMatchSnapshot()
  })
  test('svg with group, with config', () => {
    const svgPlugin = new SvgPlugin({
      pluginOptions: {},
      options: {},
      metadata: mockedMetadata,
      sqipConfig: mockedConfig
    })
    const result = svgPlugin.prepareSVG(sampleWithGroup)
    expect(result).toMatchSnapshot()
  })
  test('svg without group, config with dimensions only', () => {
    const svgPlugin = new SvgPlugin({
      pluginOptions: {},
      options: {},
      metadata: mockedMetadata,
      sqipConfig: mockedConfig
    })
    const result = svgPlugin.prepareSVG(sampleWithoutGroup)
    expect(result).toMatchSnapshot()
  })
  test('svg with missing background', () => {
    const svgPlugin = new SvgPlugin({
      pluginOptions: {},
      options: {},
      metadata: mockedMetadata,
      sqipConfig: mockedConfig
    })
    expect(() =>
      svgPlugin.prepareSVG(sampleNoBg)
    ).toThrowErrorMatchingSnapshot()
  })
})

describe('applies blur filter', () => {
  test('do nothing when no blur is given', () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      metadata: mockedMetadata,
      sqipConfig: mockedConfig,
      pluginOptions: {
        blur: 0
      }
    })
    const result = svgPlugin.applyBlurFilter(sampleWithGroup)
    expect(result).toMatchSnapshot()
  })
  test('svg with group and blur', () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      metadata: mockedMetadata,
      sqipConfig: mockedConfig,
      pluginOptions: {
        blur: 5
      }
    })
    const result = svgPlugin.applyBlurFilter(sampleWithGroup)
    expect(result).toMatchSnapshot()
  })
  test('svg without group and blur', () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      metadata: mockedMetadata,
      sqipConfig: mockedConfig,
      pluginOptions: {
        blur: 5
      }
    })
    const result = svgPlugin.applyBlurFilter(sampleWithoutGroup)
    expect(result).toMatchSnapshot()
  })
})
