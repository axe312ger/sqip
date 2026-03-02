import { describe, test, expect } from 'vitest'
import webpack from 'webpack'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.resolve(__dirname, 'fixtures')

function runWebpack(config: webpack.Configuration): Promise<webpack.Stats> {
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) return reject(err)
      if (!stats) return reject(new Error('No stats returned'))
      if (stats.hasErrors()) {
        const info = stats.toJson()
        return reject(new Error(info.errors?.map((e) => e.message).join('\n')))
      }
      resolve(stats)
    })
  })
}

describe('sqip-loader webpack integration', () => {
  test('produces a module with metadata and svg from a JPEG', async () => {
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'sqip-webpack-test-')
    )

    const config: webpack.Configuration = {
      mode: 'production',
      entry: path.resolve(fixturesDir, 'webpack-entry.js'),
      output: {
        path: outputDir,
        filename: 'bundle.js',
        library: { type: 'commonjs2' }
      },
      module: {
        rules: [
          {
            test: /\.(jpg|jpeg|png|gif|webp)$/,
            use: [
              {
                loader: path.resolve(
                  fixturesDir,
                  '../../sqip-loader/src/index.ts'
                ),
                options: {
                  plugins: [
                    {
                      name: 'primitive',
                      options: { numberOfPrimitives: 4, mode: 0 }
                    },
                    'blur',
                    'svgo',
                    'data-uri'
                  ],
                  width: 128
                }
              }
            ]
          }
        ]
      },
      resolve: {
        extensionAlias: {
          '.js': ['.ts', '.js']
        }
      },
      resolveLoader: {
        extensions: ['.ts', '.js']
      }
    }

    const stats = await runWebpack(config)

    expect(stats.hasErrors()).toBe(false)

    const bundlePath = path.join(outputDir, 'bundle.js')
    const bundleContent = await fs.readFile(bundlePath, 'utf-8')

    // The bundle should contain SVG data and metadata
    expect(bundleContent).toContain('svg')
    expect(bundleContent).toContain('metadata')
    expect(bundleContent).toContain('dataURI')

    // Clean up
    await fs.rm(outputDir, { recursive: true, force: true })
  })
})
