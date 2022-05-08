import { access } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import os from 'os'
import sharp from 'sharp'
import * as svgson from 'svgson'

import execa from 'execa'
import Debug from 'debug'

import {
  SqipPlugin,
  parseColor,
  SqipPluginOptions,
  PluginOptions,
  SqipCliOptionDefinition,
  SqipImageMetadata
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

const VENDOR_DIR = path.resolve(__dirname, '..', 'primitive-binaries')
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
        description:
          'starting background color. Either the name of a color from the color palette or a 6 digit hex value for solid color and a 8 digit hex value for transparency: ffffff00',
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
    const { pluginOptions } = options

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

  async apply(
    imageBuffer: Buffer,
    metadata: SqipImageMetadata
  ): Promise<Buffer> {
    if (metadata.type === 'svg') {
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

    const { width, height, palette } = metadata

    const bg = String(
      userBg ? parseColor({ color: userBg, palette }) : palette['Muted']?.hex
    )
      .replace('#', '')
      .toLowerCase()

    const result = await execa(
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
        bg,
        '-j',
        String(cores)
      ],
      {
        input: await sharp(imageBuffer).png().toBuffer()
      }
    )

    metadata.type = 'svg'

    // Hide background rectangle/path when using transparent backgrounds
    if (bg.match(/[0-9a-f]{6}00/)) {
      const parsedSvg = await svgson.parse(result.stdout)
      delete parsedSvg.children[0]
      return Buffer.from(svgson.stringify(parsedSvg))
    }

    return Buffer.from(result.stdout)
  }

  // Sanity check: use the exit state of 'type' to check for Primitive availability
  async checkForPrimitive(): Promise<undefined> {
    const platform = os.platform()
    const primitivePath = path.join(
      VENDOR_DIR,
      `primitive-${platform}-${os.arch()}${platform === 'win32' ? '.exe' : ''}`
    )

    try {
      await access(primitivePath, constants.X_OK)
      debug(`Found primitive binary at ${primitivePath}`)
      primitiveExecutable = primitivePath
      return
    } catch (e) {
      // noop
    }

    // Test if primitive is available as global executable
    try {
      if (platform === 'win32') {
        await execa('where', ['primitive'])
      } else {
        await execa('type', ['primitive'])
      }
    } catch (e) {
      throw new Error(
        'Please ensure that Primitive (https://github.com/hashbite/primitive, written in Golang) is installed and globally available.'
      )
    }

    debug(`Found globally available primitive binary`)
    primitiveExecutable = 'primitive'
  }
}
