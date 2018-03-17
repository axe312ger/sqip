const SVGO = require('svgo')

// USe SVGO with settings for maximum compression to optimize the Primitive-generated SVG
const runSVGO = primitiveSvg => {
  const svgo = new SVGO({ multipass: true, floatPrecision: 1 })
  let retVal = ''
  svgo.optimize(primitiveSvg, ({ data }) => (retVal = data))
  return retVal
}

// (Naively) Add Group to SVG
// For schema, see: https://github.com/fogleman/primitive/blob/master/primitive/model.go#L86
const patchSVGGroup = svg => {
  const gStartIndex =
    svg.match(/<path.*?>/).index + svg.match(/<path.*?>/)[0].length
  const gEndIndex = svg.match(/<\/svg>/).index
  const svgG = `<g filter='url(#c)' fill-opacity='.5'>`
  return `${svg.slice(0, gStartIndex)}${svgG}${svg.slice(
    gStartIndex,
    gEndIndex
  )}</g></svg>`
}

// Add viewbox and preserveAspectRatio attributes as well as a Gaussian Blur filter to the SVG
// When missing, add group (element with blur applied) using patchSVGGroup()
// We initially worked with a proper DOM parser to manipulate the SVG's XML, but it was very opinionated about SVG syntax and kept introducing unwanted tags. So we had to resort to RegEx replacements
const replaceSVGAttrs = (svg, { width, height, blur }) => {
  let filter = ''
  let blurStdDev = blur || 12
  let blurFilterId = 'b'
  let newSVG = svg

  if (blur !== 0) {
    if (svg.match(/<svg.*?><path.*?><g/) === null) {
      blurStdDev = 55
      newSVG = patchSVGGroup(newSVG)
      blurFilterId = 'c'
    } else {
      newSVG = newSVG.replace(/(<g)/, `<g filter="url(#${blurFilterId})"`)
    }
    filter = `<filter id="${blurFilterId}"><feGaussianBlur stdDeviation="${blurStdDev}" /></filter>`
  }
  return newSVG.replace(
    /(<svg)(.*?)(>)/,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${filter}`
  )
}

module.exports = {
  runSVGO,
  replaceSVGAttrs
}
