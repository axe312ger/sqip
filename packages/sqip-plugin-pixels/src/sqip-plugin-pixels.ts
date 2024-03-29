import sharp from 'sharp'
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import {
  PluginOptions,
  SqipCliOptionDefinition,
  SqipImageMetadata,
  SqipPlugin,
  SqipPluginOptions,
  parseColor
} from 'sqip'

interface PixelOptions extends PluginOptions {
  pixels?: number
  backgroundColor?: string
}

interface PixelConfig extends PluginOptions {
  pixels: number
  backgroundColor: string
}

interface PixelPluginOptions extends SqipPluginOptions {
  pluginOptions: PixelOptions
}

const HEX = '0123456789ABCDEF'
const toHex = (value: number) => {
  let rtn = ''
  while (value !== 0)
    (rtn = HEX[value % 16] + rtn), (value = Math.floor(value / 16))
  return rtn
}

export default class PixelsPlugin extends SqipPlugin {
  static get cliOptions(): SqipCliOptionDefinition[] {
    return [
      {
        name: 'pixels',
        type: Number,
        description: 'The number of pixels of longer axis',
        defaultValue: 8
      },
      {
        name: 'backgroundColor',
        type: String,
        description:
          'If a pixel has this color, it will be handled as transparent pixel. (Supports hex with alpha and names of palette colors)',
        defaultValue: 'DETECT'
      }
    ]
  }
  public options: PixelConfig

  constructor(options: PixelPluginOptions) {
    super(options)

    const { pluginOptions } = options

    this.options = Object.assign(
      {},
      { pixels: 8, backgroundColor: 'DETECT' },
      pluginOptions
    )
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

    const { createSVGWindow } = await import('svgdom')
    const window = createSVGWindow()
    const document = window.document

    registerWindow(window, document)

    const { pixels, backgroundColor } = this.options

    const bg =
      backgroundColor === 'DETECT'
        ? metadata.backgroundColor
        : parseColor({
            color: this.options.backgroundColor as string, // @todo TypeScript of our plugins really needs some love
            palette: metadata.palette
          })

    const pixelSize = Math.ceil(
      Math.max(metadata.width, metadata.height) / pixels
    )
    const pixelsHorizontal = Math.ceil(metadata.width / pixelSize)
    const pixelsVertical = Math.ceil(metadata.height / pixelSize)

    // Turn non-transparent pixels with detected background color into actually transparent pixels
    const { data: bgData, info: bgInfo } = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    for (let i = 0; i < bgData.length; i += 4) {
      if (
        `#${toHex(bgData[i])}${toHex(bgData[i + 1])}${toHex(bgData[i + 2])}` ===
          bg.toUpperCase() &&
        bgData[i + 3] === 255
      ) {
        bgData[i + 3] = 0
      }
    }

    const { data, info } = await sharp(bgData, {
      raw: {
        width: bgInfo.width,
        height: bgInfo.height,
        channels: 4
      }
    })
      .toFormat('png')
      .resize({
        width: pixelsHorizontal,
        height: pixelsVertical
      })
      .raw()
      .toBuffer({ resolveWithObject: true })

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
        // Outer pixels should overgrow the view port to support better blurring
        const horizontalSizeModifier =
          column === 0 || column === info.width - 1 ? 2 : 1
        const verticalSizeModifier =
          row === 0 || row === info.height - 1 ? 2 : 1
        const horizontalShift = column === 0 ? pixelSize * -1 : 0
        const verticalShift = row === 0 ? pixelSize * -1 : 0

        const rect = group
          .rect(
            horizontalSizeModifier * pixelSize,
            verticalSizeModifier * pixelSize
          )
          .move(
            column * pixelSize + horizontalShift,
            row * pixelSize + verticalShift
          )

        // Only use alpha when relevant
        if (parseFloat(alpha) < 1) {
          rect.attr({ fill: `rgba(${red},${green},${blue},${alpha})` })
        } else {
          rect.attr({ fill: `rgb(${red},${green},${blue})` })
        }
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
