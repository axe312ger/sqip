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
  it('turns raster image into pixelated svg', async () => {
    const plugin = new sqipPluginPixels({})
    const result = await plugin.apply(fileContent)

    const $ = cheerio.load(result, { xml: true })

    // Should be one svg with 8 * 5 pixel rects
    expect($('svg')).toHaveLength(1)
    const $rects = $('svg > rect')
    expect($rects).toHaveLength(8 * 5)
  })
})
