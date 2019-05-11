import fs from 'fs-extra'
import path from 'path'
import os from 'os'

import execa from 'execa'
import Debug from 'debug'

const debug = Debug('sqip-plugin-primitive')

const VENDOR_DIR = path.resolve(__dirname, '..', 'vendor')
let primitiveExecutable = 'primitive'

// Since Primitive is only interested in the larger dimension of the input image, let's find it
const findLargerImageDimension = ({ width, height }) =>
  width > height ? width : height

export default class PrimitivePlugin {
  static get cliOptions() {
    return [
      {
        name: 'numberOfPrimitives',
        alias: 'n',
        type: Number,
        description:
          'The number of primitive shapes to use to build the SQIP SVG',
        defaultValue: 8
      },
      {
        name: 'mode',
        alias: 'm',
        type: Number,
        description:
          'The style of primitives to use: \n0=combo, 1=triangle, 2=rect, 3=ellipse, 4=circle, 5=rotatedrect, 6=beziers, 7=rotatedellipse, 8=polygon',
        defaultValue: 0
      }
    ]
  }

  constructor(options) {
    this.options = {
      numberOfPrimitives: 8,
      mode: 0,
      dimensions: {},
      ...options
    }
  }

  async apply() {
    await this.checkForPrimitive()

    const { numberOfPrimitives, mode, dimensions, input } = this.options

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

    debug(`Trying to locate primitive binary at ${primitivePath}`)

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
