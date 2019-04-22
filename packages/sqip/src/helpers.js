import sizeOf from 'image-size'
import cheerio from 'cheerio'

// In case the user the did not provide the --output switch and is thus opting for the default stdout output inside an <img>, prepare the base64 encoded version of the SVG
const encodeBase64 = rawSVG => Buffer.from(rawSVG).toString('base64')

// Use image-size to retrieve the width and height dimensions of the input image
// We need these sizes to pass to Primitive and to write the SVG viewbox
const getDimensions = filename => sizeOf(filename)

// Place the base64 encoded version as a background image inside an <img> tag, set width + height etc. and print it out as the final result
const printFinalResult = ({ width, height }, filename, svgBase64Encoded) => {
  const result = `<img width="${width}" height="${height}" src="${filename}" alt="Add descriptive alt text" style="background-size: cover; background-image: url(${svgBase64Encoded});">`
  console.log(result)
}

const loadSVG = svg => {
  return cheerio.load(svg, {
    normalizeWhitespace: true,
    xmlMode: true
  })
}

module.exports = {
  encodeBase64,
  getDimensions,
  printFinalResult,
  loadSVG
}
