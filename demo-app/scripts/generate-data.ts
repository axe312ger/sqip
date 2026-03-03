import { resolve, parse, dirname } from 'path'
import { fileURLToPath } from 'url'
import { promises as fs, existsSync } from 'fs'
import { gzipSync, brotliCompressSync } from 'zlib'

import sharp from 'sharp'
import lqipModern from 'lqip-modern'
import { sqip } from 'sqip'
import Vibrant from '@behold/sharp-vibrant'

import { variants } from '../src/data/variants.js'
import type { VariantConfig } from '../src/data/variants.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ORIGINAL = resolve(__dirname, '../../demo/public/original')
const GENERATED = resolve(__dirname, '../generated')
const PROCESSED = resolve(__dirname, '../public/processed')
const DATASET = resolve(GENERATED, 'dataset.json')

interface Sizes {
  originalBytes: number
  gzipBytes: number
  brotliBytes: number
}

interface Dimensions {
  width: number
  height: number
}

interface VariantResult {
  variantName: string
  category: string
  title: string
  pluginChain: string[]
  fileName: string
  resultFileType: string
  sizes: Sizes
  dimensions: Dimensions
  processTimeMs: number
  configSnippet: string
  dependencies: string[]
}

interface PaletteEntry {
  [key: string]: string | undefined
}

interface ImageEntry {
  filename: string
  originalPath: string
  dimensions: Dimensions
  originalSize: number
  referenceImage: string
  palette: PaletteEntry
  results: VariantResult[]
}

