import SVGO from 'svgo'
import SvgoPlugin from '../../src/sqip-plugin-svgo'
import { mocked } from 'ts-jest/utils'

jest.mock('svgo')

const mockedSVGO = mocked(SVGO, true)

mockedSVGO.optimize.mockImplementation(() => ({
  data: 'mocked',
  info: { width: '1024', height: '768' },
  error: undefined,
  modernError: undefined
}))

const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['svgo']
}

test('runSVGO', () => {
  const svgoPlugin = new SvgoPlugin({
    pluginOptions: {},
    options: {},
    sqipConfig: mockedConfig
  })
  const inputSVG = Buffer.from('<svg />')
  svgoPlugin.apply(inputSVG)

  expect(mockedSVGO.optimize).toHaveBeenCalledTimes(1)
  expect(mockedSVGO.optimize.mock.calls[0][0]).toBe(inputSVG.toString())
  expect(mockedSVGO.optimize.mock.calls[0]).toMatchSnapshot()
})
