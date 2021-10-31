import { resolve, parse } from 'path'

import { promises as fs, createReadStream } from 'fs'
import brotliSize from 'brotli-size'
import gzipSize from 'gzip-size'
import prettyBytes from 'pretty-bytes'
import imageSize from 'probe-image-size'
import aspectRatio from 'aspect-ratio'
import cliProgress from 'cli-progress'

import { ORIGINAL, PROCESSED, DATASET, variants } from './config.mjs'

const { readdir, writeFile } = fs

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
  const imageFiles = allFiles.filter((file) => {
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
    const { width, height } = await imageSize(createReadStream(path))
    const ratio = aspectRatio(width, height)
    const dimensions = { width, height, ratio }

    const results = []
    for (const variant of variants) {
      const { name: variantName, task, resultFileType } = variant
      const name = `${filename}-${variantName}.${resultFileType}`
      const dist = resolve(PROCESSED, name)
      const start = process.hrtime.bigint()
      let result = await task({ path, dist })
      const processTime = Number(process.hrtime.bigint() - start)

      const sizes = getSizes(result)
      if (name === 'original-minified') {
        result = 'trimmed'
      }
      const { width, height } = await imageSize(createReadStream(dist))
      const ratio = aspectRatio(width, height)
      const dimensions = { width, height, ratio }
      results.push({ variantName, name, dist, sizes, dimensions, processTime })
      progressBar.increment(1)
    }

    images.push({ path, filename, results, dimensions })
  }

  progressBar.stop()

  console.log('Writing dataset.json...')
  await writeFile(DATASET, JSON.stringify(images, null, 2))
})()
