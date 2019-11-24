import fs from 'fs-extra'
import path from 'path'
import os from 'os'

import execa from 'execa'
import Debug from 'debug'

import { SqipPlugin } from 'sqip'

const debug = Debug('sqip-plugin-primitive')

const VENDOR_DIR = path.resolve(__dirname, '..', 'vendor')
let primitiveExecutable = 'primitive'

// Since Primitive is only interested in the larger dimension of the input image, let's find it
const findLargerImageDimension = ({ width, height }) =>
  width > height ? width : height

export default class PrimitivePlugin extends SqipPlugin {
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
      },
      {
        name: 'rep',
        type: Number,
        description:
          'add N extra shapes each iteration with reduced search (mostly good for beziers',
        defaultValue: 0
      },
      // @todo we might support this by throwing every result into the image array sqip uses
      // {
      //   name: 'nth',
      //   type: Number,
      //   description: 'save every Nth frame (only when %d is in output path)',
      //   defaultValue: 1
      // },
      {
        name: 'alpha',
        type: Number,
        description:
          'color alpha (use 0 to let the algorithm choose alpha for each shape)',
        defaultValue: 128
      },
      {
        name: 'background',
        type: String,
        description: 'starting background color (hex)',
        defaultValue: 'DarkMuted'
      },
      {
        name: 'cores',
        type: Number,
        description: 'number of parallel workers (default uses all cores)',
        defaultValue: 0
      }
    ]
  }

  constructor({ pluginOptions }) {
    super(...arguments)
    this.options = {
      numberOfPrimitives: 8,
      mode: 0,
      rep: 0,
      alpha: 128,
      background: 'DarkMuted',
      cores: 0,
      ...pluginOptions
    }
  }

  async apply(imageBuffer) {
    if (this.metadata.type === 'svg' || !Buffer.isBuffer(imageBuffer)) {
      throw new Error(
        'Primitive needs a raster image buffer as input. Check if you run this plugin in the first place.'
      )
    }
    await this.checkForPrimitive()

    const {
      numberOfPrimitives,
      mode,
      rep,
      alpha,
      background: userBg,
      cores
    } = this.options

    const { width, height, palette } = this.metadata

    const background = userBg in palette ? palette[userBg].getHex() : userBg

    const { stdout } = await execa(
      primitiveExecutable,
      [
        '-i',
        '-',
        '-o',
        '-',
        '-n',
        numberOfPrimitives,
        '-m',
        mode,
        '-s',
        findLargerImageDimension({ width, height }),
        '-rep',
        rep,
        '-a',
        alpha,
        '-bg',
        background,
        '-j',
        cores
      ],
      { input: imageBuffer }
    )

    this.metadata.type = 'svg'

    return stdout
  }

  // Sanity check: use the exit state of 'type' to check for Primitive availability
  async checkForPrimitive() {
    const platform = os.platform()
    const primitivePath = path.join(
      VENDOR_DIR,
      `primitive-${platform}-${os.arch()}${platform === 'win32' ? '.exe' : ''}`
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
