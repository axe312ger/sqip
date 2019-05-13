import sharp from 'sharp'
import chalk from 'chalk'
import SVG from 'svg.js'
import window from 'svgdom'

export default class PixelsPlugin {
  constructor(options) {
    this.options = options
  }

  async apply(svg) {
    const { input } = this.options
    console.log(this.options)

    const { data, info } = await sharp(input)
      .resize({ width: 8 })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const sizeFactor = 100

    // console.log({ data, info }, data.toJSON())
    let column = 0
    let row = 0
    let output = ''

    const document = window.document

    const canvas = SVG(window)(document.documentElement).size(
      info.width * sizeFactor,
      info.height * sizeFactor
    )
    for (var i = 0; i < data.length; i += 3) {
      var red = data[i]
      var green = data[i + 1]
      var blue = data[i + 2]
      canvas
        .rect(1 * sizeFactor, 1 * sizeFactor)
        .attr({ fill: `rgb(${red},${green},${blue})` })
        .move(column * sizeFactor, row * sizeFactor)
      column++
      output += chalk.rgb(red, green, blue)('◼')
      if (column >= info.width) {
        output += '\n'
        column = 0
        row++
      }
    }
    console.log(output)

    return canvas.svg()
  }
}
