import SVGO from 'svgo'
import SvgoPlugin from '../../src/sqip-plugin-svgo'
import { mocked } from 'ts-jest/utils'

jest.mock('svgo')

const mockedSVGO = mocked(SVGO, true)

mockedSVGO.prototype.optimize.mockImplementation(() =>
  Promise.resolve({ data: 'mocked', info: { width: '1024', height: '768' } })
)

const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['svgo']
}

test('runSVGO', async () => {
  const svgoPlugin = new SvgoPlugin({
    pluginOptions: {},
    options: {},
    sqipConfig: mockedConfig
  })
  const inputSVG = Buffer.from('<svg />')
  await svgoPlugin.apply(inputSVG)
  expect(mockedSVGO).toHaveBeenCalledTimes(1)
  expect(mockedSVGO.mock.calls[0]).toMatchSnapshot()
  expect(mockedSVGO.prototype.optimize).toHaveBeenCalledTimes(1)
  expect(mockedSVGO.prototype.optimize.mock.calls[0][0]).toBe(
    inputSVG.toString()
  )
})
