import SVGO from 'svgo'
import SvgoPlugin from '../../src/sqip-plugin-svgo'
import { mocked } from 'ts-jest/utils'
import { Swatch } from '@vibrant/color'

jest.mock('svgo')

const mockedSVGO = mocked(SVGO, true)

mockedSVGO.prototype.optimize.mockImplementation(() =>
  Promise.resolve({ data: 'mocked', info: { width: '1024', height: '768' } })
)

const mockedMetadata = {
  width: 1024,
  height: 640,
  type: 'svg',
  originalHeight: 1024,
  originalWidth: 640,
  palette: {
    DarkMuted: new Swatch([4, 2, 0], 420),
    DarkVibrant: new Swatch([4, 2, 1], 421),
    LightMuted: new Swatch([4, 2, 2], 422),
    LightVibrant: new Swatch([4, 2, 3], 423),
    Muted: new Swatch([4, 2, 4], 424),
    Vibrant: new Swatch([4, 2, 5], 425)
  }
}
const mockedConfig = {
  input: 'mocked',
  output: 'mocked',
  plugins: ['svgo']
}

test('runSVGO', async () => {
  const svgoPlugin = new SvgoPlugin({
    pluginOptions: {},
    options: {},
    metadata: mockedMetadata,
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
