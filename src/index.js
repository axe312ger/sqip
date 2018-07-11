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

require('babel-polyfill')

// Require the necessary modules to make sqip work
const fs = require('fs')
const path = require('path')

const {
  encodeBase64,
  getDimensions,
  printFinalResult
} = require('./utils/helpers')
const { checkForPrimitive, runPrimitive } = require('./utils/primitive')
const { runSVGO, prepareSVG, applyBlurFilter } = require('./utils/svg')

module.exports = options => {
  // Build configuration based on passed options and default options
  const defaultOptions = {
    numberOfPrimitives: 8,
    mode: 0,
    blur: 12,
    shouldThrow: true
  }
  const config = Object.assign({}, defaultOptions, options)

  // Validate configuration and primitive executable status
  checkForPrimitive(config.shouldThrow)

  if (!config.input) {
    throw new Error(
      'Please provide an input image, e.g. sqip({ filename: "input.jpg" })'
    )
  }

  const inputPath = path.resolve(config.input)

  try {
    fs.accessSync(inputPath, fs.constants.R_OK)
  } catch (err) {
    throw new Error(`Unable to read input file: ${inputPath}`)
  }

  // Prepare options for later steps
  const { numberOfPrimitives, mode } = config

  const imgDimensions = getDimensions(inputPath)
  const primitiveOptions = {
    numberOfPrimitives,
    mode
  }

  // Run primitive
  const primitiveOutput = runPrimitive(
    inputPath,
    primitiveOptions,
    imgDimensions
  )

  // Prepare SVG
  const preparedSVG = prepareSVG(primitiveOutput, imgDimensions)

  // Apply blur filter
  const blurredSVG = applyBlurFilter(preparedSVG, { blur: config.blur })

  // Optimize SVG
  const finalSvg = runSVGO(blurredSVG)

  // Encode SVG
  const svgBase64Encoded = encodeBase64(finalSvg)

  // Write to disk or output result
  if (config.output) {
    const outputPath = path.resolve(config.output)
    fs.writeFileSync(outputPath, finalSvg)
  } else {
    printFinalResult(imgDimensions, inputPath, svgBase64Encoded)
  }

  return { finalSvg, svgBase64Encoded, imgDimensions }
}
