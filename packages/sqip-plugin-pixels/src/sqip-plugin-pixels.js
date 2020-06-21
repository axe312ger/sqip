import sharp from 'sharp'
import window from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import { SqipPlugin } from 'sqip'

export default class PixelsPlugin extends SqipPlugin {
  static get cliOptions() {
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

  constructor({ pluginOptions }) {
    super(...arguments)
    this.options = { width: 8, pixelSize: 100, ...pluginOptions }

    registerWindow(window, window.document)
  }

  async apply(imageBuffer) {
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
    for (var i = 0; i < data.length; i += 4) {
      var red = data[i]
      var green = data[i + 1]
      var blue = data[i + 2]
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
