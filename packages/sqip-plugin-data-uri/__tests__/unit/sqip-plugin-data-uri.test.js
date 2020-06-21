import sqipPluginDataUri from '../../src/sqip-plugin-data-uri'

const EXAMPLE_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" stroke="#000" stroke-width="3"/></svg>'
)

describe('sqip-plugin-data-uri', () => {
  it('does not touch svg', () => {
    const plugin = new sqipPluginDataUri({})
    const result = plugin.apply(EXAMPLE_SVG)
    expect(result).toBe(EXAMPLE_SVG)
  })
  it('encodes in mini-svg-data-uri and base64', () => {
    const metadata = {}
    const plugin = new sqipPluginDataUri({ metadata })
    plugin.apply(EXAMPLE_SVG)
    expect(metadata).toMatchSnapshot()
  })
})
