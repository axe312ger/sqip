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
    expect(result.length).toBe(345)
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
    expect(result.length).toBe(464)
  })

  test('cliOptions returns array of option definitions', () => {
    expect(Array.isArray(sqipPluginBlurhash.cliOptions)).toBe(true)
    expect(sqipPluginBlurhash.cliOptions.length).toBeGreaterThan(0)
  })

  test('throws when input is svg', async () => {
    const plugin = new sqipPluginBlurhash({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    const svgMetadata: SqipImageMetadata = {
      ...mockedMetadata,
      type: 'svg'
    }
    await expect(
      plugin.apply(fileContent, svgMetadata)
    ).rejects.toThrow('raster image')
  })
})
