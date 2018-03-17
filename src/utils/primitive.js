const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const VENDOR_DIR = path.resolve(__dirname, '..', '..', 'vendor')
let primitiveExecutable = 'primitive'

// Since Primitive is only interested in the larger dimension of the input image, let's find it
const findLargerImageDimension = ({ width, height }) =>
  width > height ? width : height

// Sanity check: use the exit state of 'type' to check for Primitive availability
const checkForPrimitive = (shouldThrow = false) => {
  const primitivePath = path.join(
    VENDOR_DIR,
    `primitive-${os.platform()}-${os.arch()}`
  )

  if (fs.existsSync(primitivePath)) {
    primitiveExecutable = primitivePath
    return
  }

  const errorMessage =
    'Please ensure that Primitive (https://github.com/fogleman/primitive, written in Golang) is installed and globally available'
  try {
    if (os.platform() === 'win32') {
      childProcess.execSync('where primitive')
    } else {
      childProcess.execSync('type primitive')
    }
  } catch (e) {
    if (shouldThrow) {
      throw new Error(errorMessage)
    }
    console.log(errorMessage)
    process.exit(1)
  }
}

// Run Primitive with reasonable defaults (rectangles as shapes, 9 shaper per default) to generate the placeholder SVG
const runPrimitive = (
  filename,
  { numberOfPrimitives = 8, mode = 0 },
  primitiveOutput,
  dimensions
) => {
  childProcess.execSync(
    `${primitiveExecutable} -i "${filename}" -o ${primitiveOutput} -n ${numberOfPrimitives} -m ${mode} -s ${findLargerImageDimension(
      dimensions
    )}`
  )
}

module.exports = {
  checkForPrimitive,
  runPrimitive
}
