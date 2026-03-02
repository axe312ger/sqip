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
    expect($group[0].attribs.transform).toBeUndefined()

    const firstRect = $rects.get(0)
    if (!firstRect) {
      throw new Error('error parsing pixels result. no rect found.')
    }
    expect(firstRect.attribs.width).toEqual('256')
    expect(firstRect.attribs.height).toEqual('256')

    const secondRect = $rects.get(1)
    if (!secondRect) {
      throw new Error('error parsing pixels result. no rect found.')
    }
    expect(secondRect.attribs.width).toEqual('128')
    expect(secondRect.attribs.height).toEqual('256')
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
    expect($group[0].attribs.transform).toEqual('translate(-0.000, -64.000)')

    const firstRect = $rects.get(0)
    if (!firstRect) {
      throw new Error('error parsing pixels result. no rect found.')
    }
    expect(firstRect.attribs.width).toEqual('512')
    expect(firstRect.attribs.height).toEqual('512')

    const secondRect = $rects.get(1)
    if (!secondRect) {
      throw new Error('error parsing pixels result. no rect found.')
    }
    expect(secondRect.attribs.width).toEqual('256')
    expect(secondRect.attribs.height).toEqual('512')
  })

  // @todo test transparent pixel creation with new logo fixture
})
