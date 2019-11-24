import { resolve } from 'path'
import { tmpdir } from 'os'
import { stat, remove, readFile } from 'fs-extra'

import cheerio from 'cheerio'
import execa from 'execa'

function isValidStdout(stdout) {
  expect(stdout).toMatch(/Processing: \/([A-z0-9-_+]+\/)*[A-z0-9-_]+\.jpg/)
  expect(stdout).toMatch(/Stored at: \/([A-z0-9-_+]+\/)*[A-z0-9-_]+\.svg/)
  expect(stdout).toMatch(/originalWidth.+originalHeight.+width.+height.+type/)
  expect(stdout).toMatch(
    /Vibrant.+DarkVibrant.+LightVibrant.+Muted.+DarkMuted.+LightMuted/
  )
}

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

describe('primitive e2e/integration tests', () => {
  test('-n sets the number of primitives', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    const { stdout } = await execa(
      cliCmd,
      [
        cliPath,
        '-i',
        inputFile,
        '-o',
        outputFile,
        '-p',
        'primitive',
        '-n',
        5
      ],
      {
        stripFinalNewline: true
      }
    )

    isValidStdout(stdout)

    // Does the new file exist
    expect(await stat(outputFile)).toBeTruthy()

    const content = await readFile(outputFile)
    console.log(content.toString())
    const $ = cheerio.load(content, { xml: true })

    // Check default number of primitives
    const $primitives = $('svg > g > *')
    expect($primitives).toHaveLength(5)

    await remove(outputFile)
  })

  test('-m sets the primitive mode', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-o', outputFile, '-p', 'primitive', '-n', 3,'-m', 3],
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
    const $primitives = $('svg > g > *')
    const types = $primitives.map((i, $primitive) => $primitive.tagName).get()
    expect(new Set(types)).toEqual(new Set(['ellipse']))

    await remove(outputFile)
  })
})
