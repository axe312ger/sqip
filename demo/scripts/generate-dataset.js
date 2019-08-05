const { resolve, parse } = require('path')
const { hrtime } = require('process')

const { readdir, writeJSON } = require('fs-extra')
const brotliSize = require('brotli-size').default
const gzipSize = require('gzip-size')
const prettyBytes = require('pretty-bytes')
const imageSize = require('image-size')
const aspectRatio = require('aspect-ratio')
const cliProgress = require('cli-progress')

const { ORIGINAL, PROCESSED, DATASET, variants } = require('./config')

function getSizes(input) {
  const originalBytes = Buffer.byteLength(input)
  const gzipBytes = gzipSize.sync(input)
  const brotliBytes = brotliSize.sync(input)
  return {
    originalBytes,
    originalHuman: prettyBytes(originalBytes),
    gzipBytes,
    gzipHuman: prettyBytes(gzipBytes),
    brotliBytes,
    brotliHuman: prettyBytes(brotliBytes)
  }
}

;(async () => {
  // read the images
  const allFiles = await readdir(ORIGINAL)
  const imageFiles = allFiles.filter(file => {
    const { ext } = parse(file)
    return ['.jpg', '.png'].includes(ext)
  })

  const progressBar = new cliProgress.Bar(
    {},
    cliProgress.Presets.shades_classic
  )
  progressBar.start(imageFiles.length * variants.length, 0)

  const images = []
  for (const file of imageFiles) {
    const { name: filename } = parse(file)

    const path = resolve(ORIGINAL, file)
    const { width, height } = imageSize(path)
    const ratio = aspectRatio(width, height)
    const dimensions = { width, height, ratio }

    const results = []
    for (const variant of variants) {
      const { name: variantName, task, resultFileType } = variant
      const name = `${filename}-${variantName}.${resultFileType}`
      const dist = resolve(PROCESSED, name)
      const start = hrtime()
      let result = await task({ path, dist })
      const processTime = process.hrtime(start)

      const sizes = getSizes(result)
      if (name === 'original-minified') {
        result = 'trimmed'
      }
      const { width, height } = imageSize(dist)
      const ratio = aspectRatio(width, height)
      const dimensions = { width, height, ratio }
      results.push({ variantName, name, dist, sizes, dimensions, processTime })
      progressBar.increment(1)
    }

    images.push({ path, filename, results, dimensions })
  }

  progressBar.stop()

  console.log('Writing dataset.json...')
  await writeJSON(DATASET, images, { spaces: 2 })
})()
