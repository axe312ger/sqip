import sqipPluginDataUri from '../../src/sqip-plugin-data-uri'

describe('sqip-plugin-data-uri', () => {
  it('encodes svg with base64', () => {
    const plugin = new sqipPluginDataUri()
    const result = plugin.apply('<svg />')
    expect(result).toMatchSnapshot()
  })
})
