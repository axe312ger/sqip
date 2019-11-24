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
    const { stdout } = await execa(cliCmd, [cliPath, '--input', inputFile, '-n', 3], {
      stripFinalNewline: true
    })

    expect(stdout).not.toMatch(/Stored at:/)
  })
  test('--silent disables logging to stdout', async () => {
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '--input', inputFile, '--silent', '-n', 3],
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
      [cliPath, '-i', inputFile, '-o', outputFile, '-n', 3],
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

    await remove(outputFile)
  })
})
