import { resolve } from 'path'
import { readFileSync } from 'fs'

import sqipPluginPixels from '../../src/sqip-plugin-pixels'

import { Swatch } from '@vibrant/color'

import cheerio from 'cheerio'

const FILE_DEMO_BEACH = resolve(
  __dirname,
  '../../../..',
  '__tests__',
  'fixtures',
  'beach.jpg'
)
const fileContent = readFileSync(FILE_DEMO_BEACH)

const mockedSwatch = new Swatch([4, 2, 0], 420)
const mockedMetadata = {
  height: 0,
  width: 0,
  originalHeight: 0,
  originalWidth: 0,
  palette: {
    DarkMuted: mockedSwatch,
    DarkVibrant: mockedSwatch,
    LightMuted: mockedSwatch,
    LightVibrant: mockedSwatch,
    Muted: mockedSwatch,
    Vibrant: mockedSwatch
  },
  type: 'mocked'
}
const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['pixels']
}

describe('sqip-plugin-pixels', () => {
  it('default output', async () => {
    const plugin = new sqipPluginPixels({
      pluginOptions: {},
      options: {},
      metadata: mockedMetadata,
      sqipConfig: mockedConfig
    })
    const result = await plugin.apply(fileContent)

    const $ = cheerio.load(result, { xml: true })

    // Should be one svg with 8 * 5 pixel rects
    expect($('svg')).toHaveLength(1)
    const $rects = $('svg > rect')
    expect($rects).toHaveLength(8 * 5)
    const firstRect = $('svg > rect').get(0)
    if (!firstRect) {
      throw new Error('error parsing pixels result. no rect found.')
    }
    expect(firstRect.attribs.width).toEqual('100')
  })

  it('custom config', async () => {
    const plugin = new sqipPluginPixels({
      pluginOptions: { width: 16, pixelSize: 50 },
      options: {},
      metadata: mockedMetadata,
      sqipConfig: mockedConfig
    })
    const result = await plugin.apply(fileContent)

    const $ = cheerio.load(result, { xml: true })

    // Should be one svg with 16 * 10 pixel rects with 50px size
    expect($('svg')).toHaveLength(1)
    const $rects = $('svg > rect')
    expect($rects).toHaveLength(16 * 10)
    const firstRect = $('svg > rect').get(0)
    if (!firstRect) {
      throw new Error('error parsing pixels result. no rect found.')
    }
    expect(firstRect.attribs.width).toEqual('50')
  })
})
