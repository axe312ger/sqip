import { SqipImageMetadata, SqipPlugin } from 'sqip'
import svgToMiniDataURI from 'mini-svg-data-uri'

export default class DataUriPlugin extends SqipPlugin {
  encodeBase64(rawSVGBuffer: Buffer): string {
    const base64 = rawSVGBuffer.toString('base64')
    return `data:image/svg+xml;base64,${base64}`
  }

  apply(imageBuffer: Buffer, metadata: SqipImageMetadata): Buffer {
    metadata.dataURI = svgToMiniDataURI(imageBuffer.toString())
    metadata.dataURIBase64 = this.encodeBase64(imageBuffer)
    return imageBuffer
  }
}
