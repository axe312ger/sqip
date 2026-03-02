import { resolve } from 'path'
import { readFile } from 'fs-extra'

import { loadSVG, locateFiles, parseColor, findBackgroundColor } from '../../src/helpers'

const DIR_ROOT = resolve(__dirname, '../../../..')
const DIR_FIXTURES = resolve(DIR_ROOT, '__tests__', 'fixtures')

const FILE_JPG = resolve(DIR_FIXTURES, 'beach.jpg')
const FILE_SVG = resolve(DIR_FIXTURES, 'beach-sqip.svg')
const FILE_TRANSPARENT = resolve(DIR_FIXTURES, 'transparent-background.png')

test('loadSVG', async () => {
  const svgContentBuffer = await readFile(FILE_SVG)
  const { svg } = await loadSVG(svgContentBuffer.toString())
  expect(svg).toBeDefined()
})

const cleanResultArray = (results: string[]) =>
  results.map((result) => result.replace(DIR_ROOT, ''))

describe('locateFiles', () => {
  test('invalid directory or files yields empty array', async () => {
    await expect(
      locateFiles('/foo/bar/baz')
    ).rejects.toThrowErrorMatchingSnapshot()
  })
  test('invalid glob', async () => {
    await expect(
      locateFiles('/foo/bar/baz/*')
    ).rejects.toThrowErrorMatchingSnapshot()
  })
  test('single file', async () => {
    const result = await locateFiles(FILE_JPG)
    expect(result).toHaveLength(1)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
  test('whole directory without glob', async () => {
    const result = await locateFiles(DIR_FIXTURES)
    expect(result).toHaveLength(4)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
  test('whole directory with glob "*"', async () => {
    const result = await locateFiles(`${DIR_FIXTURES}/*`)
    expect(result).toHaveLength(4)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
  test('whole directory with glob "*.{jpg,jpeg}"', async () => {
    const result = await locateFiles(`${DIR_FIXTURES}/*.{jpg,jpeg}`)
    expect(result).toHaveLength(2)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
  test('subdirectory glob "**/*"', async () => {
    const result = await locateFiles(`${resolve(DIR_FIXTURES, '..')}/**/*`)
    expect(result).toHaveLength(4)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
  test('expandes tilde in glob "~+/__tests__/fixtures"', async () => {
    const result = await locateFiles(`~+/__tests__/fixtures`)
    expect(result).toHaveLength(4)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
})

describe('parseColor', () => {
  test('returns hex from palette when key exists', () => {
    const palette = {
      Vibrant: { hex: '#ff0000' }
    } as any
    expect(parseColor({ palette, color: 'Vibrant' })).toBe('#ff0000')
  })

  test('falls back to color string when key is not in palette', () => {
    const palette = {} as any
    expect(parseColor({ palette, color: '#00ff00' })).toBe('#00ff00')
  })

  test('falls back to color string when palette entry has no hex', () => {
    const palette = {
      Muted: null
    } as any
    expect(parseColor({ palette, color: 'Muted' })).toBe('Muted')
  })
})

describe('findBackgroundColor', () => {
  test('detects background color from a JPEG', async () => {
    const buffer = await readFile(FILE_JPG)
    const color = await findBackgroundColor(buffer)
    expect(color).toMatch(/^#[0-9a-f]+$/i)
  })

  test('detects transparent background from a PNG with alpha', async () => {
    const buffer = await readFile(FILE_TRANSPARENT)
    const color = await findBackgroundColor(buffer)
    // Transparent backgrounds have alpha < ff in the hex color
    expect(color).toMatch(/^#[0-9a-f]+$/i)
    // The alpha byte should indicate transparency (00)
    expect(color.slice(7, 9)).toBe('00')
  })
})
