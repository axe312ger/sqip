import { SqipPlugin, SqipPluginOptions, PluginOptions } from 'sqip'

import SVGO from 'svgo'

interface SvgoPluginOptions extends SqipPluginOptions {
  pluginOptions: Partial<PluginOptions>
}

// SVGO with settings for maximum compression to optimize the Primitive-generated SVG
export default class SVGOPlugin extends SqipPlugin {
  constructor(options: SvgoPluginOptions) {
    super(options)

    const { pluginOptions } = options

    this.options = {
      multipass: true,
      floatPrecision: 1,
      plugins: [
        { removeDoctype: true },
        { removeXMLProcInst: true },
        { removeComments: true },
        { removeMetadata: true },
        { removeXMLNS: false },
        { removeEditorsNSData: true },
        { cleanupAttrs: true },
        { inlineStyles: true },
        { minifyStyles: true },
        { convertStyleToAttrs: true },
        { cleanupIDs: true },
        { prefixIds: true },
        { removeRasterImages: true },
        { removeUselessDefs: true },
        { cleanupNumericValues: true },
        { cleanupListOfValues: true },
        { convertColors: true },
        { removeUnknownsAndDefaults: true },
        { removeNonInheritableGroupAttrs: true },
        { removeUselessStrokeAndFill: true },
        { removeViewBox: false },
        { cleanupEnableBackground: true },
        { removeHiddenElems: true },
        { removeEmptyText: true },
        { convertShapeToPath: true },
        { moveElemsAttrsToGroup: true },
        { moveGroupAttrsToElems: true },
        { collapseGroups: true },
        { convertPathData: true },
        { convertTransform: true },
        { removeEmptyAttrs: true },
        { removeEmptyContainers: true },
        { mergePaths: true },
        { removeUnusedNS: true },
        { sortAttrs: true },
        { removeTitle: true },
        { removeDesc: true },
        { removeDimensions: true },
        { removeAttrs: false },
        { removeAttributesBySelector: false },
        { removeElementsByAttr: false },
        { addClassesToSVGElement: false },
        { removeStyleElement: false },
        { removeScriptElement: false },
        { addAttributesToSVGElement: false },
        { removeOffCanvasPaths: true },
        { reusePaths: true }
      ],
      ...pluginOptions
    }
  }
  async apply(svg: Buffer): Promise<Buffer> {
    const svgo = new SVGO(this.options)
    const { data } = await svgo.optimize(svg.toString())
    return Buffer.from(data)
  }
}
