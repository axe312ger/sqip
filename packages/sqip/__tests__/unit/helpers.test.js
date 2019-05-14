import { resolve } from 'path'

import { getDimensions } from '../../src/helpers'

const logSpy = jest.spyOn(global.console, 'log')

test('getDimensions', () => {
  const result = getDimensions(resolve(__dirname, '../../../../demo/beach.jpg'))
  expect(result).toMatchSnapshot()
})
