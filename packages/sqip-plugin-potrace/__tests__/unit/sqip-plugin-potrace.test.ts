import { resolve } from 'path'
import { readFileSync } from 'fs'

import cheerio from 'cheerio'

import sqipPluginPotrace from '../../src/sqip-plugin-potrace'
import { SqipImageMetadata, mockedMetadata } from 'sqip'

const potraceMockedMetadata: SqipImageMetadata = {
  ...mockedMetadata,
  type: 'pixel'
}

const FILE_DEMO_BEACH = resolve(
  __dirname,
  '../../../../',
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

describe('sqip-plugin-potrace', () => {
  it('default output', async () => {
    const plugin = new sqipPluginPotrace({
      pluginOptions: {},
      options: {},
      sqipConfig: mockedConfig
    })
    const metadata = { ...potraceMockedMetadata }
    const result = await plugin.apply(fileContent, metadata)

    const $ = cheerio.load(result, { xml: true })
    const $svg = $('svg')

    // Sets correct dimensions
    expect($svg.attr('width')).toEqual('1024')
    expect($svg.attr('height')).toEqual('640')
    expect($svg.attr('viewBox')).toEqual('0 0 1024 640')

    // Creates one single path
    const $path = $('svg path')
    expect($path).toHaveLength(1)
    expect($path.attr('fill')).toEqual('#040205')
  })

  it('posterize', async () => {
    const plugin = new sqipPluginPotrace({
      pluginOptions: { posterize: true, steps: 2 },
      options: {},
      sqipConfig: mockedConfig
    })
    const metadata = { ...potraceMockedMetadata }
    const result = await plugin.apply(fileContent, metadata)

    const $ = cheerio.load(result, { xml: true })

    // Background
    const $bg = $('svg > rect')
    expect($bg.attr('fill')).toBe('#040200')

    // Foreground: Multiple paths with Light Vibrant Color
    const $paths = $('svg path')

    expect($paths).toHaveLength(2)
    expect($paths.first().attr('fill')).toEqual('#040203')
    expect($paths.last().attr('fill')).toEqual('#040203')
  })

  it('custom config', async () => {
    const plugin = new sqipPluginPotrace({
      pluginOptions: {
        color: '#Color',
        background: '#Background'
      },
      options: {},
      sqipConfig: mockedConfig
    })
    const metadata = { ...potraceMockedMetadata }
    const result = await plugin.apply(fileContent, metadata)

    const $ = cheerio.load(result, { xml: true })

    // Background
    const $bg = $('svg > rect')
    expect($bg.attr('fill')).toBe('#Background')

    // Foreground: Single path
    const $path = $('svg path')

    expect($path).toHaveLength(1)
    expect($path.attr('fill')).toEqual('#Color')
  })
})
