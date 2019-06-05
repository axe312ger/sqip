import sqipPluginPixels from '../../src/sqip-plugin-pixels'
import { resolve } from 'path'
import cheerio from 'cheerio'

const FILE_DEMO_BEACH = resolve(__dirname, '../../../..', 'demo', 'beach.jpg')

describe('sqip-plugin-pixels', () => {
  it('turns raster image into pixelated svg', async () => {
    const plugin = new sqipPluginPixels({ input: FILE_DEMO_BEACH })
    const result = await plugin.apply()

    const $ = cheerio.load(result, { xml: true })

    // Should be one svg with 8 * 5 pixel rects
    expect($('svg')).toHaveLength(1)
    const $rects = $('svg > rect')
    expect($rects).toHaveLength(8 * 5)
  })
})
