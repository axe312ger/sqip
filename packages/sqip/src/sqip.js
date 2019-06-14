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
import glob from 'fast-glob'
import sizeOf from 'image-size'
import Vibrant from 'node-vibrant'
import sharp from 'sharp'

const debug = Debug('sqip')

export async function resolvePlugins(plugins) {
  return Promise.all(
    plugins.map(async plugin => {
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

        return { ...plugin, Plugin }
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

async function processImage({ filePath, config }) {
  const originalSizes = sizeOf(filePath)
  const vibrant = new Vibrant(filePath, { quality: 0 })
  const palette = await vibrant.getPalette()
  let metadata = {
    originalWidth: originalSizes.width,
    originalHeight: originalSizes.height,
    palette
  }

  // Load plugins
  const plugins = await resolvePlugins(config.plugins)

  // Interate through plugins and apply them to last returned image
  let imageContent = await fs.readFile(filePath)

  if (config.width > 0) {
    // Resize to desired output width
    imageContent = await sharp(imageContent)
      .resize(config.width)
      .toBuffer()

    const resizedMetadata = await sharp(imageContent).metadata()
    metadata.width = resizedMetadata.width
    metadata.height = resizedMetadata.height
  } else {
    // Fall back to original size, keep image as is
    metadata.width = originalSizes.width
    metadata.height = originalSizes.height
  }

  for (const { name, options: pluginOptions, Plugin } of plugins) {
    try {
      debug(`Construct ${name}`)
      const plugin = new Plugin({
        sqipConfig: config,
        pluginOptions,
        metadata,
        filePath
      })
      debug(`Apply ${name}`)
      imageContent = await plugin.apply(imageContent)
    } catch (err) {
      if (config.shouldThrow) {
        throw err
      }
      console.error(err)
      process.exit(1)
    }
  }

  return { svg: imageContent, metadata }
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
    print: false,
    shouldThrow: true, // @todo do we really need this?,
    width: 300
  }
  const config = Object.assign({}, defaultOptions, options)

  const { input, output } = config

  // Validate configuration
  if (!input) {
    throw new Error(
      'Please provide an input image, e.g. sqip({ input: "input.jpg" })'
    )
  }

  // Find all files matching the input glob
  const files = await glob(input, {
    absolute: true
  })

  debug('Found files:')
  debug(files)

  // Test if files are found
  if (!files.length) {
    throw new Error(
      `Unable to find any files via ${input}. Make sure the file exists.

If you are using globbing patterns, the following features are supported:

https://github.com/micromatch/micromatch#matching-features`
    )
  }

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
    debug(`Processing ${filePath}`)
    const result = await processImage({ filePath, config })
    debug(`Processed ${filePath}`)

    // Write result svg if desired
    if (output) {
      const name = path.parse(filePath).name
      let outputPath

      try {
        // Test if output path already exists
        const stats = await fs.stat(output)

        // Throw if it is a file and already exists
        if (!stats.isDirectory()) {
          throw new Error(
            `File ${output} already exists. Overwriting is not yet supported.`
          )
        }
        outputPath = path.resolve(output, `${name}.svg`)
      } catch (err) {
        // Output directory or file does not exist. We will create it later on.
        outputPath = output
      }

      debug(`Writing ${outputPath}`)
      await fs.writeFile(outputPath, result.svg)
    }

    if (config.print) {
      console.log(result.svg)
    }

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
  constructor({ sqipConfig, metadata, filePath }) {
    this.sqipConfig = sqipConfig || {}
    this.metadata = metadata || {}
    this.filePath = filePath || null
  }
}

export * from './helpers'
