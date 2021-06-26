import { resolve } from 'path'

import execa from 'execa'

const inputFileCMYK = resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '__tests__',
  'fixtures',
  'CMYK-example.jpg'
)
const cliPath = resolve(__dirname, '..', '..', 'dist', 'wrapper.js')
const cliCmd = `node`

jest.setTimeout(20000)

describe('broken input files', () => {
  // https://github.com/axe312ger/sqip/issues/93
  test('can read image with CMYK colorspace', async () => {
    const { stdout } = await execa(
      cliCmd,
      [cliPath, '-i', inputFileCMYK, '-p', 'pixels'],
      {
        stripFinalNewline: true
      }
    )
    console.log(stdout)
    expect(stdout).toMatch(/originalWidth.+originalHeight.+width.+height.+type/)
    expect(stdout).toMatch(
      /Vibrant.+DarkVibrant.+LightVibrant.+Muted.+DarkMuted.+LightMuted/
    )
  })
})
