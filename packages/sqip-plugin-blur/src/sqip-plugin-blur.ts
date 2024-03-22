import {
  loadSVG,
  PluginOptions,
  SqipPlugin,
  SqipPluginOptions,
  SqipCliOptionDefinition
} from 'sqip'

import { SVG, registerWindow } from '@svgdotjs/svg.js'

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

  async apply(imageBuffer: Buffer): Promise<Buffer> {
    if (!this.options.blur) {
      return imageBuffer
    }
    const blurredResult = await this.applyBlurFilter(imageBuffer.toString())
    return Buffer.from(blurredResult)
  }

  async applyBlurFilter(svg: string): Promise<string> {
    if (!this.options.blur) {
      return svg
    }

    const { createSVGWindow } = await import('svgdom')
    const window = createSVGWindow()
    const document = window.document

    registerWindow(window, document)

    const canvas = await loadSVG(svg)
    const blurFilterId = 'b'
    const group = SVG(`<g filter="url(#${blurFilterId})"/>`)

    canvas.children().each((child) => child.putIn(group))

    group.addTo(canvas)

    SVG(
      `<filter id="${blurFilterId}">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${this.options.blur}" />
        <feComponentTransfer>
            <feFuncA type="discrete" tableValues="1 1"/>
        </feComponentTransfer>
      </filter>`
    )
      .addTo(canvas)
      .front()
    return canvas.svg()
  }
}
