const { resolve } = require('path')
const { tmpdir } = require('os')

const { readFile, writeFile, unlink } = require('fs-extra')
const dataURIToBuffer = require('data-uri-to-buffer')
const mozjpeg = require('mozjpeg')
const execa = require('execa')
const lqip = require('lqip')
const sqip = require('sqip').default
const sqipLegacy = require('sqip-legacy')
const htm = require('htm')
const vhtml = require('vhtml')
const sharp = require('sharp')

const html = htm.bind(vhtml)

const ROOT = resolve(__dirname, '..')
const ORIGINAL = resolve(__dirname, ROOT, 'public', 'original')
const PROCESSED = resolve(__dirname, ROOT, 'public', 'processed')
const DATASET = resolve(__dirname, ROOT, 'public', 'dataset.json')

async function writeImage({ dataURI, dist }) {
  const content = dataURIToBuffer(dataURI)
  await writeFile(dist, content)
}

const variants = [
  {
    name: 'thumbnail',
    title: 'Thumbnail',
    description: html`
      <p>
        300px thumbnail of the original image, minified with
        <a href="https://github.com/mozilla/mozjpeg">mozjpeg</a>
      </p>
    `,
    resultFileType: 'jpg',
    task: async ({ path, dist }) => {
      const rawThumbnail = await sharp(path)
        .resize(300)
        .toBuffer()
      const tmpPath = resolve(tmpdir(), `sqip-demo-tmp-${Date.now()}.jpg`)
      await writeFile(tmpPath, rawThumbnail)
      await execa(mozjpeg, ['-outfile', dist, tmpPath])
      await unlink(tmpPath)
      const optimizedThumbnail = await readFile(dist)
      return optimizedThumbnail.toString()
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
    name: 'sqip-legacy',
    title: 'SQIP v0.3.3',
    description: html`
      <p>The old version of SQIP. For comparision to v1.0.0</p>
    `,
    config: { filename: 'path/to/file.jpg' },
    resultFileType: 'svg',
    task: async ({ path, dist }) => {
      const { svg_base64encoded } = sqipLegacy({ filename: path })
      const dataURI = `data:image/svg;base64,${svg_base64encoded}`
      await writeImage({ dataURI, dist })
      return dataURI
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
      const {
        metadata: { dataURI }
      } = await sqip({
        input: path
      })
      await writeImage({ dataURI, dist })
      return dataURI
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
      const {
        metadata: { dataURI }
      } = await sqip({
        input: path,
        plugins: ['pixels', 'svgo', 'data-uri']
      })
      await writeImage({ dataURI, dist })
      return dataURI
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
      const {
        metadata: { dataURI }
      } = await sqip({
        input: path,
        plugins: [
          { name: 'primitive', options: { numberOfPrimitives: 50, mode: 1 } },
          'svgo',
          'data-uri'
        ]
      })
      await writeImage({ dataURI, dist })
      return dataURI
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
