import SVGO from 'svgo'
import SvgoPlugin from '../../src/sqip-plugin-svgo'

jest.mock('svgo')

const optimizeMock = jest.fn(() => Promise.resolve({ data: 'mocked' }))

SVGO.mockImplementation(function SVGOmock() {
  this.optimize = optimizeMock
})

test('runSVGO', async () => {
  const svgoPlugin = new SvgoPlugin({})
  const inputSVG = Buffer.from('<svg />')
  await svgoPlugin.apply(inputSVG)
  expect(SVGO).toHaveBeenCalledTimes(1)
  expect(SVGO.mock.calls[0]).toMatchSnapshot()
  expect(optimizeMock).toHaveBeenCalledTimes(1)
  expect(optimizeMock.mock.calls[0][0]).toBe(inputSVG)
})
