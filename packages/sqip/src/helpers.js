import sizeOf from 'image-size'
import cheerio from 'cheerio'

// Use image-size to retrieve the width and height dimensions of the input image
// We need these sizes to pass to Primitive and to write the SVG viewbox
const getDimensions = filename => sizeOf(filename)

const loadSVG = svg => {
  return cheerio.load(svg, {
    normalizeWhitespace: true,
    xmlMode: true
  })
}

module.exports = {
  getDimensions,
  loadSVG
}
