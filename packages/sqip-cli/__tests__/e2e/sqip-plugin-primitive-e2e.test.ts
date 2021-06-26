import { resolve } from 'path'
import { tmpdir } from 'os'
import { stat, remove, readFile } from 'fs-extra'

import cheerio from 'cheerio'
import execa from 'execa'

function isValidStdout(stdout: string) {
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
  test('run with default settings', async () => {
    const outputFile = resolve(
      tmpdir(),
      `sqip-e2e-test-${new Date().getTime()}.svg`
    )
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFile, '-o', outputFile, '-p', 'primitive'],
      {
        stripFinalNewline: true
      }
    )

    isValidStdout(stdout)

    expect(await stat(outputFile)).toBeTruthy()

    const results = stdout.split('DarkVibrant')[1].match(/#[0-9a-f]{6}/g)

    if (!results) {
      throw new Error('Unable to allocate Dark Vibrant & Dark Muted colors')
    }

    const darkMuted = results[4]

    const content = await readFile(outputFile)

    const $ = cheerio.load(content, { xml: true })
    const $primitives = $('svg > g *:not(g)')
    const types = [
      ...new Set($primitives.map((i, $primitive) => $primitive.tagName).get())
    ]

    const firstPrimitive = $('svg > g *:not(g)').get(0)
    if (!firstPrimitive) {
      throw new Error('Unable to allocate first primitive shape')
    }

    const backgroundRect = $('svg > rect').get(0)
    if (!backgroundRect) {
      throw new Error('Unable to allocate first background rectangle')
    }

    expect($primitives).toHaveLength(8)
    expect(types.length).toBeGreaterThanOrEqual(1)
    expect(
      parseFloat(firstPrimitive.attribs['fill-opacity']).toFixed(1)
    ).toEqual('0.5')
    expect(backgroundRect.attribs['fill']).toEqual(darkMuted)

    await remove(outputFile)
  })

  test('run with custom settings', async () => {
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
        '5',
        '--primitive-background',
        '#123456',
        '--primitive-alpha',
        '64'
      ],
      {
        stripFinalNewline: true
      }
    )

    isValidStdout(stdout)

    expect(await stat(outputFile)).toBeTruthy()

    const content = await readFile(outputFile)

    const $ = cheerio.load(content, { xml: true })
    const $primitives = $('svg > g *:not(g)')
    const types = [
      ...new Set($primitives.map((i, $primitive) => $primitive.tagName).get())
    ]

    const firstPrimitive = $('svg > g *:not(g)').get(0)
    if (!firstPrimitive) {
      throw new Error('Unable to allocate first primitive shape')
    }

    const backgroundRect = $('svg > rect').get(0)
    if (!backgroundRect) {
      throw new Error('Unable to allocate first background rectangle')
    }

    expect($primitives).toHaveLength(5)
    expect(types.length).toBeGreaterThanOrEqual(1)
    expect(
      parseFloat(firstPrimitive.attribs['fill-opacity']).toFixed(2)
    ).toEqual('0.25')
    expect(backgroundRect.attribs['fill']).toEqual('#123456')

    await remove(outputFile)
  })
})
