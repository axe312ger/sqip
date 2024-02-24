import { access, writeFile, unlink, readFile } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import os from 'os'
import execa from 'execa'
import Debug from 'debug'

import {
  SqipPlugin,
  // parseColor,
  SqipPluginOptions,
  PluginOptions,
  SqipCliOptionDefinition,
  SqipImageMetadata,
  loadSVG,
  parseColor
} from 'sqip'

interface TrianglePluginOptions extends SqipPluginOptions {
  options: Partial<TriangleOptions>
}

interface TriangleOptions extends PluginOptions {
  bl: number // Blur radius
  nf: number // Noise factor
  bf: number // Blur factor
  ef: number // Edge factor
  pr: number // Point rate
  pth: number // Points threshold
  pts: number // Maximum number of points
  so: number // Sobel filter threshold
  sl: boolean // Use solid stroke color
  wf: number // Wireframe mode
  st: number // Stroke width
  gr: boolean // Output in grayscale mode
  bg: string // Background color (specified as hex value)
}

const debug = Debug('sqip-plugin-triangle')

const VENDOR_DIR = path.resolve(__dirname, '..', 'triangle-binaries')

let triangleExecutable = 'triangle'

export default class TrianglePlugin extends SqipPlugin {
  static get cliOptions(): SqipCliOptionDefinition[] {
    return [
      { name: 'bl', type: Number, description: 'Blur radius', defaultValue: 2 },
      {
        name: 'nf',
        type: Number,
        description: 'Noise factor',
        defaultValue: 0
      },
      { name: 'bf', type: Number, description: 'Blur factor', defaultValue: 1 },
      { name: 'ef', type: Number, description: 'Edge factor', defaultValue: 6 },
      {
        name: 'pr',
        type: Number,
        description: 'Point rate',
        defaultValue: 0.075
      },
      {
        name: 'pth',
        type: Number,
        description: 'Points threshold',
        defaultValue: 10
      },
      {
        name: 'pts',
        type: Number,
        description: 'Maximum number of points',
        defaultValue: 6
      },
      {
        name: 'so',
        type: Number,
        description: 'Sobel filter threshold',
        defaultValue: 10
      },
      {
        name: 'sl',
        type: Boolean,
        description: 'Use solid stroke color',
        defaultValue: false
      },
      {
        name: 'wf',
        type: Number,
        description: 'Wireframe mode',
        defaultValue: 0
      },
      {
        name: 'st',
        type: Number,
        description: 'Stroke width',
        defaultValue: 1
      },
      {
        name: 'gr',
        type: Boolean,
        description: 'Output in grayscale mode',
        defaultValue: false
      },
      {
        name: 'bg',
        type: String,
        description:
          'Background color (specified as hex value or one of the extracted palette colors)',
        defaultValue: 'Muted'
      }
    ]
  }

  constructor(options: TrianglePluginOptions) {
    super(options)
    const { pluginOptions } = options

    this.options = {
      bl: 2,
      nf: 0,
      bf: 1,
      ef: 6,
      pr: 0.075,
      pth: 10,
      pts: 6,
      so: 10,
      sl: false,
      wf: 0,
      st: 1,
      gr: false,
      web: false,
      bg: 'Muted',
      ...pluginOptions
    }
  }

  public options: TriangleOptions

  async apply(
    imageBuffer: Buffer,
    metadata: SqipImageMetadata
  ): Promise<Buffer> {
    if (metadata.type === 'svg') {
      throw new Error(
        'Triangle needs a raster image buffer as input. Check if you run this plugin in the first place.'
      )
    }
    await this.checkForTriangle()

    const { filename, palette } = metadata

    const tmpFile = path.join(os.tmpdir(), `${filename}-${Date.now()}`)
    const tmpSvgFile = path.join(os.tmpdir(), `${filename}-${Date.now()}.svg`)

    await writeFile(tmpFile, imageBuffer)

    const bg = parseColor({ color: this.options.bg, palette }).toLowerCase()

    const triangleArgs = [
      '-in',
      tmpFile,
      '-bl',
      this.options.bl.toString(),
      '-nf',
      this.options.nf.toString(),
      '-bf',
      this.options.bf.toString(),
      '-ef',
      this.options.ef.toString(),
      '-pr',
      this.options.pr.toString(),
      '-pth',
      this.options.pth.toString(),
      '-pts',
      this.options.pts.toString(),
      '-so',
      this.options.so.toString(),
      this.options.sl ? '-sl' : null,
      '-wf',
      this.options.wf.toString(),
      '-st',
      this.options.st.toString(),
      this.options.gr ? '-gr' : null,
      this.options.web ? '-web' : null,
      '-bg',
      bg,
      '-out',
      tmpSvgFile
    ].filter((v) => v !== null) as string[]

    await execa(triangleExecutable, triangleArgs)

    const result = await readFile(tmpSvgFile)

    await unlink(tmpFile)
    await unlink(tmpSvgFile)

    const $ = loadSVG(result.toString())
    const $svg = $('svg')

    const $bgRect = $(`<rect width="100%" height="100%" fill="${bg}"/>`)

    $svg.prepend($bgRect)

    metadata.type = 'svg'
    metadata.mimeType = 'image/svg'

    return Buffer.from($.html())
  }

  // Sanity check: use the exit state of 'type' to check for Triangle availability
  async checkForTriangle(): Promise<undefined> {
    const platform = os.platform()
    const trianglePath = path.join(
      VENDOR_DIR,
      `triangle-${platform}-${os.arch()}${platform === 'win32' ? '.exe' : ''}`
    )

    try {
      await access(trianglePath, constants.X_OK)
      debug(`Found triangle binary at ${trianglePath}`)
      triangleExecutable = trianglePath
      return
    } catch (e) {
      // noop
    }

    // Test if Triangle is available as global executable
    try {
      if (platform === 'win32') {
        await execa('where', ['triangle'])
      } else {
        await execa('type', ['triangle'])
      }
    } catch (e) {
      throw new Error(
        'Please ensure that triangle (https://github.com/esimov/triangle, written in Golang) is installed and globally available.'
      )
    }

    debug(`Found globally available triangle binary`)
    triangleExecutable = 'triangle'
  }
}
