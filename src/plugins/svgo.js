const SVGO = require('svgo')

// SVGO with settings for maximum compression to optimize the Primitive-generated SVG
class SVGOPlugin {
  constructor(options) {
    this.options = options || {}
  }
  apply(svg) {
    return this.optimize(svg)
  }
  async optimize(svg) {
    const { multipass = true, floatPrecision = 1 } = this.options

    const svgo = new SVGO({ multipass, floatPrecision })
    const { data } = await svgo.optimize(svg)
    return data
  }
}

module.exports = SVGOPlugin
