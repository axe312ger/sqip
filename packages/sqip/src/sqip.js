// #############################################################################
// #
// # "SQIP" (pronounced \skwɪb\ like the non-magical folk of magical descent)
// # is a SVG-based LQIP technique - https://github.com/technopagan/sqip
// #
// # Installation as CLI:
// # npm install -g sqip
// #
// # Installation as lib:
// # npm install sqip
// #
// # Requirements:
// # * Node.js >= v6 (https://nodejs.org/en/)
// #
// #############################################################################

import path from 'path'

import Debug from 'debug'
import fs from 'fs-extra'
import imageSize from 'probe-image-size'
import Vibrant from 'node-vibrant'
import sharp from 'sharp'
import termimg from 'term-img'
import Table from 'cli-table3'
import chalk from 'chalk'

import { locateFiles } from './helpers'

const debug = Debug('sqip')

const mainKeys = ['originalWidth', 'originalHeight', 'width', 'height', 'type']

const paletteKeys = [
  'Vibrant',
  'DarkVibrant',
  'LightVibrant',
  'Muted',
  'DarkMuted',
  'LightMuted'
]

// Resolves plugins based on a given config
// Array of plugin names or config objects, even mixed.
export async function resolvePlugins(plugins) {
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
        const Plugin = await import(moduleName)

        return { ...plugin, Plugin: Plugin.default }
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
          throw new Error(
            `Unable to load plugin "${moduleName}". Try installing it via:\n\n npm install ${moduleName}`
          )
        }
        throw err
      }
    })
  )
}

async function processFile({ buffer, outputFileName, config }) {
  const { output, silent, parseableOutput } = config
  const result = await processImage({ buffer, config })
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
        if (err.name !== 'UnsupportedTerminalError') {
          throw err
        }
      }
    }

    // Metadata
    const tableConfig = parseableOutput && {
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

    // Figure out which metadata keys to show
    const allKeys = [...mainKeys, 'palette']
    const restMetadata = { ...metadata }
    allKeys.forEach((k) => delete restMetadata[k])

    const mainTable = new Table(tableConfig)
    mainTable.push(mainKeys)
    mainTable.push(mainKeys.map((key) => metadata[key]))
    console.log(mainTable.toString())

    // Show color palette
    const paletteTable = new Table(tableConfig)
    paletteTable.push(paletteKeys)
    paletteTable.push(
      paletteKeys
        .map((key) => metadata.palette[key].getHex())
        .map((hex) => chalk.hex(hex)(hex))
    )
    console.log(paletteTable.toString())

    Object.keys(restMetadata).forEach((key) => {
      console.log(chalk.bold(`${key}:`))
      console.log(restMetadata[key])
    })
  }

  return result
}

async function processImage({ buffer, config }) {
  const originalSizes = imageSize.sync(buffer)
  const vibrant = Vibrant.from(buffer)
  const palette = await vibrant.quality(0).getPalette()
  let metadata = {
    originalWidth: originalSizes.width,
    originalHeight: originalSizes.height,
    palette
  }

  // Load plugins
  const plugins = await resolvePlugins(config.plugins)

  // Interate through plugins and apply them to last returned image
  if (config.width > 0) {
    // Resize to desired output width
    buffer = await sharp(buffer).resize(config.width).toBuffer()

    const resizedMetadata = await sharp(buffer).metadata()
    metadata.width = resizedMetadata.width
    metadata.height = resizedMetadata.height
  } else {
    // Fall back to original size, keep image as is
    metadata.width = originalSizes.width
    metadata.height = originalSizes.height
  }

  for (const { name, options: pluginOptions, Plugin } of plugins) {
    debug(`Construct ${name}`)
    const plugin = new Plugin({
      sqipConfig: config,
      pluginOptions,
      metadata
    })
    debug(`Apply ${name}`)
    buffer = await plugin.apply(buffer)
  }

  return { content: buffer, metadata }
}

export default async function sqip(options) {
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
    silent: true
  }

  const config = Object.assign({}, defaultOptions, options)

  const { input, outputFileName, parseableOutput, silent } = config

  if (parseableOutput) {
    chalk.enabled = false
  }

  // Validate configuration
  if (!input) {
    throw new Error(
      'Please provide an input image, e.g. sqip({ input: "input.jpg" })'
    )
  }

  // If input is a Buffer
  if (Buffer.isBuffer(input)) {
    return processFile({
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

export class SqipPlugin {
  constructor({ sqipConfig, metadata }) {
    this.sqipConfig = sqipConfig || {}
    this.metadata = metadata || {}
  }
}

export * from './helpers'
