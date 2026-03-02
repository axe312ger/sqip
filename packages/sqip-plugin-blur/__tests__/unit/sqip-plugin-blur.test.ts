import { mockedMetadata } from 'sqip'
import SvgPlugin from '../../src/sqip-plugin-blur'

const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['blur']
}

const sampleWithGroup = Buffer.from(
  '<svg viewBox="0 0 1024 768"><rect fill="#bada55"/><g><path fill="#C0FFEE" d="M51.5 17.5l4 18 15 1z"/></g></svg>'
)
const sampleWithoutGroup = Buffer.from(
  '<svg viewBox="0 0 1024 768"><rect fill="#bada55"/><polygon points="0,100 50,25 50,75 100,0" /></svg>'
)

describe('applies blur filter', () => {
  test('do nothing when no blur is given', async () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      sqipConfig: mockedConfig,
      pluginOptions: { blur: 0 }
    })
    const result = await svgPlugin.apply(sampleWithoutGroup, mockedMetadata)
    expect(result.toString()).toMatchSnapshot()
  })
  test('svg with group and blur', async () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      sqipConfig: mockedConfig,
      pluginOptions: { blur: 5 }
    })
    const result = await svgPlugin.apply(sampleWithGroup, mockedMetadata)
    expect(result.toString()).toMatchSnapshot()
  })
  test('svg without group and blur', async () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      sqipConfig: mockedConfig,
      pluginOptions: { blur: 5 }
    })
    const result = await svgPlugin.apply(sampleWithoutGroup, mockedMetadata)
    expect(result.toString()).toMatchSnapshot()
  })

  test('default configuration', async () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      sqipConfig: mockedConfig,
      pluginOptions: {}
    })
    const result = await svgPlugin.apply(sampleWithoutGroup, mockedMetadata)
    expect(result.toString()).toMatchSnapshot()
  })

  test('legacy blur', async () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      sqipConfig: mockedConfig,
      pluginOptions: { legacyBlur: true }
    })
    const result = await svgPlugin.apply(sampleWithoutGroup, mockedMetadata)
    expect(result.toString()).toMatchSnapshot()
  })
  test('legacy blur with custom deviation', async () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      sqipConfig: mockedConfig,
      pluginOptions: {
        legacyBlur: true,
        blur: 24
      }
    })
    const result = await svgPlugin.apply(sampleWithoutGroup, mockedMetadata)
    expect(result.toString()).toMatchSnapshot()
  })

  test('background fix for css blur - from palette', async () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      sqipConfig: mockedConfig,
      pluginOptions: { backgroundColor: 'DarkMuted' }
    })
    const result = await svgPlugin.apply(sampleWithoutGroup, mockedMetadata)
    expect(result.toString()).toMatchSnapshot()
  })
  test('background fix for css blur - hardcoded', async () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      sqipConfig: mockedConfig,
      pluginOptions: { backgroundColor: '#fff' }
    })
    const result = await svgPlugin.apply(sampleWithoutGroup, mockedMetadata)
    expect(result.toString()).toMatchSnapshot()
  })
  test('skips background fix for css blur when background is 100% transparent', async () => {
    const svgPlugin = new SvgPlugin({
      options: {},
      sqipConfig: mockedConfig,
      pluginOptions: { backgroundColor: '#FFFFFF00' }
    })
    const result = await svgPlugin.apply(sampleWithoutGroup, mockedMetadata)
    expect(result.toString()).toMatchSnapshot()
  })
})
