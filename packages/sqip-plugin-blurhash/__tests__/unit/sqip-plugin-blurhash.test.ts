import { resolve } from 'path'
import { readFileSync } from 'fs'

import sqipPluginBlurhash from '../../src/sqip-plugin-blurhash'

import { Swatch } from '@vibrant/color'

import { SqipImageMetadata } from 'sqip/src/sqip'

const FILE_DEMO_BEACH = resolve(
  __dirname,
  '../../../..',
  '__tests__',
  'fixtures',
  'beach.jpg'
)
const fileContent = readFileSync(FILE_DEMO_BEACH)

const mockedSwatch = new Swatch([4, 2, 0], 420)
const mockedMetadata: SqipImageMetadata = {
  filename: 'mocked',
  mimeType: 'image/mocked',
  height: 32,
  width: 32,
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
  type: 'pixel'
}
const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['pixels']
}

describe('sqip-plugin-blurhash', () => {
  it('default output', async () => {
    const plugin = new sqipPluginBlurhash({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    const result = await plugin.apply(fileContent, mockedMetadata)

    expect(mockedMetadata.blurhash).toMatchSnapshot()
    expect(mockedMetadata.dataURIBase64).toMatchSnapshot()
    expect(result.length).toBe(284)
  })

  it('custom config', async () => {
    const plugin = new sqipPluginBlurhash({
      pluginOptions: { width: 5 },
      options: {},
      sqipConfig: mockedConfig
    })
    const result = await plugin.apply(fileContent, mockedMetadata)

    expect(mockedMetadata.blurhash).toMatchSnapshot()
    expect(mockedMetadata.dataURIBase64).toMatchSnapshot()
    expect(result.length).toBe(285)
  })
})
