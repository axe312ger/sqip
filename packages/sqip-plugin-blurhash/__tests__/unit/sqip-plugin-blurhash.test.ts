import { resolve } from 'path'
import { readFileSync } from 'fs'

import sqipPluginBlurhash from '../../src/sqip-plugin-blurhash'

import { SqipImageMetadata, mockedMetadata } from 'sqip'

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

describe('sqip-plugin-blurhash', () => {
  it('default output', async () => {
    const plugin = new sqipPluginBlurhash({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    const blurhashMockedMetadata: SqipImageMetadata = {
      ...mockedMetadata,
      height: 32,
      width: 32,
      type: 'pixel'
    }
    const result = await plugin.apply(fileContent, blurhashMockedMetadata)

    expect(blurhashMockedMetadata.blurhash).toMatchSnapshot()
    expect(blurhashMockedMetadata.dataURIBase64).toMatchSnapshot()
    expect(result.length).toBe(284)
  })

  it('custom config', async () => {
    const plugin = new sqipPluginBlurhash({
      pluginOptions: { width: 5 },
      options: {},
      sqipConfig: mockedConfig
    })
    const blurhashMockedMetadata: SqipImageMetadata = {
      ...mockedMetadata,
      height: 32,
      width: 32,
      type: 'pixel'
    }
    const result = await plugin.apply(fileContent, blurhashMockedMetadata)

    expect(blurhashMockedMetadata.blurhash).toMatchSnapshot()
    expect(blurhashMockedMetadata.dataURIBase64).toMatchSnapshot()
    expect(result.length).toBe(285)
  })
})
