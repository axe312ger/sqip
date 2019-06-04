import sqipPluginPixels from '../../src/sqip-plugin-pixels'
import { resolve } from 'path'

const FILE_DEMO_BEACH = resolve(__dirname, '../../../..', 'demo', 'beach.jpg')

describe('sqip-plugin-pixels', () => {
  it('turns raster image into pixelated svg', async () => {
    const plugin = new sqipPluginPixels({ input: FILE_DEMO_BEACH })
    const result = await plugin.apply()
    expect(result).toMatchSnapshot()
  })
})
