import SVGO from 'svgo'
import cheerio from 'cheerio'

const PRIMITIVE_SVG_ELEMENTS = 'circle, ellipse, line, polygon, path, rect, g'

// USe SVGO with settings for maximum compression to optimize the Primitive-generated SVG
const runSVGO = primitiveSvg => {
  const svgo = new SVGO({ multipass: true, floatPrecision: 1 })
  return svgo.optimize(primitiveSvg)
}

const loadSVG = svg => {
  return cheerio.load(svg, {
    normalizeWhitespace: true,
    xmlMode: true
  })
}

// Prepare SVG. For now, this will just ensure that the viewbox attribute is set
const prepareSVG = (svg, { width, height }) => {
  const $ = loadSVG(svg)

  const $svg = $('svg')

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
  $bgRect.attr('x', null)
  $bgRect.attr('y', null)

  // Improve compression via simplifying fill
  $bgRect.attr('width', '100%')
  $bgRect.attr('height', '100%')

  return $.html()
}

const patchSVGGroup = svg => {
  const $ = loadSVG(svg)

  const $svg = $('svg')
  const $primitiveShapes = $svg.children(PRIMITIVE_SVG_ELEMENTS)

  // Check if actual shapes are grouped
  if (!$primitiveShapes.filter('g').length !== 1) {
    const $group = $('<g/>')
    const $realShapes = $primitiveShapes.not('rect:first-child')

    $group.append($realShapes)
    $svg.append($group)
  }

  return $.html()
}

const applyBlurFilter = (svg, { blur }) => {
  if (!blur) {
    return svg
  }
  const patchedSVG = patchSVGGroup(svg)
  const $ = loadSVG(patchedSVG)
  const blurFilterId = 'b'
  $('svg > g').attr('filter', `url(#${blurFilterId})`)
  $('svg').prepend(
    `<filter id="${blurFilterId}"><feGaussianBlur stdDeviation="${blur}" />`
  )

  return $.html()
}

module.exports = {
  runSVGO,
  prepareSVG,
  applyBlurFilter
}
