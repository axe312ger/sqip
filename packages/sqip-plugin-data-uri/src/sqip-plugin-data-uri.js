import { SqipPlugin } from 'sqip'
import svgToMiniDataURI from 'mini-svg-data-uri'

export default class DataUriPlugin extends SqipPlugin {
  encodeBase64(rawSVG) {
    const base64 = Buffer.from(rawSVG).toString('base64')
    return `data:image/svg+xml;base64,${base64}`
  }

  apply(svg) {
    this.metadata.dataURI = svgToMiniDataURI(svg)
    this.metadata.dataURIBase64 = this.encodeBase64(svg)
    return svg
  }
}
