const encodeBase64 = rawSVG => Buffer.from(rawSVG).toString('base64')

class Base64EncodePlugin {
  constructor(options) {
    this.options = options
  }

  apply(svg) {
    const base64svg = encodeBase64(svg)

    return `data:image/svg+xml;base64,${base64svg}`
  }
}

module.exports = Base64EncodePlugin
