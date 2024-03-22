import path from 'path'

import Debug from 'debug'
import fs from 'fs-extra'

import Vibrant from '@behold/sharp-vibrant'
import type { Palette } from '@behold/sharp-vibrant/lib/color'
import { Swatch } from '@behold/sharp-vibrant/lib/color'
import sharp from 'sharp'
import termimg, { UnsupportedTerminalError } from 'term-img'
import Table from 'cli-table3'
import chalk from 'chalk'
import mime from 'mime'

import { OptionDefinition } from 'command-line-args'

import { locateFiles } from './helpers'

export { loadSVG, parseColor } from './helpers'

const debug = Debug('sqip')

const mainKeys = [
  'filename',
  'originalWidth',
  'originalHeight',
  'width',
  'height',
  'type',
  'mimeType'
]

const PALETTE_KEYS: (keyof Palette)[] = [
  'Vibrant',
  'DarkVibrant',
  'LightVibrant',
  'Muted',
  'DarkMuted',
  'LightMuted'
]

export interface SqipResult {
  content: Buffer
  metadata: SqipImageMetadata
}

export interface SqipCliOptionDefinition extends OptionDefinition {
  description?: string
  required?: boolean
  default?: boolean
}

export interface PluginOptions {
  [key: string]: unknown
}

export interface PluginResolver {
  name: string
  options?: PluginOptions
}

export interface SqipOptions {
  input: string | Buffer
  outputFileName?: string
  output?: string
  silent?: boolean
  parseableOutput?: boolean
  plugins?: PluginType[]
  width?: number
  print?: boolean
}

// @todo why do we have this twice?
interface SqipConfig {
  input: string | Buffer
  outputFileName?: string
  output?: string
  silent?: boolean
  parseableOutput?: boolean
  plugins: PluginType[]
  width?: number
  print?: boolean
}

interface ProcessFileOptions {
  filePath: string
  buffer: Buffer
  outputFileName: string
  config: SqipConfig
}

export interface SqipImageMetadata {
  originalWidth: number
  originalHeight: number
  palette: Palette
  height: number
  width: number
  type: 'unknown' | 'pixel' | 'svg'
  mimeType: string
  filename: string
  [key: string]: unknown
}

export type PluginType = PluginResolver | string

export interface SqipPluginOptions {
  pluginOptions: PluginOptions
  options: PluginOptions
  sqipConfig: SqipConfig
}
export interface SqipPluginInterface {
  sqipConfig: SqipConfig
  apply(
    imageBuffer: Buffer,
    metadata?: SqipImageMetadata
  ): Promise<Buffer> | Buffer
}
export class SqipPlugin implements SqipPluginInterface {
  public sqipConfig: SqipConfig
  public options: PluginOptions
  static cliOptions: SqipCliOptionDefinition[]

  constructor(options: SqipPluginOptions) {
    const { sqipConfig } = options
    this.sqipConfig = sqipConfig || {}
    this.options = {}
  }
  apply(
    imageBuffer: Buffer,
    metadata: SqipImageMetadata
  ): Promise<Buffer> | Buffer {
    console.log(metadata)
    return imageBuffer
  }
}

// Resolves plugins based on a given config
// Array of plugin names or config objects, even mixed.
export async function resolvePlugins(
  plugins: PluginType[]
): Promise<(PluginResolver & { Plugin: typeof SqipPlugin })[]> {
  return Promise.all(
    plugins.map(async (plugin) => {
      if (typeof plugin === 'string') {
        plugin = { name: plugin }
      }
      const { name } = plugin

      if (!name) {
        throw new Error(
          `Unable to read plugin name from:\n${JSON.stringify(plugin, null, 2)}`
        )
      }
      const moduleName =
        name.indexOf('sqip-plugin-') !== -1 ? name : `sqip-plugin-${name}`
      try {
        debug(`Loading ${moduleName}`)
        const { default: Plugin } = await import(moduleName)

        return { ...plugin, Plugin: Plugin.default || Plugin }
      } catch (err) {
        console.error(err)
        throw new Error(
          `Unable to load plugin "${moduleName}". Try installing it via:\n\n npm install ${moduleName}`
        )
      }
    })
  )
}

