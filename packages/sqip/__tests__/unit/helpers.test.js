import { resolve } from 'path'
import { readFile } from 'fs-extra'

import { loadSVG } from '../../src/helpers'

const BEACH_SVG = resolve(
  __dirname,
  '../../../..',
  'demo',
  'public',
  'processed',
  'beach-sqip.svg'
)

test('loadSVG', async () => {
  const svgContent = await readFile(BEACH_SVG)
  const $svg = loadSVG(svgContent)
  expect($svg('svg')).toHaveLength(1)
})
