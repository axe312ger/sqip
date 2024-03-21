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
    const $rects = $('svg > g >rect')
    expect($rects).toHaveLength(8 * 5)

    const $group = $('svg > g')
    expect($group[0].attribs.transform).toEqual(
      'translate(-3584.000, -2240.000)'
    )

    const firstRect = $rects.get(0)
    if (!firstRect) {
      throw new Error('error parsing pixels result. no rect found.')
    }
    expect(firstRect.attribs.width).toEqual('1024')
  })

  it('custom config', async () => {
    const plugin = new sqipPluginPixels({
      pluginOptions: { pixels: 4 },
      options: {},
      sqipConfig: mockedConfig
    })
    const metadata = { ...pixelMockedMetadata }
    const result = await plugin.apply(fileContent, metadata)

    const $ = cheerio.load(result, { xml: true })

    expect($('svg')).toHaveLength(1)
    const $rects = $('svg > g > rect')
    expect($rects).toHaveLength(4 * 3)

    const $group = $('svg > g')
    expect($group[0].attribs.transform).toEqual(
      'translate(-1536.000, -1216.000)'
    )

    const firstRect = $rects.get(0)
    if (!firstRect) {
      throw new Error('error parsing pixels result. no rect found.')
    }
    expect(firstRect.attribs.width).toEqual('1024')
  })
})
