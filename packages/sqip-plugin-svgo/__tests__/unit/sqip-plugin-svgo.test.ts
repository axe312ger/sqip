import SVGO from 'svgo'
import SvgoPlugin from '../../src/sqip-plugin-svgo'

jest.mock('svgo')

const mockedSVGOOptimize = SVGO.optimize as jest.MockedFunction<
  typeof SVGO.optimize
>

mockedSVGOOptimize.mockImplementation(() => ({
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

  expect(mockedSVGOOptimize).toHaveBeenCalledTimes(1)
  expect(mockedSVGOOptimize.mock.calls[0][0]).toBe(inputSVG.toString())
  expect(mockedSVGOOptimize.mock.calls[0]).toMatchSnapshot()
})
