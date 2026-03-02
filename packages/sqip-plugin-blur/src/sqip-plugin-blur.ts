import {
  loadSVG,
  PluginOptions,
  SqipPlugin,
  SqipPluginOptions,
  SqipCliOptionDefinition,
  SqipImageMetadata,
  parseColor
} from 'sqip'

interface BlurPluginOptions extends SqipPluginOptions {
  options: BlurOptions
}

interface BlurOptions extends PluginOptions {
  blur?: number | string
  styleBlur?: boolean
  legacyBlur?: boolean
  backgroundColor?: string
}

export default class SVGPlugin extends SqipPlugin {
  static get cliOptions(): SqipCliOptionDefinition[] {
    return [
      {
        name: 'blur',
        alias: 'b',
        type: Number || String,
        description:
          'Set the radius value [pixel] for the GaussianBlur CSS filter. See: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/blur',
        defaultValue: 12
      },
      {
        name: 'styleBlur',
        type: Boolean,
        description:
          'Use CSS style attribute instead of SVG filter attribute. See: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/filter',
        defaultValue: false
      },
      {
        name: 'legacyBlur',
        type: Boolean,
        description:
          'Use GaussianBlur SVG filter instead of CSS blur. See: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/feGaussianBlur',
        defaultValue: false
      },
      {
        name: 'backgroundColor',
        type: String,
        description:
          'If set, the plugin will add an rectangle overlapping the image dimensions to ensure css blur will not create ugly or transparent image borders and corners. Only takes effect when using css blur.',
        defaultValue: 'Muted'
      }
    ]
  }
  constructor(options: BlurPluginOptions) {
    super(options)
    const { pluginOptions } = options
    this.options = {
      blur: 12,
      legacyBlur: false,
      backgroundColor: 'Muted',
      ...pluginOptions
    }
  }

  async apply(
    imageBuffer: Buffer,
    metadata: SqipImageMetadata
  ): Promise<Buffer> {
    if (!this.options.blur) {
      return imageBuffer
    }

    if (!this.options.blur) {
      return imageBuffer
    }

    const svg = imageBuffer.toString()

    const { svg: canvas, SVG } = await loadSVG(svg)

    const group = SVG(`<g/>`)

    if (this.options.legacyBlur) {
      const blurFilterId = 'b'
      group.attr('filter', `url(#${blurFilterId})`)

      SVG(
        `<filter id="${blurFilterId}">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${this.options.blur}" />
        <feComponentTransfer>
            <feFuncA type="discrete" tableValues="1 1"/>
        </feComponentTransfer>
      </filter>`
      )
        .addTo(canvas)
        .front()
    } else {
      const cssBlur =
        typeof this.options.blur === 'string'
          ? this.options.blur
          : `${this.options.blur}px`

      if (this.options.styleBlur)
        group.attr('style', `filter: blur(${cssBlur});`)
      else
        group.attr('filter', `blur(${cssBlur})`)

      const bg = String(
        this.options.backgroundColor
          ? parseColor({
              color: this.options.backgroundColor as string, // @todo TypeScript of our plugins really needs some love
              palette: metadata.palette
            })
          : metadata.palette['Muted']?.hex
      ).toLowerCase()

      if (!bg.match(/[0-9a-f]{6}00/)) {
        const imageBorderFix = SVG(
          `<rect x="-50%" y="-50%" width="200%" height="200%" fill="${bg}"/>`
        )
        imageBorderFix.addTo(group)
      }
    }

    canvas.children().each((child) => child.putIn(group))

    group.addTo(canvas)

    return Buffer.from(canvas.svg())
  }
}
