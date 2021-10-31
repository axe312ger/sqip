import { join, resolve } from 'path'

import { promises as fs } from 'fs'
import convertHrtime from 'convert-hrtime'
import prettyBytes from 'pretty-bytes'

import { DATASET, variants, html } from './config.mjs'
import template from './template.mjs'

const { readFile, writeFile } = fs

function VariantResult({
  variantName,
  name,
  sizes: {
    originalBytes,
    gzipBytes,
    brotliBytes,
    originalHuman,
    gzipHuman,
    brotliHuman
  },
  dimensions: { width, height, ratio },
  image: { dimensions: originalDimensions },
  originalSize
}) {
  const padding = Math.floor(
    (originalDimensions.height / originalDimensions.width) * 100
  )
  const url = join('.', 'processed', name)
  const wrapperStyle = `padding-bottom: ${padding}%;`
  const originalPercent = ((gzipBytes / originalSize) * 100).toFixed(2)
  return html`
    <td>
      ${variantName === 'original-minified'
        ? html`
            <img class="preview" alt="${name}" src="${url}" height="auto" />
          `
        : html`
            <div class="preview-wrapper" style="${wrapperStyle}">
              <img
                class="${[
                  'preview',
                  variantName.indexOf('lqip') !== -1 && 'lqip'
                ]
                  .filter(Boolean)
                  .join(' ')}"
                alt="${name}"
                src="${url}"
                height="auto"
              />
            </div>
          `}
      <div class="sizes">${originalPercent}%</div>
      <div class="overlay">
        <p>
          <strong><a href="${url}">${name}</a></strong>
        </p>
        <p>Size: ${width}×${height} (${ratio})</p>
        <table>
          <thead>
            <tr>
              <th></th>
              <th colspan="2">
                <img src="./assets/file-size.svg" width="24" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>original</td>
              <td title="${`Real size: ${originalBytes}b`}" colspan="2">
                ${originalHuman}
              </td>
              <td></td>
            </tr>
            <tr>
              <td>gzip</td>
              <td title="${`Real size: ${gzipBytes}b`}">${gzipHuman}</td>
              <td title="Size compared to thumbnail">
                ${' ↓'}${100 - Math.floor(gzipBytes / (originalBytes / 100))}%
              </td>
            </tr>
            <tr>
              <td>brotli</td>
              <td title="${`Real size: ${brotliBytes}b`}">${brotliHuman}</td>
              <td title="Size compared to thumbnail">
                ${' ↓'}${100 - Math.floor(brotliBytes / (originalBytes / 100))}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </td>
  `
}

const Row = ({ image }) => {
  const { results } = image

  const originalSize = results[0].sizes.gzipBytes

  return html`
    <tr>
      ${results.map((result) => {
        return html`
          <${VariantResult}
            ...${result}
            image="${image}"
            originalSize="${originalSize}"
          />
        `
      })}
    </tr>
  `
}

;(async () => {
  const imagesFile = await readFile(DATASET)
  const images = JSON.parse(imagesFile.toString())

  const processingTimes = variants.map(({ name }) => {
    return images.reduce((total, { results }) => {
      const time = results.find(
        ({ variantName }) => variantName === name
      ).processTime
      return total + convertHrtime(time).seconds
    }, 0)
  })

  const compressedSizes = variants.map(({ name }) => {
    return images.reduce((total, { results }) => {
      const {
        sizes: { gzipBytes }
      } = results.find(({ variantName }) => variantName === name)
      return total + gzipBytes
    }, 0)
  })

  const indexPath = resolve('.', 'public', 'index.html')

  const pageContent = template(html`
    <table>
      <thead>
        <tr>
          ${variants.map(({ title }) => {
            return html` <th>${title}</th> `
          })}
        </tr>
        <tr>
          ${variants.map(({ description, config }, i) => {
            const compressedSize = compressedSizes[i]
            const originalSize = compressedSizes[0]
            const averageBytes = Math.round(compressedSize / images.length)
            const originalPercent = (
              (compressedSize / originalSize) *
              100
            ).toFixed(2)
            return html`
              <td>
                <div class="description">
                  ${description}
                  <p class="processing-time">
                    <img
                      alt="average processing time"
                      src="./assets/processing-time.svg"
                      width="20"
                    />
                    <span title="Average processing time"
                      >${(processingTimes[i] / images.length).toFixed(3)}s</span
                    >
                    <span title="Average size"
                      >${' | ø '}${prettyBytes(averageBytes)}</span
                    >
                    <span title="Average size compared to thumbnail"
                      >${' | ↓ '}${originalPercent}%</span
                    >
                  </p>
                  ${config &&
                  html`
                    <details>
                      <summary>config:</summary>
                      <pre><code>${JSON.stringify(config, null, 2)}</code></pre>
                    </details>
                  `}
                </div>
              </td>
            `
          })}
        </tr>
      </thead>
      <tbody>
        ${images.map((image) => html` <${Row} image="${image}" /> `)}
      </tbody>
    </table>
  `)

  await writeFile(indexPath, pageContent)
  console.log('Done:', indexPath)
})()
