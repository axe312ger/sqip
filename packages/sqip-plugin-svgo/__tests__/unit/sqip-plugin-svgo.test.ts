import { vi, type MockedFunction } from 'vitest'
import { optimize } from 'svgo'
import SvgoPlugin from '../../src/sqip-plugin-svgo'

vi.mock('svgo', () => ({
  optimize: vi.fn()
}))

const mockedSVGOOptimize = optimize as MockedFunction<typeof optimize>

mockedSVGOOptimize.mockImplementation(() => ({
  data: 'mocked'
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
