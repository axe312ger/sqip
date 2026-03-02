import { resolve } from 'path'
import { tmpdir } from 'os'
import { stat, remove, readFile } from 'fs-extra'

import { load as cheerioLoad } from 'cheerio'
import { vi } from 'vitest'
import { execa } from 'execa'

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
const outputFile = resolve(process.cwd(), 'beach.svg')
const cliPath = resolve(__dirname, '..', '..', 'dist', 'wrapper.js')
const cliCmd = `node`

vi.setConfig({ testTimeout: 20000 })

function isValidStdout(stdout: string) {
  expect(stdout).toMatch(/Processing: \/([A-z0-9-_+]+\/)*[A-z0-9-_]+\.jpg/)
  expect(stdout).toMatch(/Stored at: \/([A-z0-9-_+]+\/)*[A-z0-9-_]+\.svg/)
  expect(stdout).toMatch(/originalWidth.+originalHeight.+width.+height.+type/)
  expect(stdout).toMatch(
    /Vibrant.+DarkVibrant.+LightVibrant.+Muted.+DarkMuted.+LightMuted/
  )
}

describe('cli api', () => {
  test('no config exists programm and shows help', async () => {
    await expect(() =>
      execa(cliCmd, [cliPath], {
        stripFinalNewline: true
      })
    ).rejects.toThrow('Please provide the following arguments: input')
  })
  test('--help shows help screen to user', async () => {
    const { stdout } = await execa(cliCmd, [cliPath, '--help'], {
      stripFinalNewline: true
    })
    // Normalize whitespace: strip ANSI codes and collapse runs of spaces
    // to a single space so output doesn't depend on terminal width
    const normalized = stdout
      // eslint-disable-next-line no-control-regex
      .replace(/\x1b\[[0-9;]*m/g, '')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/ $/gm, '')
    expect(normalized).toMatchSnapshot()
  })
  test('--silent disables logging to stdout', async () => {
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '--input', inputFile, '--silent', '-p', 'pixels'],
      {
        stripFinalNewline: true
      }
    )

    expect(stdout).toMatch('')
  })
  test('basic svg structure is applied', async () => {
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-p', 'pixels'],
      {
        stripFinalNewline: true
      }
    )
    isValidStdout(stdout)

    // Does the new file exist
    expect(await stat(outputFile)).toBeTruthy()

    const content = await readFile(outputFile)
    const $ = cheerioLoad(content, { xml: true })

    // File content is actually a parseable svg
    expect($('svg')).toHaveLength(1)

    await remove(outputFile)
  })
  test('-o saves file to given path', async () => {
    const tmpOutputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )

    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-o', tmpOutputFile, '-p', 'pixels'],
      {
        stripFinalNewline: true
      }
    )
    isValidStdout(stdout)

    // Does the new file exist
    expect(await stat(tmpOutputFile)).toBeTruthy()

    await remove(tmpOutputFile)
  })
})
