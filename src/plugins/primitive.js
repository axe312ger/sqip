import fs from 'fs-extra'
import path from 'path'
import os from 'os'

import execa from 'execa'

const VENDOR_DIR = path.resolve(__dirname, '..', '..', 'vendor')
let primitiveExecutable = 'primitive'

// Since Primitive is only interested in the larger dimension of the input image, let's find it
const findLargerImageDimension = ({ width, height }) =>
  width > height ? width : height

class PrimitivePlugin {
  constructor(options) {
    this.options = options
  }

  async apply() {
    await this.checkForPrimitive()

    const { numberOfPrimitives = 8, mode = 0, dimensions, input } = this.options

    const { stdout } = await execa(primitiveExecutable, [
      '-i',
      input,
      '-o',
      '-',
      '-n',
      numberOfPrimitives,
      '-m',
      mode,
      '-s',
      findLargerImageDimension(dimensions)
    ])

    return stdout
  }

  // Sanity check: use the exit state of 'type' to check for Primitive availability
  async checkForPrimitive() {
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
      throw new Error(errorMessage)
    }
  }
}

module.exports = PrimitivePlugin
