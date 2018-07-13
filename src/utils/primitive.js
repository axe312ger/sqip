import path from 'path'
import os from 'os'

import execa from 'execa'
import fs from 'fs-extra'

const VENDOR_DIR = path.resolve(__dirname, '..', '..', 'vendor')
const PRIMITIVE_TEMP_FILE = path.resolve(
  os.tmpdir(),
  `primitive-tempfile-${new Date().getTime()}.svg`
)
let primitiveExecutable = 'primitive'

// Since Primitive is only interested in the larger dimension of the input image, let's find it
const findLargerImageDimension = ({ width, height }) =>
  width > height ? width : height

// Sanity check: use the exit state of 'type' to check for Primitive availability
const checkForPrimitive = async (shouldThrow = false) => {
  const primitivePath = path.join(
    VENDOR_DIR,
    `primitive-${os.platform()}-${os.arch()}`
  )

  if (await fs.exists(primitivePath)) {
    primitiveExecutable = primitivePath
    return
  }

  const errorMessage =
    'Please ensure that Primitive (https://github.com/fogleman/primitive, written in Golang) is installed and globally available'
  try {
    if (os.platform() === 'win32') {
      await execa('where', ['primitive'])
    } else {
      await execa('type', ['primitive'])
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
const runPrimitive = async (
  filename,
  { numberOfPrimitives = 8, mode = 0 },
  dimensions
) => {
  await execa(primitiveExecutable, [
    '-i',
    filename,
    '-o',
    PRIMITIVE_TEMP_FILE,
    '-n',
    numberOfPrimitives,
    '-m',
    mode,
    '-s',
    findLargerImageDimension(dimensions)
  ])

  const result = await fs.readFile(PRIMITIVE_TEMP_FILE, {
    encoding: 'utf-8'
  })

  await fs.unlink(PRIMITIVE_TEMP_FILE)

  return result
}

module.exports = {
  checkForPrimitive,
  runPrimitive
}
