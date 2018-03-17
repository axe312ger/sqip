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

// #############################################################################
// # CONFIG
// #############################################################################

// Require the necessary modules to make sqip work
const argv = require('argv')
const fs = require('fs')
const os = require('os')
const path = require('path')

const {
  encodeBase64,
  getDimensions,
  printFinalResult
} = require('./utils/helpers')
const { checkForPrimitive, runPrimitive } = require('./utils/primitive')
const { runSVGO, replaceSVGAttrs } = require('./utils/svg')

// Define a a temp file, ideally on a RAMdisk that Primitive can write to
const primitiveOutputFile = os.tmpdir() + '/primitive_tempfile.svg'

// Use 'argv' to set up all available commandline parameters that shall be available when running sqip
const argvOptions = [
  {
    name: 'numberOfPrimitives',
    short: 'n',
    type: 'int',
    description: 'The number of primitive shapes to use to build the SQIP SVG',
    example: "'sqip --numberOfPrimitives=4' or 'sqip -n 4'"
  },
  {
    name: 'output',
    short: 'o',
    type: 'path',
    description: 'Save the resulting SVG to a file',
    example:
      "'sqip --output=/foo/bar/image.svg' or 'sqip -o /foo/bar/image.svg'"
  },
  {
    name: 'mode',
    short: 'm',
    type: 'int',
    description: `The style of primitives to use. Defaults to 0.
                0=combo, 1=triangle, 2=rect, 3=ellipse, 4=circle, 5=rotatedrect,
                6=beziers, 7=rotatedellipse, 8=polygon`,
    example: "'sqip --mode=3' or 'sqip -m 3'"
  },
  {
    name: 'blur',
    short: 'b',
    type: 'int',
    description: `GaussianBlur SVG filter value. Disable via 0, defaults to 12`,
    example: "'sqip --blur=3' or 'sqip -b 3'"
  }
]
const getArguments = () => argv.option(argvOptions).run()

// #############################################################################
// # SANITY CHECKS
// #############################################################################

// Sanity check: make sure that the user has provided a file for sqip to work on
const getInputfilePath = (targets, shouldThrow = false) => {
  const helpText = shouldThrow
    ? 'sqip({ filename: "input.jpg" })'
    : 'sqip input.jpg'
  const errorMessage = `Please provide an input image, e.g. ${helpText}`
  if (!targets || !targets[0]) {
    if (shouldThrow) {
      throw new Error(errorMessage)
    } else {
      console.log(errorMessage)
      process.exit(1)
    }
  }
  return path.resolve(process.cwd(), targets[0])
}

// Sanity check: make sure that the value was passed to the `output` option
// Fixes https://github.com/technopagan/sqip/issues/11
const getOutputFilePath = () => {
  const index = process.argv.findIndex(
    arg => arg === '-o' || arg === '--output'
  )
  return index > 0 ? process.argv[index + 1] : null
}

// #############################################################################
// # MAIN FUNCTION CALL
// #############################################################################

const main = (filename, options) => {
  const imgDimensions = getDimensions(filename)
  const svgOptions = Object.assign(
    {
      blur: options.blur
    },
    imgDimensions
  )

  // Do not pass blur to primitive
  delete options.blur

  runPrimitive(filename, options, primitiveOutputFile, imgDimensions)
  const primitiveOutput = fs.readFileSync(primitiveOutputFile, {
    encoding: 'utf-8'
  })
  const svgoOutput = runSVGO(primitiveOutput)
  const finalSvg = replaceSVGAttrs(svgoOutput, svgOptions)
  const svgBase64Encoded = encodeBase64(finalSvg)

  return { finalSvg, svgBase64Encoded, imgDimensions }
}

/*
 * CLI API
 */
module.exports.run = () => {
  checkForPrimitive()
  const { targets, options } = getArguments()
  const filename = getInputfilePath(targets)
  const { finalSvg, svgBase64Encoded, imgDimensions } = main(filename, options)
  const output = getOutputFilePath()

  if (output) {
    fs.writeFileSync(output, finalSvg)
  } else {
    printFinalResult(imgDimensions, filename, svgBase64Encoded)
  }
}

/**
 * NODE API
 */
module.exports.node = apiOptions => {
  checkForPrimitive(true)
  const filename = getInputfilePath([apiOptions.filename], true)

  return main(filename, apiOptions)
}
