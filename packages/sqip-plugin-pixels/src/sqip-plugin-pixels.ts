import sharp from 'sharp'
import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import {
  PluginOptions,
  SqipCliOptionDefinition,
  SqipImageMetadata,
  SqipPlugin,
  SqipPluginOptions,
} from 'sqip'

interface PixelOptions extends PluginOptions {
  width?: number
  pixelSize?: number
}

interface PixelConfig extends PluginOptions {
  width: number
  pixelSize: number
}

interface PixelPluginOptions extends SqipPluginOptions {
  pluginOptions: PixelOptions
}

export default class PixelsPlugin extends SqipPlugin {
  static get cliOptions(): SqipCliOptionDefinition[] {
    return [
      {
        name: 'width',
        type: Number,
        description: 'The number of horizontal pixels',
        defaultValue: 8
      },
      {
        name: 'pixelSize',
        description: 'Size of every pixel in px',
        defaultValue: 100
      }
    ]
  }
  public options: PixelConfig

  constructor(options: PixelPluginOptions) {
    super(options)

    const { pluginOptions } = options

    this.options = Object.assign(
      {},
      { width: 8, pixelSize: 100 },
      pluginOptions
    )

    const window = createSVGWindow()
    const document = window.document

    registerWindow(window, document)
  }

  async apply(
    imageBuffer: Buffer,
    metadata: SqipImageMetadata
  ): Promise<Buffer> {
    if (metadata.type === 'svg') {
      throw new Error(
        'The pixels plugin needs a raster image buffer as input. Check if you run this plugin in the first place.'
      )
    }

    const { width, pixelSize } = this.options

    const { data, info } = await sharp(imageBuffer)
      .resize({ width })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixelHeight = pixelSize // Math.floor(pixelSize * (info.height / info.width))

    let column = 0
    let row = 0

    const newWidth = info.width * pixelSize
    const newHeight = info.height * pixelHeight

    const canvas = SVG().size(newWidth, newHeight)

    for (let i = 0; i < data.length; i += info.channels) {
      const red = data[i]
      const green = data[i + 1]
      const blue = data[i + 2]
      canvas
        .rect(1 * pixelSize, 1 * pixelHeight)
        .attr({ fill: `rgb(${red},${green},${blue})` })
        .move(column * pixelSize, row * pixelHeight)
      column++
      if (column >= info.width) {
        column = 0
        row++
      }
    }

    metadata.type = 'svg'
    metadata.mimeType = 'image/svg'
    metadata.height = newHeight
    metadata.width = newWidth

    return Buffer.from(canvas.svg())
  }
}
