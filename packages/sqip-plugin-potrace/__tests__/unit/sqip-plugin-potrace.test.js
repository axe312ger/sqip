import { resolve } from 'path'
import { readFileSync } from 'fs'

import cheerio from 'cheerio'

import sqipPluginPotrace from '../../src/sqip-plugin-potrace'

const FILE_DEMO_BEACH = resolve(
  __dirname,
  '../../../../',
  '__tests__',
  'fixtures',
  'beach.jpg'
)
const fileContent = readFileSync(FILE_DEMO_BEACH)

const vibrantGetHexMock = jest.fn(() => '#Vibrant')
const lightVibrantGetHexMock = jest.fn(() => '#LightVibrant')
const darkVibrantGetHexMock = jest.fn(() => '#DarkVibrant')
const mutedGetHexMock = jest.fn(() => '#Muted')
const lightMutedGetHexMock = jest.fn(() => '#LightMuted')
const darkMutedGetHexMock = jest.fn(() => '#DarkMuted')

const mockedPalette = {
  Vibrant: { getHex: vibrantGetHexMock },
  LightVibrant: { getHex: lightVibrantGetHexMock },
  DarkVibrant: { getHex: darkVibrantGetHexMock },
  Muted: { getHex: mutedGetHexMock },
  LightMuted: { getHex: lightMutedGetHexMock },
  DarkMuted: { getHex: darkMutedGetHexMock }
}

describe('sqip-plugin-potrace', () => {
  it('default output', async () => {
    const plugin = new sqipPluginPotrace({
      sqipConfig: {},
      pluginOptions: {},
      metadata: {
        palette: mockedPalette
      },
      filePath: FILE_DEMO_BEACH
    })
    const result = await plugin.apply(fileContent)

    const $ = cheerio.load(result, { xml: true })
    const $svg = $('svg')

    // Sets correct dimensions
    expect($svg.attr('width')).toEqual('1024')
    expect($svg.attr('height')).toEqual('640')
    expect($svg.attr('viewBox')).toEqual('0 0 1024 640')

    // Creates one single path
    const $path = $('svg path')
    expect($path).toHaveLength(1)
    expect($path.attr('fill')).toEqual('#Vibrant')
  })

  it('posterize', async () => {
    const plugin = new sqipPluginPotrace({
      sqipConfig: {},
      pluginOptions: { posterize: true, steps: 2 },
      metadata: {
        palette: mockedPalette
      },
      filePath: FILE_DEMO_BEACH
    })
    const result = await plugin.apply(fileContent)

    const $ = cheerio.load(result, { xml: true })

    // Background
    const $bg = $('svg > rect')
    expect($bg.attr('fill')).toBe('#DarkMuted')

    // Foreground: Multiple paths with Light Vibrant Color
    const $paths = $('svg path')

    expect($paths).toHaveLength(2)
    expect($paths.first().attr('fill')).toEqual('#LightVibrant')
    expect($paths.last().attr('fill')).toEqual('#LightVibrant')
  })

  it('custom config', async () => {
    const plugin = new sqipPluginPotrace({
      sqipConfig: {},
      pluginOptions: {
        color: '#Color',
        background: '#Background'
      },
      metadata: {
        palette: mockedPalette
      },
      filePath: FILE_DEMO_BEACH
    })
    const result = await plugin.apply(fileContent)

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
