import type { Plugin } from 'vite'
import { sqip } from 'sqip'
import type { SqipOptions, SqipResult } from 'sqip'

export interface VitePluginSqipOptions {
  plugins?: SqipOptions['plugins']
  width?: number
}

const SQIP_QUERY = '?sqip'
const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif|tiff?)$/i

function stripQuery(id: string): string {
  return id.replace(/\?.*$/, '')
}

export default function sqipPlugin(options: VitePluginSqipOptions = {}): Plugin {
  return {
    name: 'vite-plugin-sqip',
    enforce: 'pre',

    async load(id) {
      if (!id.includes(SQIP_QUERY)) return null

      const filePath = stripQuery(id)

      if (!IMAGE_RE.test(filePath)) return null

      const sqipOptions: SqipOptions = {
        input: filePath,
        silent: true,
        ...options
      }

      const result = await sqip(sqipOptions)
      const { metadata } = (
        Array.isArray(result) ? result[0] : result
      ) as SqipResult
      const svg = (
        Array.isArray(result)
          ? (result[0] as SqipResult).content
          : (result as SqipResult).content
      ).toString()

      const output = JSON.stringify({ metadata, svg })
      return `export default ${output}`
    }
  }
}
