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

import fs from 'fs-extra'

import { getDimensions, printFinalResult } from './helpers'

import BlurPlugin from 'sqip-plugin-blur'
import SVGOPlugin from 'sqip-plugin-svgo'
import PrimitivePlugin from 'sqip-plugin-primitive'
import DataUriPlugin from 'sqip-plugin-data-uri'

export default async function sqip(options) {
  // Build configuration based on passed options and default options
  const defaultOptions = {
    numberOfPrimitives: 8,
    mode: 0,
    blur: 12,
    shouldThrow: true
  }
  const config = Object.assign({}, defaultOptions, options)

  // Validate configuration
  if (!config.input) {
    throw new Error(
      'Please provide an input image, e.g. sqip({ input: "input.jpg" })'
    )
  }

  const inputPath = path.resolve(config.input)

  try {
    await fs.access(inputPath, fs.constants.R_OK)
  } catch (err) {
    throw new Error(`Unable to read input file: ${inputPath}`)
  }

  const imgDimensions = getDimensions(inputPath)

  let plugins = []
  if (!config.plugins) {
    plugins = [
      new PrimitivePlugin({
        numberOfPrimitives: options.numberOfPrimitives || 8,
        mode: options.mode || 0,
        input: config.input,
        dimensions: imgDimensions
      }),
      options.blur !== 0 &&
        new BlurPlugin({
          blur: options.blur > 0 ? options.blur : 12,
          dimensions: imgDimensions
        }),
      new SVGOPlugin({
        multipass: true,
        floatPrecision: 1
      }),
      !config.output && new DataUriPlugin()
    ].filter(Boolean)
  } else {
    plugins = config.plugins
  }

  let finalSvg = config.filename
  for (let plugin of plugins) {
    try {
      finalSvg = await plugin.apply(finalSvg)
    } catch (err) {
      if (config.shouldThrow) {
        throw err
      }
      console.error(err)
      process.exit(1)
    }
  }

  // Write to disk or output result
  if (config.output) {
    const outputPath = path.resolve(config.output)
    fs.writeFileSync(outputPath, finalSvg)
  } else {
    printFinalResult(imgDimensions, inputPath, finalSvg)
  }
  return { finalSvg, imgDimensions }
}
