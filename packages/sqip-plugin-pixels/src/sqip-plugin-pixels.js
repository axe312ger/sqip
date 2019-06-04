import sharp from 'sharp'
import window from 'svgdom'
import { SVG, registerWindow } from '@svgdotjs/svg.js'

export default class PixelsPlugin {
  constructor(options) {
    this.options = options

    registerWindow(window, window.document)
  }

  async apply() {
    const { input } = this.options

    const { data, info } = await sharp(input)
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
