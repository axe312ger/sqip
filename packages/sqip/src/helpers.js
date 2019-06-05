import cheerio from 'cheerio'

export const loadSVG = svg => {
  return cheerio.load(svg, {
    normalizeWhitespace: true,
    xmlMode: true
  })
}
