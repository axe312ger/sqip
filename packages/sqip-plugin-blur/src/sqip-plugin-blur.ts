import {
  loadSVG,
  PluginOptions,
  SqipPlugin,
  SqipPluginOptions,
  SqipCliOptionDefinition
} from 'sqip'

import { SVG } from '@svgdotjs/svg.js'

interface BlurPluginOptions extends SqipPluginOptions {
  options: BlurOptions
}

interface BlurOptions extends PluginOptions {
  blur?: number
}

export default class SVGPlugin extends SqipPlugin {
  static get cliOptions(): SqipCliOptionDefinition[] {
    return [
      {
        name: 'blur',
        alias: 'b',
        type: Number,
        description:
          'Set the stdDeviation value for the GaussianBlur SVG filter. See: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur',
        defaultValue: 12
      }
    ]
  }
  constructor(options: BlurPluginOptions) {
    super(options)
    const { pluginOptions } = options
    this.options = { blur: 12, ...pluginOptions }
  }

  apply(imageBuffer: Buffer): Buffer {
    if (!this.options.blur) {
      return imageBuffer
    }
    return Buffer.from(this.applyBlurFilter(imageBuffer.toString()))
  }

  applyBlurFilter(svg: string): string {
    if (!this.options.blur) {
      return svg
    }

    const canvas = loadSVG(svg)
    const blurFilterId = 'b'
    const group = SVG(`<g filter="url(#${blurFilterId})"/>`)

    canvas.children().each(child => child.putIn(group))

    group.addTo(canvas)

    SVG(
      `<filter id="${blurFilterId}">
        <feGaussianBlur stdDeviation="${this.options.blur}" />
      </filter>`
    )
      .addTo(canvas)
      .front()
    return canvas.svg()
  }
}
