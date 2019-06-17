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

function isValidStdout(stdout) {
  expect(stdout).toMatch(/Processing: \/([A-z0-9-_+]+\/)*[A-z0-9-_]+\.jpg/)
  expect(stdout).toMatch(/Stored at: \/([A-z0-9-_+]+\/)*[A-z0-9-_]+\.svg/)
  expect(stdout).toMatch(/originalWidth.+originalHeight.+width.+height.+type/)
  expect(stdout).toMatch(
    /Vibrant.+DarkVibrant.+LightVibrant.+Muted.+DarkMuted.+LightMuted/
  )
}

describe('cli api', () => {
  test('no config exists programm and shows help', async () => {
    try {
      await execa(cliCmd, [cliPath], {
        stripFinalNewline: true
      })
      throw new Error('cli should exit with help message')
    } catch (err) {
      expect(err.stdout).toMatchSnapshot()
      expect(err.stderr).toMatchSnapshot()
      expect(err.code).toBe(1)
    }
  })
  test('--help shows help screen to user', async () => {
    const { stdout } = await execa(cliCmd, [cliPath, '--help'], {
      stripFinalNewline: true
    })
    expect(stdout).toMatchSnapshot()
  })
  test('no output will not show stored at hint', async () => {
    const { stdout } = await execa(cliCmd, [cliPath, '--input', inputFile], {
      stripFinalNewline: true
    })

    expect(stdout).not.toMatch(/Stored at:/)
  })
  test('--silent disables logging to stdout', async () => {
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '--input', inputFile, '--silent'],
      {
        stripFinalNewline: true
      }
    )

    expect(stdout).toMatch("")
  })
  test('-o save result to file and basic svg structure is applied', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )

    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-o', outputFile],
      {
        stripFinalNewline: true
      }
    )
    isValidStdout(stdout)

    // Does the new file exist
    expect(await stat(outputFile)).toBeTruthy()

    const content = await readFile(outputFile)
    const $ = cheerio.load(content, { xml: true })

    // File content is actually a parseable svg
    expect($('svg')).toHaveLength(1)

    // Check default blur value
    const $filter = $('svg > filter > feGaussianBlur')
    expect($filter).toHaveLength(1)
    expect($filter.attr('stdDeviation')).toBe('12')

    // Check default number of primitives
    const $primitives = $('svg g > g > *')
    expect($primitives).toHaveLength(8)

    await remove(outputFile)
  })
  test('-n sets the number of primitives', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-o', outputFile, '-n', 15, '-b', 0],
      {
        stripFinalNewline: true
      }
    )

    isValidStdout(stdout)

    // Does the new file exist
    expect(await stat(outputFile)).toBeTruthy()

    const content = await readFile(outputFile)
    const $ = cheerio.load(content, { xml: true })

    // Check default number of primitives
    const $primitives = $('svg g > *')
    expect($primitives).toHaveLength(15)

    await remove(outputFile)
  })
  test('-m sets the primitive mode', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-o', outputFile, '-m', 4],
      {
        stripFinalNewline: true
      }
    )

    isValidStdout(stdout)

    // Does the new file exist
    expect(await stat(outputFile)).toBeTruthy()

    const content = await readFile(outputFile)
    const $ = cheerio.load(content, { xml: true })

    // Check type of primitives to be all ellipses
    const $primitives = $('svg > g > g > *')
    const types = $primitives.map((i, $primitive) => $primitive.tagName).get()
    expect(new Set(types)).toEqual(new Set(['ellipse']))

    await remove(outputFile)
  })
  test('-b sets the blur value', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-o', outputFile, '-b', 5],
      {
        stripFinalNewline: true
      }
    )

    isValidStdout(stdout)

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
  test('-b 0 removes the blur', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-o', outputFile, '-b', 0],
      {
        stripFinalNewline: true
      }
    )

    isValidStdout(stdout)

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
