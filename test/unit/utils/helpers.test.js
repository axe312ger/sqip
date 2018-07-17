import { readFileSync } from 'fs'
import { resolve } from 'path'

import {
  encodeBase64,
  getDimensions,
  printFinalResult
} from '../../../src/utils/helpers'

const rawSVG = readFileSync(resolve(__dirname, '../../../demo/beach-sqip.svg'))

const logSpy = jest.spyOn(global.console, 'log')

test('encodeBase64', () => {
  const result = encodeBase64(rawSVG)
  expect(result).toMatchSnapshot()
})

test('getDimensions', () => {
  const result = getDimensions(resolve(__dirname, '../../../demo/beach.jpg'))
  expect(result).toMatchSnapshot()
})

test('printFinalResult', () => {
  const width = 200
  const height = 100
  printFinalResult(
    { width, height },
    '/path/to/image.jpg',
    'data:image/svg+xml;base64,base64EncodedSVG'
  )
  expect(logSpy).toHaveBeenCalledWith(
    '<img width="200" height="100" src="/path/to/image.jpg" alt="Add descriptive alt text" style="background-size: cover; background-image: url(data:image/svg+xml;base64,base64EncodedSVG);">'
  )
})
