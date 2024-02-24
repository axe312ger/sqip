import sqipPluginDataUri from '../../src/sqip-plugin-data-uri'

import { Swatch } from '@vibrant/color'
import { SqipImageMetadata } from 'sqip/src/sqip'

const EXAMPLE_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" stroke="#000" stroke-width="3"/></svg>'
)

const mockedMetadata: SqipImageMetadata = {
  filename: 'mocked',
  mimeType: 'image/mocked',
  height: 0,
  width: 0,
  originalHeight: 0,
  originalWidth: 0,
  palette: {
    DarkMuted: new Swatch([4, 2, 0], 420),
    DarkVibrant: new Swatch([4, 2, 1], 421),
    LightMuted: new Swatch([4, 2, 2], 422),
    LightVibrant: new Swatch([4, 2, 3], 423),
    Muted: new Swatch([4, 2, 4], 424),
    Vibrant: new Swatch([4, 2, 5], 425)
  },
  type: 'svg'
}
const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['pixels']
}

describe('sqip-plugin-data-uri', () => {
  it('does not touch svg', () => {
    const plugin = new sqipPluginDataUri({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    const result = plugin.apply(EXAMPLE_SVG, mockedMetadata)
    expect(result).toBe(EXAMPLE_SVG)
  })
  it('encodes in mini-svg-data-uri and base64', () => {
    const metadata = { ...mockedMetadata }
    const plugin = new sqipPluginDataUri({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    plugin.apply(EXAMPLE_SVG, metadata)
    expect(metadata).toMatchSnapshot()
  })
})