async function processFile({
  filePath,
  buffer,
  outputFileName,
  config
}: ProcessFileOptions) {
  const { output, silent, parseableOutput, print } = config
  const result = await processImage({ filePath, buffer, config })
  const { content, metadata } = result
  let outputPath

  debug(`Processed ${outputFileName}`)

  // Write result svg if desired
  if (output) {
    try {
      // Test if output path already exists
      const stats = await fs.stat(output)

      // Throw if it is a file and already exists
      if (!stats.isDirectory()) {
        throw new Error(
          `File ${output} already exists. Overwriting is not yet supported.`
        )
      }
      outputPath = path.resolve(output, `${outputFileName}.svg`)
    } catch (err) {
      // Output directory or file does not exist. We will create it later on.
      outputPath = output
    }

    debug(`Writing ${outputPath}`)
    await fs.writeFile(outputPath, content)
  }

  // Gather CLI output information
  if (!silent) {
    if (outputPath) {
      console.log(`Stored at: ${outputPath}`)
    }

    // Generate preview
    if (!parseableOutput) {
      // Convert to png for image preview
      const preview = await sharp(Buffer.from(content)).png().toBuffer()

      try {
        termimg(preview, {
          fallback: () => {
            // SVG results can still be outputted as string
            if (metadata.type === 'svg') {
              console.log(content.toString())
              return
            }

            // No fallback preview solution yet for non-svg files.
            console.log(
              `Unable to render a preview for ${metadata.type} files on this machine. Try using https://iterm2.com/`
            )
          }
        })
      } catch (err) {
        if (err instanceof UnsupportedTerminalError) {
          if (err.name === 'UnsupportedTerminalError') {
            throw err
          }
        }
      }
    }

    // Metadata
    const tableConfig = parseableOutput
      ? {
          chars: {
            top: '',
            'top-mid': '',
            'top-left': '',
            'top-right': '',
            bottom: '',
            'bottom-mid': '',
            'bottom-left': '',
            'bottom-right': '',
            left: '',
            'left-mid': '',
            mid: '',
            'mid-mid': '',
            right: '',
            'right-mid': '',
            middle: ' '
          },
          style: { 'padding-left': 0, 'padding-right': 0 }
        }
      : undefined

    // Figure out which metadata keys to show
    // @todo why is this unused?
    // const allKeys = [...mainKeys, 'palette']

    const mainTable = new Table(tableConfig)
    mainTable.push(mainKeys)
    mainTable.push(
      mainKeys.map((key) => String(metadata[key]) || 'can not display')
    )
    console.log(mainTable.toString())

    // Show color palette
    const paletteTable = new Table(tableConfig)
    paletteTable.push(PALETTE_KEYS)
    paletteTable.push(
      PALETTE_KEYS.map((key) => metadata.palette[key]?.hex)
        .filter<string>((hex): hex is string => typeof hex === 'string')
        .map((hex) => chalk.hex(hex)(hex))
    )
    console.log(paletteTable.toString())

    Object.keys(metadata)
      .filter((key) => ![...mainKeys, 'palette'].includes(key))
      .forEach((key) => {
        console.log(chalk.bold(`${key}:`))
        console.log(metadata[key])
      })

    if (metadata.type === 'svg' && print) {
      console.log(`Resulting SVG:\n${result.content.toString()}`)
    }
  }

  return result
}

interface ProcessImageOptions {
  filePath: string
  buffer: Buffer
  config: SqipConfig
}

