import SVGO from 'svgo'

// SVGO with settings for maximum compression to optimize the Primitive-generated SVG
export default class SVGOPlugin {
  constructor(options = {}) {
    this.options = {
      multipass: true,
      floatPrecision: 1,
      plugins: [{ removeViewBox: false }],
      ...options
    }
  }
  async apply(svg) {
    const svgo = new SVGO(this.options)
    const { data } = await svgo.optimize(svg)
    return data
  }
}
