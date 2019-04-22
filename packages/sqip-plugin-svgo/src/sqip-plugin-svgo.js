import SVGO from 'svgo'

// SVGO with settings for maximum compression to optimize the Primitive-generated SVG
export default class SVGOPlugin {
  constructor(options = {}) {
    this.options = { multipass: true, floatPrecision: 1, ...options }
  }
  apply(svg) {
    return this.optimize(svg)
  }
  async optimize(svg) {
    const { multipass, floatPrecision } = this.options

    const svgo = new SVGO({ multipass, floatPrecision })
    const { data } = await svgo.optimize(svg)
    return data
  }
}
