import { resolve } from 'path'
import { readFile } from 'fs-extra'

import { loadSVG, locateFiles } from '../../src/helpers'

const DIR_ROOT = resolve(__dirname, '../../../..')
const DIR_FIXTURES = resolve(DIR_ROOT, '__tests__', 'fixtures')

const FILE_JPG = resolve(DIR_FIXTURES, 'beach.jpg')
const FILE_SVG = resolve(DIR_FIXTURES, 'beach-sqip.svg')

test('loadSVG', async () => {
  const svgContentBuffer = await readFile(FILE_SVG)
  const $svg = loadSVG(svgContentBuffer.toString())
  expect($svg('svg')).toHaveLength(1)
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
    expect(result).toHaveLength(3)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
  test('whole directory with glob "*"', async () => {
    const result = await locateFiles(`${DIR_FIXTURES}/*`)
    expect(result).toHaveLength(3)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
  test('whole directory with glob "*.{jpg,jpeg}"', async () => {
    const result = await locateFiles(`${DIR_FIXTURES}/*.{jpg,jpeg}`)
    expect(result).toHaveLength(2)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
  test('subdirectory glob "**/*"', async () => {
    const result = await locateFiles(`${resolve(DIR_FIXTURES, '..')}/**/*`)
    expect(result).toHaveLength(3)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
  test('expandes tilde in glob "~+/__tests__/fixtures"', async () => {
    const result = await locateFiles(`~+/__tests__/fixtures`)
    expect(result).toHaveLength(3)
    expect(cleanResultArray(result)).toMatchSnapshot()
  })
})
