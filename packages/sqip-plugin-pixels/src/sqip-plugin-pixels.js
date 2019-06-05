import sharp from 'sharp'
import window from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import { SqipPlugin } from 'sqip'

export default class PixelsPlugin extends SqipPlugin {
  constructor({ pluginOptions }) {
    super(...arguments)
    this.options = pluginOptions

    registerWindow(window, window.document)
  }

  async apply(imageBuffer) {
    if (this.metadata.type === 'svg' || !Buffer.isBuffer(imageBuffer)) {
      throw new Error(
        'The pixels plugin needs a raster image buffer as input. Check if you run this plugin in the first place.'
      )
    }

    const { data, info } = await sharp(imageBuffer)
      .resize({ width: 8 })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const sizeFactor = 100

    let column = 0
    let row = 0

    const canvas = SVG().size(info.width * sizeFactor, info.height * sizeFactor)
    for (var i = 0; i < data.length; i += 3) {
      var red = data[i]
      var green = data[i + 1]
      var blue = data[i + 2]
      canvas
        .rect(1 * sizeFactor, 1 * sizeFactor)
        .attr({ fill: `rgb(${red},${green},${blue})` })
        .move(column * sizeFactor, row * sizeFactor)
      column++
      if (column >= info.width) {
        column = 0
        row++
      }
    }

    return canvas.svg()
  }
}
