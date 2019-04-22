export default class DataUriPlugin {
  constructor(options) {
    this.options = options
  }

  encodeBase64(rawSVG) {
    return Buffer.from(rawSVG).toString('base64')
  }

  apply(svg) {
    const base64svg = this.encodeBase64(svg)

    return `data:image/svg+xml;base64,${base64svg}`
  }
}
