import { resolve } from 'path'
import { readFileSync } from 'fs'

import sqipPluginPixels from '../../src/sqip-plugin-pixels'

import cheerio from 'cheerio'

const FILE_DEMO_BEACH = resolve(
  __dirname,
  '../../../..',
  '__tests__',
  'fixtures',
  'beach.jpg'
)
const fileContent = readFileSync(FILE_DEMO_BEACH)

describe('sqip-plugin-pixels', () => {
  it('default output', async () => {
    const plugin = new sqipPluginPixels({})
    const result = await plugin.apply(fileContent)

    const $ = cheerio.load(result, { xml: true })

    // Should be one svg with 8 * 5 pixel rects
    expect($('svg')).toHaveLength(1)
    const $rects = $('svg > rect')
    expect($rects).toHaveLength(6 * 5)
    const firstRect = $('svg > rect').get(0)
    expect(firstRect.attribs.width).toEqual('100')
  })

  it('custom config', async () => {
    const plugin = new sqipPluginPixels({
      pluginOptions: { width: 16, pixelSize: 50 }
    })
    const result = await plugin.apply(fileContent)

    const $ = cheerio.load(result, { xml: true })

    // Should be one svg with 16 * 10 pixel rects with 50px size
    expect($('svg')).toHaveLength(1)
    const $rects = $('svg > rect')
    expect($rects).toHaveLength(12 * 10)
    const firstRect = $('svg > rect').get(0)
    expect(firstRect.attribs.width).toEqual('50')
  })
})
