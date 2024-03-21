import sharp from 'sharp'
import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import {
  PluginOptions,
  SqipCliOptionDefinition,
  SqipImageMetadata,
  SqipPlugin,
  SqipPluginOptions
} from 'sqip'

interface PixelOptions extends PluginOptions {
  pixels?: number
}

interface PixelConfig extends PluginOptions {
  pixels: number
}

interface PixelPluginOptions extends SqipPluginOptions {
  pluginOptions: PixelOptions
}

export default class PixelsPlugin extends SqipPlugin {
  static get cliOptions(): SqipCliOptionDefinition[] {
    return [
      {
        name: 'pixels',
        type: Number,
        description: 'The number of pixels of longer axis',
        defaultValue: 8
      }
    ]
  }
  public options: PixelConfig

  constructor(options: PixelPluginOptions) {
    super(options)

    const { pluginOptions } = options

    this.options = Object.assign({}, { pixels: 8, scale: 1.01 }, pluginOptions)

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

    const { pixels } = this.options

    const resizeConfig: { height?: number; width?: number } = {}
    let useWidth = true
    if (metadata.height > metadata.width) {
      useWidth = false
      resizeConfig.height = pixels
    } else {
      resizeConfig.width = pixels
    }

    const { data, info } = await sharp(imageBuffer)
      .resize(resizeConfig)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const pixelSize = Math.ceil(
      useWidth ? metadata.width : metadata.height / pixels
    )

    let column = 0
    let row = 0

    const canvas = SVG().size(metadata.width, metadata.height)
    // canvas.css('outline', '1px dashed red')

    const group = canvas.group()

    const overflowHorizontal = info.width * pixelSize - metadata.width
    const overflowVertical = info.height * pixelSize - metadata.height

    if (metadata.width % pixelSize !== 0 || metadata.height % pixelSize !== 0) {
      group.attr(
        'transform',
        `translate(-${(overflowHorizontal / 2).toFixed(3)}, -${(overflowVertical / 2).toFixed(3)})`
      )
    }

    for (let i = 0; i < data.length; i += info.channels) {
      const red = data[i]
      const green = data[i + 1]
      const blue = data[i + 2]
      const alpha = (data[i + 3] / 255).toFixed(2)
      if (parseFloat(alpha) > 0) {
        group
          .rect(1 * pixelSize, 1 * pixelSize)
          .attr({ fill: `rgba(${red},${green},${blue},${alpha})` })
          .move(column * pixelSize, row * pixelSize)
      }
      column++
      if (column >= info.width) {
        column = 0
        row++
      }
    }

    metadata.type = 'svg'
    metadata.mimeType = 'image/svg'

    return Buffer.from(canvas.svg())
  }
}
