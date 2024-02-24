import { SqipPlugin, SqipPluginOptions, PluginOptions } from 'sqip'

import { optimize } from 'svgo'

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
        'preset-default',
        'cleanupAttrs',
        'cleanupEnableBackground',
        'cleanupIds',
        'cleanupListOfValues',
        'collapseGroups',
        'convertColors',
        'convertStyleToAttrs',
        'mergeStyles',
        'minifyStyles',
        'prefixIds',
        'removeComments',
        {
          name: 'removeDesc',
          params: {
            removeAny: true
          }
        },
        'removeDimensions',
        'removeEditorsNSData',
        'removeElementsByAttr',
        'removeEmptyAttrs',
        'removeEmptyContainers',
        'removeEmptyText',
        'removeHiddenElems',
        'removeOffCanvasPaths',
        'removeRasterImages',
        'removeScriptElement',
        'removeStyleElement',
        'removeTitle',
        'removeUselessDefs',
        'removeUselessStrokeAndFill',
        'reusePaths',
        'sortAttrs'
        // 'mergePaths' risky?
      ],
      ...pluginOptions
    }
  }
  apply(svg: Buffer): Buffer {
    const result = optimize(svg.toString(), this.options)

    if ('data' in result) {
      return Buffer.from(result.data)
    }

    throw new Error(
      `SVGO returned an invalid result:\n${JSON.stringify(result, null, 2)}`
    )
  }
}
