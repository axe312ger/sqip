import path from 'path'

import cheerio from 'cheerio'
import Debug from 'debug'
import expandTilde from 'expand-tilde'
import fastGlob from 'fast-glob'
import fs from 'fs-extra'

const debug = Debug('sqip')

export const loadSVG = (svg) => {
  return cheerio.load(svg, {
    normalizeWhitespace: true,
    xmlMode: true
  })
}

export async function locateFiles(input) {
  const enhancedInput = expandTilde(input)
  let globPattern = enhancedInput
  try {
    const stat = await fs.lstat(enhancedInput)

    if (stat.isFile()) {
      debug(`input ${input} is a file. Skip file search.`)
      return [enhancedInput]
    }

    if (stat.isDirectory()) {
      debug(
        `input ${input} is a directory. Enhancing with * to match all files.`
      )
      globPattern = `${path.resolve(enhancedInput)}/*`
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
  }

  // Find all files matching the enhanced glob
  const files = await fastGlob(globPattern, {
    onlyFiles: true,
    extglob: true,
    absolute: true
  })

  // Test if files are found
  if (!files.length) {
    throw new Error(
      `Unable to find any files via ${globPattern}. Make sure the file exists.

If you are using globbing patterns, the following features are supported:

https://github.com/micromatch/micromatch#matching-features`
    )
  }

  return files
}

export function parseColor({ palette, color }) {
  return color in palette ? palette[color].getHex() : color
}