async function processImage({
  filePath,
  buffer,
  config
}: ProcessImageOptions): Promise<SqipResult> {
  // Extract the palette from the image. We delegate to node-vibrant (which is
  // using jimp internally), and it only supports some image formats. In
  // particular, it does not support WebP and HEIC yet.
  //
  // So we try with the given image buffer, and if the code throws an exception
  // we try again after converting to TIFF. If that fails again we give up.
  const paletteResult = await (async () => {
    const getPalette = (buffer: Buffer) =>
      Vibrant.from(buffer).quality(0).getPalette()

    try {
      return await getPalette(buffer)
    } catch {
      return getPalette(await sharp(buffer).tiff().toBuffer())
    }
  })()

  const { name: filename } = path.parse(filePath)
  const mimeType = mime.getType(filePath) || 'unknown'

  const metadata: SqipImageMetadata = {
    filename,
    mimeType,
    originalWidth: paletteResult.imageDimensions.width,
    originalHeight: paletteResult.imageDimensions.height,
    palette: paletteResult.palette,
    // @todo this should be set by plugins and detected initially
    type: 'unknown',
    width: 0,
    height: 0
  }

  // Load plugins
  const plugins = await resolvePlugins(config.plugins)

  // Determine output image size
  if (config.width && config.width > 0) {
    // Resize to desired output width
    try {
      buffer = await sharp(buffer).resize(config.width).toBuffer()

      const resizedMetadata = await sharp(buffer).metadata()
      metadata.width = resizedMetadata.width || 0
      metadata.height = resizedMetadata.height || 0
    } catch (err) {
      throw new Error('Unable to resize')
    }
  } else {
    // Fall back to original size, keep image as is
    metadata.width = metadata.originalWidth
    metadata.height = metadata.originalHeight
  }

  // Interate through plugins and apply them to last returned image

  for (const { name, options: pluginOptions, Plugin } of plugins) {
    try {
      debug(`Construct ${name}`)
      const plugin = new Plugin({
        sqipConfig: config,
        pluginOptions: pluginOptions || {},
        options: {}
      })
      debug(`Apply ${name}`)
      buffer = await plugin.apply(buffer, metadata)
    } catch (err) {
      console.log(`Error thrown in plugin ${name}.`)
      console.dir({ metadata }, { depth: 3 })
      throw err
    }
  }

  return { content: buffer, metadata }
}

export async function sqip(
  options: SqipOptions
): Promise<SqipResult | SqipResult[]> {
  // Build configuration based on passed options and default options
  const defaultOptions = {
    plugins: [
      { name: 'primitive', options: { numberOfPrimitives: 8, mode: 0 } },
      'blur',
      'svgo',
      'data-uri'
    ],
    width: 300,
    parseableOutput: false,
    silent: true,
    print: false
  }

  const config: SqipConfig = Object.assign({}, defaultOptions, options)

  const { input, outputFileName, parseableOutput, silent } = config

  if (parseableOutput) {
    chalk.level = 0
  }

  // Validate configuration
  if (!input || input.length === 0) {
    throw new Error(
      'Please provide an input image, e.g. sqip({ input: "input.jpg" })'
    )
  }

  // If input is a Buffer
  if (Buffer.isBuffer(input)) {
    if (!outputFileName) {
      throw new Error('OutputFileName is required when passing image as buffer')
    }
    return processFile({
      filePath: '-',
      buffer: input,
      outputFileName,
      config
    })
  }

  const files = await locateFiles(input)
  debug('Found files:')
  debug(files)

  // Test if all files are accessable
  for (const file of files) {
    try {
      debug('check file ' + file)
      await fs.access(file, fs.constants.R_OK)
    } catch (err) {
      throw new Error(`Unable to read file ${file}`)
    }
  }

  // Iterate over all files
  const results = []
  for (const filePath of files) {
    // Apply plugins to files
    if (!silent) {
      console.log(`Processing: ${filePath}`)
    } else {
      debug(`Processing ${filePath}`)
    }
    const buffer = await fs.readFile(filePath)
    const result = await processFile({
      filePath,
      buffer,
      outputFileName: outputFileName || path.parse(filePath).name,
      config
    })

    results.push(result)
  }

  debug(`Finished`)

  // Return as array when input was array or results is only one file
  if (Array.isArray(input) || results.length === 0) {
    return results
  }
  return results[0]
}

export * from './helpers'

export const mockedMetadata: SqipImageMetadata = {
  filename: 'mocked',
  mimeType: 'image/mocked',
  width: 1024,
  height: 640,
  type: 'svg',
  originalHeight: 1024,
  originalWidth: 640,
  palette: {
    DarkMuted: new Swatch([4, 2, 0], 420),
    DarkVibrant: new Swatch([4, 2, 1], 421),
    LightMuted: new Swatch([4, 2, 2], 422),
    LightVibrant: new Swatch([4, 2, 3], 423),
    Muted: new Swatch([4, 2, 4], 424),
    Vibrant: new Swatch([4, 2, 5], 425)
  }
}
