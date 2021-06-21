import sharp from 'sharp'
import { createSVGWindow } from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import {
  PluginOptions,
  SqipCliOptionDefinition,
  SqipPlugin,
  SqipPluginOptions
} from 'sqip'

declare module '@svgdotjs/svg.js' {
  export function registerWindow(window: unknown, document: unknown): unknown
}

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

  async apply(imageBuffer: Buffer): Promise<Buffer> {
    if (this.metadata.type === 'svg') {
      throw new Error(
        'The pixels plugin needs a raster image buffer as input. Check if you run this plugin in the first place.'
      )
    }

    const { width, pixelSize } = this.options

    const { data, info } = await sharp(imageBuffer)
      .resize({ width })
      .raw()
      .toBuffer({ resolveWithObject: true })

    let column = 0
    let row = 0

    const canvas = SVG().size(info.width * pixelSize, info.height * pixelSize)

    for (let i = 0; i < data.length; i += info.channels) {
      const red = data[i]
      const green = data[i + 1]
      const blue = data[i + 2]
      canvas
        .rect(1 * pixelSize, 1 * pixelSize)
        .attr({ fill: `rgb(${red},${green},${blue})` })
        .move(column * pixelSize, row * pixelSize)
      column++
      if (column >= info.width) {
        column = 0
        row++
      }
    }

    return Buffer.from(canvas.svg())
  }
}
