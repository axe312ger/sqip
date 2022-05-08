import { resolve } from 'path'
import { tmpdir } from 'os'
import fs from 'fs/promises'
import * as svgson from 'svgson'

import execa from 'execa'

const FIXTURES = resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '__tests__',
  'fixtures'
)
const cliPath = resolve(__dirname, '..', '..', 'dist', 'wrapper.js')
const cliCmd = `node`

jest.setTimeout(20000)

const tmpPathCMYK = resolve(tmpdir(), 'test-cmyk.svg')
const tmpPathTransparentBackground = resolve(
  tmpdir(),
  'test-transparent-background.svg'
)

describe('edge-cases', () => {
  afterAll(async () => {
    try {
      await fs.unlink(tmpPathTransparentBackground)
    } catch (e) {
      // noop
    }
    try {
      await fs.unlink(tmpPathTransparentBackground)
    } catch (e) {
      // noop
    }
  })
  // https://github.com/axe312ger/sqip/issues/93
  test('can read image with CMYK colorspace', async () => {
    const { stdout } = await execa(
      cliCmd,
      [
        cliPath,
        '-i',
        resolve(FIXTURES, 'CMYK-example.jpg'),
        '-o',
        tmpPathCMYK,
        '-p',
        'pixels'
      ],
      {
        stripFinalNewline: true
      }
    )
    expect(stdout).toMatch(/originalWidth.+originalHeight.+width.+height.+type/)
    expect(stdout).toMatch(
      /Vibrant.+DarkVibrant.+LightVibrant.+Muted.+DarkMuted.+LightMuted/
    )
  })

  // https://github.com/axe312ger/sqip/issues/117
  test('works with transparent backgrounds and removes background element', async () => {
    await execa(
      cliCmd,
      [
        cliPath,
        '-i',
        resolve(FIXTURES, 'transparent-background.png'),
        '-o',
        tmpPathTransparentBackground,
        '-p',
        'primitive',
        '--primitive-background',
        '#ffffff00',
        '--primitive-numberOfPrimitives',
        '3'
      ],
      {
        stripFinalNewline: true
      }
    )
    const svgContent = await fs.readFile(tmpPathTransparentBackground)
    const parsedSvg = await svgson.parse(svgContent.toString())

    // We expect a group of elements, not a single element representing the background. (Might be a rect or a path, primitive is shaky)
    expect(parsedSvg.children[0].name).toEqual('g')
  })
})