function getSizes(input: string | Buffer): Sizes {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return {
    originalBytes: buf.byteLength,
    gzipBytes: gzipSync(buf).byteLength,
    brotliBytes: brotliCompressSync(buf).byteLength,
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function getDimensions(filePath: string): Promise<Dimensions> {
  const meta = await sharp(filePath).metadata()
  return { width: meta.width || 0, height: meta.height || 0 }
}

function dataURItoBuffer(dataURI: string): Buffer {
  const base64Match = dataURI.match(/^data:[^;]+;base64,(.+)$/)
  if (base64Match) {
    return Buffer.from(base64Match[1], 'base64')
  }
  const svgMatch = dataURI.match(/^data:[^,]+,(.+)$/)
  if (svgMatch) {
    return Buffer.from(decodeURIComponent(svgMatch[1]))
  }
  return Buffer.from(dataURI)
}

async function runVariant(
  variant: VariantConfig,
  imagePath: string,
  dist: string
): Promise<Buffer | string> {
  if (variant.thumbnail) {
    const buf = await sharp(imagePath).resize(300).jpeg({ quality: 80 }).toBuffer()
    await fs.writeFile(dist, buf)
    return buf
  }

  if (variant.lqipModern) {
    const opts: Record<string, unknown> = {
      outputFormat: variant.lqipModern.outputFormat,
    }
    if (variant.lqipModern.resize) opts.resize = variant.lqipModern.resize
    const result = await lqipModern(imagePath, opts as any)
    await fs.writeFile(dist, result.content)
    return result.content
  }

  // sqip variant
  const plugins = variant.sqipConfig!.plugins
  const result = await sqip({ input: imagePath, plugins, silent: true })
  const { content, metadata } = Array.isArray(result) ? result[0] : result

  // Blurhash outputs a JPEG as dataURIBase64; SVG plugins output dataURI
  const dataURI = (metadata.dataURIBase64 || metadata.dataURI) as string | undefined
  if (dataURI) {
    const buf = dataURItoBuffer(dataURI)
    await fs.writeFile(dist, buf)
    return buf
  }

  await fs.writeFile(dist, content)
  return content
}

async function main() {
  await fs.mkdir(PROCESSED, { recursive: true })
  await fs.mkdir(GENERATED, { recursive: true })

  if (!existsSync(ORIGINAL)) {
    console.error(`Source images not found at: ${ORIGINAL}`)
    console.error('Make sure demo/public/original/ contains test images.')
    process.exit(1)
  }

  // Curated subset for good visual diversity + faster generation
  const INCLUDE = new Set([
    'aaron-burden-151465-unsplash.jpg',
    'anthony-esau-173126-unsplash.jpg',
    'aron-visuals-974734-unsplash.jpg',
    'beach.jpg',
    'eric-marty-780304-unsplash.jpg',
    'hashbite-consent-manager-logo.png',
    'ian-dooley-298769-unsplash.jpg',
    'mona-lisa.jpg',
  ])

  const allFiles = await fs.readdir(ORIGINAL)
  const imageFiles = allFiles.filter((file) => {
    const { ext } = parse(file)
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase())) return false
    return INCLUDE.size === 0 || INCLUDE.has(file)
  })

  const total = imageFiles.length * variants.length
  console.log(`Found ${imageFiles.length} images, processing ${variants.length} variants each`)
  console.log(`Total: ${total} operations\n`)

  let completed = 0
  const images: ImageEntry[] = []

  for (const file of imageFiles) {
    const { name: filename } = parse(file)
    const imagePath = resolve(ORIGINAL, file)
    const dimensions = await getDimensions(imagePath)
    const originalStat = await fs.stat(imagePath)

    // Generate a 1200px reference JPEG for hover comparison
    const refFileName = `${filename}-reference.jpg`
    const refPath = resolve(PROCESSED, refFileName)
    await sharp(imagePath).resize(1200).jpeg({ quality: 85 }).toBuffer()
      .then(buf => fs.writeFile(refPath, buf))

    // Extract color palette using sharp-vibrant
    const palette: PaletteEntry = {}
    try {
      const imgBuffer = await fs.readFile(imagePath)
      const getPalette = (buf: Buffer) => Vibrant.from(buf).quality(0).getPalette()
      let paletteResult
      try {
        paletteResult = await getPalette(imgBuffer)
      } catch {
        paletteResult = await getPalette(await sharp(imgBuffer).tiff().toBuffer())
      }
      const KEYS = ['Vibrant', 'DarkVibrant', 'LightVibrant', 'Muted', 'DarkMuted', 'LightMuted'] as const
      for (const key of KEYS) {
        palette[key] = paletteResult.palette[key]?.hex
      }
    } catch (err) {
      console.error(`\nWarning: could not extract palette for ${filename}:`, err)
    }

    const results: VariantResult[] = []

    for (const variant of variants) {
      const outputFile = `${filename}-${variant.name}.${variant.resultFileType}`
      const dist = resolve(PROCESSED, outputFile)

      const start = performance.now()

      try {
        const result = await runVariant(variant, imagePath, dist)
        const processTimeMs = Math.round(performance.now() - start)
        const sizes = getSizes(result)

        let resultDimensions: Dimensions
        try {
          resultDimensions = await getDimensions(dist)
        } catch {
          resultDimensions = { width: 0, height: 0 }
        }

        results.push({
          variantName: variant.name,
          category: variant.category,
          title: variant.title,
          pluginChain: variant.pluginChain,
          fileName: outputFile,
          resultFileType: variant.resultFileType,
          sizes,
          dimensions: resultDimensions,
          processTimeMs,
          configSnippet: variant.configSnippet,
          dependencies: variant.dependencies,
        })
      } catch (err) {
        console.error(`\nError: ${filename} / ${variant.name}:`, err)
        results.push({
          variantName: variant.name,
          category: variant.category,
          title: variant.title,
          pluginChain: variant.pluginChain,
          fileName: outputFile,
          resultFileType: variant.resultFileType,
          sizes: { originalBytes: 0, gzipBytes: 0, brotliBytes: 0 },
          dimensions: { width: 0, height: 0 },
          processTimeMs: 0,
          configSnippet: variant.configSnippet,
          dependencies: variant.dependencies,
        })
      }

      completed++
      const pct = ((completed / total) * 100).toFixed(0)
      process.stdout.write(
        `\r  [${pct}%] ${completed}/${total} — ${filename} / ${variant.title}`.padEnd(80)
      )
    }

    images.push({
      filename,
      originalPath: file,
      dimensions,
      originalSize: originalStat.size,
      referenceImage: refFileName,
      palette,
      results,
    })
  }

  console.log('\n')

  // Write dataset
  await fs.writeFile(DATASET, JSON.stringify(images, null, 2))
  console.log(`Dataset written to ${DATASET}`)
  console.log(`Processed images written to ${PROCESSED}`)

  // Print summary
  console.log('\n--- Summary ---')
  for (const variant of variants) {
    const avgSize =
      images.reduce((sum, img) => {
        const r = img.results.find((r) => r.variantName === variant.name)
        return sum + (r?.sizes.gzipBytes || 0)
      }, 0) / images.length
    const avgTime =
      images.reduce((sum, img) => {
        const r = img.results.find((r) => r.variantName === variant.name)
        return sum + (r?.processTimeMs || 0)
      }, 0) / images.length
    console.log(
      `  ${variant.title.padEnd(28)} avg gzip: ${formatBytes(avgSize).padEnd(10)} avg time: ${Math.round(avgTime)}ms`
    )
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
