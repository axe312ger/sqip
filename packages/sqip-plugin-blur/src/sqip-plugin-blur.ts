import {
  loadSVG,
  PluginOptions,
  SqipPlugin,
  SqipPluginOptions,
  SqipCliOptionDefinition
} from 'sqip'

const PRIMITIVE_SVG_ELEMENTS = 'circle, ellipse, line, polygon, path, rect, g'

const patchSVGGroup = (svg: string): string => {
  const $ = loadSVG(svg)

  const $svg = $('svg')
  const $primitiveShapes = $svg.children(PRIMITIVE_SVG_ELEMENTS)

  // Check if actual shapes are grouped
  if ($primitiveShapes.filter('g').length === 1) {
    const $group = $('<g/>')
    const $realShapes = $primitiveShapes.not('rect:first-child')

    $group.append($realShapes)
    $svg.append($group)
  }

  return $.html()
}

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
    let svg = this.prepareSVG(imageBuffer.toString())
    if (this.options.blur) {
      svg = this.applyBlurFilter(svg)
    }
    return Buffer.from(svg)
  }

  // Prepare SVG. For now, this will just ensure that the viewbox attribute is set
  prepareSVG(svg: string): string {
    const $ = loadSVG(svg)
    const $svg = $('svg')
    const { width, height } = this.metadata

    // Ensure viewbox
    if (!$svg.is('[viewBox]')) {
      if (!(width && height)) {
        throw new Error(
          `SVG is missing viewBox attribute while Width and height were not passed:\n\n${svg}`
        )
      }
      $svg.attr('viewBox', `0 0 ${width} ${height}`)
    }

    const $bgRect = $svg
      .children(PRIMITIVE_SVG_ELEMENTS)
      .filter('rect:first-child[fill]')

    // Check if filling background rectangle exists
    // This must exist for proper blur and other transformations
    if (!$bgRect.length) {
      throw new Error(
        `The SVG must have a rect as first shape element which represents the svg background color:\n\n${svg}`
      )
    }

    // Remove x and y attributes since they default to 0
    // @todo test in rare browsers
    $bgRect.removeAttr('x')
    $bgRect.removeAttr('y')

    // Improve compression via simplifying fill
    $bgRect.attr('width', '100%')
    $bgRect.attr('height', '100%')

    return $.html()
  }

  applyBlurFilter(svg: string): string {
    if (!this.options.blur) {
      return svg
    }
    const patchedSVG = patchSVGGroup(svg)
    const $ = loadSVG(patchedSVG)
    const blurFilterId = 'b'
    $('svg > g').attr('filter', `url(#${blurFilterId})`)
    $('svg').prepend(
      `<filter id="${blurFilterId}"><feGaussianBlur stdDeviation="${this.options.blur}" />`
    )

    return $.html()
  }
}
