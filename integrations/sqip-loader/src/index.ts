import type { RawLoaderDefinitionFunction } from 'webpack'
import { sqip } from 'sqip'
import type { SqipOptions, SqipResult } from 'sqip'
import path from 'path'

export interface SqipLoaderOptions {
  plugins?: SqipOptions['plugins']
  width?: number
}

const sqipLoader: RawLoaderDefinitionFunction<SqipLoaderOptions> = function (
  source
) {
  const callback = this.async()
  const options = this.getOptions()
  const resourcePath = this.resourcePath
  const outputFileName = path.parse(resourcePath).name

  const sqipOptions: SqipOptions = {
    input: Buffer.from(source),
    outputFileName,
    silent: true,
    ...options
  }

  sqip(sqipOptions)
    .then((result) => {
      const { metadata } = (
        Array.isArray(result) ? result[0] : result
      ) as SqipResult
      const svg = (
        Array.isArray(result)
          ? (result[0] as SqipResult).content
          : (result as SqipResult).content
      ).toString()

      const output = JSON.stringify({ metadata, svg })
      callback(null, `export default ${output}`)
    })
    .catch((err: Error) => {
      callback(err)
    })
}

export default sqipLoader
