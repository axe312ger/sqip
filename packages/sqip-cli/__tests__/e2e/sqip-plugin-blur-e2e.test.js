import { resolve } from 'path'
import { tmpdir } from 'os'
import { stat, remove, readFile } from 'fs-extra'

import cheerio from 'cheerio'
import execa from 'execa'

const inputFile = resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '__tests__',
  'fixtures',
  'beach.jpg'
)
const cliPath = resolve(__dirname, '..', '..', 'dist', 'wrapper.js')
const cliCmd = `node`

jest.setTimeout(20000)

describe('blur e2e/integration tests', () => {
  test('-b sets the blur value', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-o', outputFile, '-n', 3, '-b', 5],
      {
        stripFinalNewline: true
      }
    )

    // Does the new file exist
    expect(await stat(outputFile)).toBeTruthy()

    const content = await readFile(outputFile)
    const $ = cheerio.load(content, { xml: true })

    // Check blur to be given value (5)
    const $filter = $('svg > filter > feGaussianBlur')
    expect($filter).toHaveLength(1)
    expect($filter.attr('stdDeviation')).toBe('5')

    await remove(outputFile)
  })
  test('-b 0 removes the blur on default settings', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    await execa(cliCmd, [cliPath, '-i', inputFile, '-o', outputFile, '-b', 0], {
      stripFinalNewline: true
    })

    // Does the new file exist
    expect(await stat(outputFile)).toBeTruthy()

    const content = await readFile(outputFile)
    const $ = cheerio.load(content, { xml: true })

    // Check blur of 0 does remove the blur
    const $filter = $('svg filter')
    expect($filter).toHaveLength(0)
    await remove(outputFile)
  })
})
