import { resolve } from 'path'
import { readFileSync } from 'fs'

import sqipPluginPixels from '../../src/sqip-plugin-pixels'

import cheerio from 'cheerio'
import { SqipImageMetadata, mockedMetadata } from 'sqip'

const pixelMockedMetadata: SqipImageMetadata = {
  ...mockedMetadata,
  type: 'pixel'
}

const FILE_DEMO_BEACH = resolve(
  __dirname,
  '../../../..',
  '__tests__',
  'fixtures',
  'beach.jpg'
)
const fileContent = readFileSync(FILE_DEMO_BEACH)

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
      sqipConfig: mockedConfig
    })
    const metadata = { ...pixelMockedMetadata }
    const result = await plugin.apply(fileContent, metadata)

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
      sqipConfig: mockedConfig
    })
    const metadata = { ...pixelMockedMetadata }
    const result = await plugin.apply(fileContent, metadata)

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
