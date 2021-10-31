import { resolve } from 'path'
import { tmpdir } from 'os'

import { promises as fs } from 'fs'
import dataURIToBuffer from 'data-uri-to-buffer'
import mozjpeg from 'mozjpeg'
import execa from 'execa'
import lqip from 'lqip'
import * as sqipWtf from 'sqip'
import sqipLegacy from 'sqip-legacy'
import htm from 'htm'
import vhtml from 'vhtml'
import sharp from 'sharp'

// @todo why is that?
const sqip = sqipWtf.default.default

const { readFile, writeFile, unlink } = fs

export const html = htm.bind(vhtml)

export const ORIGINAL = resolve('.', 'public', 'original')
export const PROCESSED = resolve('.', 'public', 'processed')
export const DATASET = resolve('.', 'public', 'dataset.json')

export async function writeImage({ dataURI, dist }) {
  const content = dataURIToBuffer(dataURI)
  await writeFile(dist, content)
}

export const variants = [
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
      const rawThumbnail = await sharp(path).resize(300).jpeg().toBuffer()
      const tmpPath = resolve(
        tmpdir(),
        `sqip-demo-tmp-thumbnail-${Date.now()}.jpg`
      )
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
    name: 'lqip-custom',
    title: 'LQIP custom',
    description: html`
      <p>
        32px thumbnail generated with
        <a href="https://sharp.dimens.io/en/stable/">sharp</a>, minified with
        <a href="https://github.com/mozilla/mozjpeg">mozjpeg</a>
      </p>
    `,
    resultFileType: 'jpg',
    task: async ({ path, dist }) => {
      const rawThumbnail = await sharp(path).resize(32).jpeg().toBuffer()
      const tmpPath = resolve(tmpdir(), `sqip-demo-tmp-lqip-${Date.now()}.jpg`)
      await writeFile(tmpPath, rawThumbnail)
      await execa(mozjpeg, ['-outfile', dist, tmpPath])
      await unlink(tmpPath)
      const optimizedThumbnail = await readFile(dist)
      return optimizedThumbnail.toString()
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
    description: html` <p>Just the default settings</p> `,
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
  },
  {
    name: 'sqip-potrace',
    title: 'SQIP potrace',
    description: html`
      <p>
        Default settings of
        <a
          href="https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-potrace#readme"
          >sqip-plugin-potrace</a
        >
      </p>
    `,
    config: {
      input: 'path/to/file.jpg',
      plugins: ['potrace', 'svgo', 'data-uri']
    },
    resultFileType: 'svg',
    task: async ({ path, dist }) => {
      const {
        metadata: { dataURI }
      } = await sqip({
        input: path,
        plugins: ['potrace', 'svgo', 'data-uri']
      })
      await writeImage({ dataURI, dist })
      return dataURI
    }
  },
  {
    name: 'sqip-potrace-posterize',
    title: 'SQIP potrace posterize',
    description: html`
      <p>
        Use of potrace's posterize feature
        <a
          href="https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-potrace#readme"
          >sqip-plugin-potrace</a
        >
      </p>
    `,
    config: {
      input: 'path/to/file.jpg',
      plugins: [
        { name: 'potrace', options: { posterize: true } },
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
          { name: 'potrace', options: { posterize: true } },
          'svgo',
          'data-uri'
        ]
      })
      await writeImage({ dataURI, dist })
      return dataURI
    }
  }
]
