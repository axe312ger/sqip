const { join, resolve } = require('path')

const { readJSON, writeFile } = require('fs-extra')
const convertHrtime = require('convert-hrtime')
const _ = require('lodash')

const { DATASET, variants, html } = require('./config')

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
  image: { dimensions: originalDimensions }
}) {
  const downloadRate = 400 * 1000
  const downloadRtt = 400
  const calcDownloadTime = bytes => {
    return ((bytes / downloadRate + downloadRtt) / 1000).toFixed(3)
  }

  const padding = Math.floor(
    (originalDimensions.height / originalDimensions.width) * 100
  )
  const url = join('.', 'processed', name)
  const wrapperStyle = `padding-bottom: ${padding}%;`
  return html`
    <td>
      ${variantName === 'original-minified'
        ? html`
            <img class="preview" alt="${name}" src="${url}" height="auto" />
          `
        : html`
            <div class="preview-wrapper" style="${wrapperStyle}">
              <img class="preview" alt="${name}" src="${url}" height="auto" />
            </div>
          `}
      <div class="overlay">
        <p>
          <strong><a href="${url}">${name}</a></strong>
        </p>
        <p>Size: ${width}×${height} (${ratio})</p>
        <table>
          <thead>
            <tr>
              <th></th>
              <th><img src="./assets/file-size.svg" width="24" /></th>
              <th><img src="./assets/download-time.svg" width="24" /></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>original</td>
              <td>
                <span title="${originalBytes}b">${originalHuman}</span>
              </td>
              <td>
                ${calcDownloadTime(originalBytes)}s
              </td>
            </tr>
            <tr>
              <td>gzip</td>
              <td>
                <span title="${gzipBytes}b">${gzipHuman}</span>
                ${' ↓'}${Math.floor(gzipBytes / (originalBytes / 100))}%
              </td>
              <td>
                ${calcDownloadTime(gzipBytes)}s
              </td>
            </tr>
            <tr>
              <td>brotli</td>
              <td>
                <span title="${brotliBytes}b">${brotliHuman}</span>
                ${' ↓'}${Math.floor(brotliBytes / (originalBytes / 100))}%
              </td>
              <td>
                ${calcDownloadTime(brotliBytes)}s
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
  return html`
    <tr>
      ${results.map(result => {
        return html`
          <${VariantResult} ...${result} image="${image}" />
        `
      })}
    </tr>
  `
}

;(async () => {
  const images = await readJSON(DATASET)

  const processingTimes = variants.map(({ name }) => {
    return images.reduce((total, { results }) => {
      const time = results.find(({ variantName }) => variantName === name)
        .processTime
      return total + convertHrtime(time).seconds
    }, 0)
  })

  const indexPath = resolve(__dirname, '..', 'public', 'index.html')

  await writeFile(
    indexPath,
    html`
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>SQIP demo</title>
          <style type="text/css">
            body {
              font-family: sans-serif;
              background: black;
              padding: 2rem;
              color: white;
            }
            a {
              color: tomato;
            }
            a:visited {
              color: firebrick;
            }
            img.preview {
              display: block;
              width: 100%;
            }
            table {
              border-collapse: collapse;
              border-spacing: 0;
              table-layout: fixed;
              width: 100%;
            }
            td {
              position: relative;
              padding: 0;
            }
            td:hover .overlay {
              display: flex;
            }
            td,
            th {
              width: 300px;
            }
            th {
              text-align: left;
              padding: 1rem;
            }
            .description {
              padding: 1rem;
            }
            details {
              margin-top: 1rem;
            }
            .overlay {
              display: none;
              position: absolute;
              left: 0;
              right: 0;
              top: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.6);
              padding: 1rem;
              color: white;
              flex-direction: column;
              justify-content: center;
            }
            .overlay table {
              font-size: 0.85em;
              table-layout: auto;
            }
            .overlay td,
            .overlay th {
              text-align: left;
              color: white;
              width: auto;
              padding: 0.25rem;
              vertical-align: top;
            }
            .preview-wrapper {
              position: relative;
              height: 0;
              overflow: hidden;
            }
            .preview-wrapper img {
              position: absolute;
              width: 100%;
              height: 100%;
            }
            p.processing-time img {
              vertical-align: text-bottom;
            }
          </style>
        </head>
        <body>
          <h1>
            SQIP Demo${' '}
            <a href="https://github.com/axe312ger/sqip">
              <img src="./assets/github.svg" width="32" />
            </a>
          </h1>

          <table>
            <thead>
              <tr>
                ${variants.map(({ title }) => {
                  return html`
                    <th>${title}</th>
                  `
                })}
              </tr>
              <tr>
                ${variants.map(({ description, config }, i) => {
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
                          ${(processingTimes[i] / images.length).toFixed(3)}s
                        </p>
                        ${config &&
                          html`
                            <details>
                              <summary>config:</summary>
                              <pre><code>${JSON.stringify(
                                config,
                                null,
                                2
                              )}</code></pre>
                            </details>
                          `}
                      </div>
                    </td>
                  `
                })}
              </tr>
            </thead>
            <tbody>
              ${images.map(
                image =>
                  html`
                    <${Row} image="${image}" />
                  `
              )}
            </tbody>
          </table>
        </body>
      </html>
    `
  )

  console.log('Done:', indexPath)
})()
