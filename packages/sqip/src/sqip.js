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

import { getDimensions } from './helpers'

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

export default async function sqip(options) {
  // Build configuration based on passed options and default options
  const defaultOptions = {
    plugins: [
      { name: 'primitive', options: { numberOfPrimitives: 8, mode: 0 } },
      'blur',
      'svgo',
      'data-uri'
    ],
    shouldThrow: true // @todo do we really need this?
  }
  const config = Object.assign({}, defaultOptions, options)

  // Validate configuration
  if (!config.input) {
    throw new Error(
      'Please provide an input image, e.g. sqip({ input: "input.jpg" })'
    )
  }

  const inputPath = path.resolve(process.cwd(), config.input)

  try {
    await fs.access(inputPath, fs.constants.R_OK)
  } catch (err) {
    throw new Error(`Unable to read input file: ${inputPath}`)
  }

  const dimensions = getDimensions(inputPath)

  // Load plugins
  const plugins = await resolvePlugins(config.plugins)

  // Interate through plugins and apply them to last returned image
  let svg = config.filename
  for (const { name, options: pluginOptions, Plugin } of plugins) {
    try {
      debug(`Construct ${name}`)
      const plugin = new Plugin({ dimensions, ...options, ...pluginOptions })
      debug(`Apply ${name}`)
      svg = await plugin.apply(svg, { dimensions })
    } catch (err) {
      if (config.shouldThrow) {
        throw err
      }
      console.error(err)
      process.exit(1)
    }
  }

  debug(`Finished`)

  // Write to disk or output result
  if (config.output) {
    const outputPath = path.resolve(config.output)
    await fs.writeFile(outputPath, svg)
  } else {
    console.log(svg)
  }
  return { svg, dimensions }
}
