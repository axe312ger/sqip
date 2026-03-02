import { encode, decode } from 'blurhash'
import sharp from 'sharp'

import {
  PluginOptions,
  SqipPluginOptions,
  SqipCliOptionDefinition,
  SqipImageMetadata,
  SqipPlugin
} from 'sqip'

interface PixelConfig extends PluginOptions {
  resizeWidth: number
  resizeHeight: number
  width: number
  height: number
}

type PixelOptions = Partial<PixelConfig>

interface BlurhashPluginOptions extends SqipPluginOptions {
  pluginOptions: PixelOptions
}

export default class BlurhashPlugin extends SqipPlugin {
  static get cliOptions(): SqipCliOptionDefinition[] {
    return [
      {
        name: 'width',
        type: Number,
        description: 'The number of horizontal blur components. (Maximum is 9)',
        defaultValue: 4
      },
      {
        name: 'height',
        type: Number,
        description: 'The number of vertical blur components. (Maximum is 9)',
        defaultValue: -1
      },
      {
        name: 'resizeWidth',
        type: Number,
        description: 'Fit image into width to speed up processing',
        defaultValue: 64
      },
      {
        name: 'resizeHeight',
        type: Number,
        description: 'Fit image into height to speed up processing',
        defaultValue: -1
      }
    ]
  }
  public options: PixelConfig

  constructor(options: BlurhashPluginOptions) {
    super(options)

    const { pluginOptions } = options

    this.options = Object.assign(
      {},
      { resizeWidth: 64, resizeHeight: -1, width: 4, height: -1 },
      pluginOptions
    )
  }

  async apply(
    imageBuffer: Buffer,
    metadata: SqipImageMetadata
  ): Promise<Buffer> {
    if (metadata.type === 'svg') {
      throw new Error(
        'The blurhash plugin needs a raster image buffer as input. Check if you run this plugin in the first place.'
      )
    }

    const aspectRatio = metadata.width / metadata.height
    const resizeWidth =
      this.options.resizeWidth > 0 ? this.options.resizeWidth : metadata.width
    const resizeHeight =
      this.options.resizeHeight > 0
        ? this.options.resizeHeight
        : Math.round(resizeWidth * aspectRatio)

    const componentsWidth = Math.min(9, this.options.width)
    const componentsHeight = Math.min(
      9,
      this.options.height > 0
        ? this.options.resizeHeight
        : Math.round(componentsWidth * aspectRatio)
    )

    const hash: string = await new Promise((resolve, reject) => {
      sharp(imageBuffer)
        .raw()
        .ensureAlpha()
        .resize(resizeWidth, resizeHeight, {
          fit: 'inside'
        })
        .toBuffer((err, buffer, { width, height }) => {
          if (err) return reject(err)
          resolve(
            encode(
              new Uint8ClampedArray(buffer),
              width,
              height,
              componentsWidth,
              componentsHeight
            )
          )
        })
    })

    const pixels = decode(hash, componentsWidth, componentsHeight)

    const resizedImageBuf = await sharp(Buffer.from(pixels), {
      raw: {
        channels: 4,
        width: componentsWidth, //this.options.width,
        height: componentsHeight //this.options.height
      }
    })
      .jpeg({
        overshootDeringing: true,
        quality: 40
      })
      .toBuffer()

    metadata.blurhash = hash
    metadata.dataURIBase64 = `data:image/jpeg;base64,${resizedImageBuf.toString('base64')}`

    return resizedImageBuf
  }
}
