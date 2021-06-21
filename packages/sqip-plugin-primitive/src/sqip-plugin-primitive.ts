import { access } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import os from 'os'

import execa from 'execa'
import Debug from 'debug'

import {
  SqipPlugin,
  parseColor,
  SqipPluginOptions,
  PluginOptions,
  SqipCliOptionDefinition
} from 'sqip'

interface PrimitivePluginOptions extends SqipPluginOptions {
  options: PrimitiveOptions
}

interface PrimitiveOptions extends PluginOptions {
  numberOfPrimitives?: number
  mode?: number
  rep?: number
  alpha?: number
  background?: string
  cores?: number
}

const debug = Debug('sqip-plugin-primitive')

const VENDOR_DIR = path.resolve(__dirname, '..', 'vendor')
let primitiveExecutable = 'primitive'

// Since Primitive is only interested in the larger dimension of the input image, let's find it
const findLargerImageDimension = ({
  width,
  height
}: {
  width: number
  height: number
}) => (width > height ? width : height)

export default class PrimitivePlugin extends SqipPlugin {
  static get cliOptions(): SqipCliOptionDefinition[] {
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

  constructor(options: PrimitivePluginOptions) {
    super(options)
    const { options: pluginOptions } = options
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

  public options: PrimitiveOptions

  async apply(imageBuffer: Buffer): Promise<Buffer> {
    if (this.metadata.type === 'svg') {
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

    const background = userBg
      ? parseColor({ color: userBg, palette })
      : palette['Muted']?.hex

    const { stdout } = await execa(
      primitiveExecutable,
      [
        '-i',
        '-',
        '-o',
        '-',
        '-n',
        String(numberOfPrimitives),
        '-m',
        String(mode),
        '-s',
        String(findLargerImageDimension({ width, height })),
        '-rep',
        String(rep),
        '-a',
        String(alpha),
        '-bg',
        String(background),
        '-j',
        String(cores)
      ],
      { input: imageBuffer }
    )

    this.metadata.type = 'svg'

    return Buffer.from(stdout)
  }

  // Sanity check: use the exit state of 'type' to check for Primitive availability
  async checkForPrimitive(): Promise<undefined> {
    const platform = os.platform()
    const primitivePath = path.join(
      VENDOR_DIR,
      `primitive-${platform}-${os.arch()}${platform === 'win32' ? '.exe' : ''}`
    )

    debug(`Trying to locate primitive binary at ${primitivePath}`)

    try {
      await access(primitivePath, constants.X_OK)
      primitiveExecutable = primitivePath
      return
    } catch (e) {
      // noop
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
