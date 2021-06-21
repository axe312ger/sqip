import { promisify } from 'util'

import {
  SqipPlugin,
  parseColor,
  SqipPluginOptions,
  PluginOptions,
  SqipCliOptionDefinition
} from 'sqip'

import potrace, { PotraceDefaultOptions } from 'potrace'

const trace = promisify(potrace.trace)
const posterize = promisify(potrace.posterize)

interface PotracePluginOptions extends SqipPluginOptions {
  pluginOptions: Partial<PotraceOptions> & { [key: string]: unknown }
}

interface PotraceOptions extends PotraceDefaultOptions, PluginOptions {
  posterize: boolean
}

export default class sqipPluginPotrace extends SqipPlugin {
  static get cliOptions(): SqipCliOptionDefinition[] {
    return [
      {
        name: 'color',
        type: String,
        description: 'Fill color. SQIP will pick a fitting color by default.'
      },
      {
        name: 'background',
        type: String,
        description:
          'Background color. SQIP will pick a fitting color by default.'
      },
      {
        name: 'posterize',
        type: Boolean,
        description: 'Use posterize instead of trace',
        defaultValue: false
      },
      {
        name: 'steps',
        type: Number,
        description: 'Posterize only: Number of steps or array of thresholds',
        defaultValue: 4,
        lazyMultiple: true
      },
      {
        name: 'turnPolicy',
        type: String,
        description:
          'how to resolve ambiguities in path decomposition. Possible values are exported as constants: TURNPOLICY_BLACK, TURNPOLICY_WHITE, TURNPOLICY_LEFT, TURNPOLICY_RIGHT, TURNPOLICY_MINORITY, TURNPOLICY_MAJORITY.',
        defaultValue: 'TURNPOLICY_MINORITY'
      },
      {
        name: 'turdSize',
        type: Number,
        description: 'suppress speckles of up to this size',
        defaultValue: 2
      },
      {
        name: 'alphaMax',
        type: Number,
        description: 'corner threshold parameter',
        defaultValue: 1
      },
      {
        name: 'optCurve',
        type: Boolean,
        description: 'curve optimization',
        default: true
      },
      {
        name: 'optTolerance',
        type: Number,
        description: 'curve optimization tolerance',
        defaultValue: 0.2
      },
      {
        name: 'threshold',
        type: Number,
        description:
          'threshold below which color is considered black. Should be a number in range 0..255. By default THRESHOLD_AUTO is used in which case threshold will be selected automatically using Algorithm For Multilevel Thresholding'
      },
      {
        name: 'blackOnWhite',
        type: Boolean,
        description:
          'specifies colors by which side from threshold should be turned into vector shape',
        defaultValue: true
      }
    ]
  }

  public options: PotraceOptions

  constructor(options: PotracePluginOptions) {
    super(options)
    const { pluginOptions } = options
    const turnPolicy =
      (pluginOptions &&
        pluginOptions.turnPolicy &&
        potrace.Potrace[pluginOptions.turnPolicy]) ||
      potrace.Potrace.TURNPOLICY_MINORITY

    this.options = {
      posterize: false,
      steps: 4,
      turdSize: 2,
      alphaMax: 1,
      optCurve: true,
      optTolerance: 0.2,
      blackOnWhite: true,
      color: 'COLOR_AUTO',
      background: 'COLOR_AUTO',
      threshold: potrace.Potrace.THRESHOLD_AUTO,
      ...pluginOptions,
      turnPolicy
    }
  }

  async apply(imageBuffer: Buffer): Promise<Buffer> {
    if (this.metadata.type === 'svg') {
      throw new Error(
        'The pixels plugin needs a raster image as input. Check if you run this plugin in the first place.'
      )
    }

    const {
      turnPolicy,
      turdSize,
      alphaMax,
      optCurve,
      optTolerance,
      threshold,
      blackOnWhite,
      color: userColor,
      background: userBackground,
      steps
    } = this.options

    const { palette } = this.metadata

    if (this.options.posterize) {
      const background =
        (userBackground === 'COLOR_AUTO' && palette.DarkMuted?.hex) ||
        parseColor({ color: userBackground, palette })
      const color =
        (userColor === 'COLOR_AUTO' && palette.LightVibrant?.hex) ||
        parseColor({ color: userColor, palette })

      const result = await posterize(imageBuffer, {
        steps: Number(steps),
        background,
        color,
        turnPolicy,
        turdSize,
        alphaMax,
        optCurve,
        optTolerance,
        threshold,
        blackOnWhite
      })

      return Buffer.from(result)
    }

    const background =
      userBackground === 'COLOR_AUTO'
        ? 'transparent'
        : parseColor({ color: userBackground, palette })
    const color =
      (userColor === 'COLOR_AUTO' && palette.Vibrant?.hex) ||
      parseColor({ color: userColor, palette })

    const result = await trace(imageBuffer, {
      background,
      color,
      turnPolicy,
      turdSize,
      alphaMax,
      optCurve,
      optTolerance,
      threshold,
      blackOnWhite
    })

    return Buffer.from(result)
  }
}
