const { resolve } = require('path')

const { readFile, writeFile } = require('fs-extra')
const dataUriToBuffer = require('data-uri-to-buffer')
const mozjpeg = require('mozjpeg')
const execa = require('execa')
const lqip = require('lqip')
const sqip = require('sqip').default
const htm = require('htm')
const vhtml = require('vhtml')

const html = htm.bind(vhtml)

const ROOT = resolve(__dirname, '..')
const ORIGINAL = resolve(__dirname, ROOT, 'public', 'original')
const PROCESSED = resolve(__dirname, ROOT, 'public', 'processed')
const DATASET = resolve(__dirname, ROOT, 'public', 'dataset.json')

async function writeImage({ dataURI, dist }) {
  const content = dataUriToBuffer(dataURI)
  await writeFile(dist, content)
}

const variants = [
  {
    name: 'original-minified',
    title: 'Original',
    description: html`
      <p>
        Minified with <a href="https://github.com/mozilla/mozjpeg">mozjpeg</a>
      </p>
    `,
    resultFileType: 'jpg',
    task: async ({ path, dist }) => {
      await execa(mozjpeg, ['-outfile', dist, path])
      const content = await readFile(dist)
      return content.toString()
    }
  },
  {
    name: 'lqip',
    title: 'LQIP',
    description: html`
      <p>
        Generated with <a href="https://github.com/zouhir/lqip-cli">lqip-cli</a>
      </p>
    `,
    resultFileType: 'jpg',
    task: async ({ path, dist }) => {
      const result = await lqip.base64(path)
      await writeImage({ dataURI: result, dist })
      return result
    }
  },
  {
    name: 'sqip',
    title: 'SQIP default',
    description: html`
      <p>Just the default settings</p>
    `,
    config: { input: 'path/to/file.jpg' },
    resultFileType: 'svg',
    task: async ({ path, dist }) => {
      const { svg } = await sqip({
        input: path
      })
      await writeImage({ dataURI: svg, dist })
      return svg
    }
  },
  {
    name: 'sqip-pixels',
    title: 'SQIP pixels',
    description: html`
      <p>
        Pixel art via${' '}
        <a
          href="https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-pixels#readme"
          >sqip-plugin-pixels</a
        >
      </p>
    `,
    config: {
      input: 'path/to/file.jpg',
      plugins: ['pixels', 'svgo', 'data-uri']
    },
    resultFileType: 'svg',
    task: async ({ path, dist }) => {
      const { svg } = await sqip({
        input: path,
        plugins: ['pixels', 'svgo', 'data-uri']
      })
      await writeImage({ dataURI: svg, dist })
      return svg
    }
  },
  {
    name: 'sqip-art',
    title: 'SQIP primitive art',
    description: html`
      <p>
        Primitive art with 100 triangles. More options:${' '}
        <a
          href="https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-primitive#readme"
          >sqip-plugin-primitive</a
        >
      </p>
    `,
    config: {
      input: 'path/to/file.jpg',
      plugins: [
        { name: 'primitive', options: { numberOfPrimitives: 50, mode: 1 } },
        'svgo',
        'data-uri'
      ]
    },
    resultFileType: 'svg',
    task: async ({ path, dist }) => {
      const { svg } = await sqip({
        input: path,
        plugins: [
          { name: 'primitive', options: { numberOfPrimitives: 50, mode: 1 } },
          'svgo',
          'data-uri'
        ]
      })
      await writeImage({ dataURI: svg, dist })
      return svg
    }
  }
]

module.exports = {
  ROOT,
  ORIGINAL,
  PROCESSED,
  DATASET,
  variants,
  html
}
