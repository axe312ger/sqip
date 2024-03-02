import path from 'path'

import cheerio from 'cheerio'
import Debug from 'debug'
import expandTilde from 'expand-tilde'
import fastGlob from 'fast-glob'
import fs from 'fs-extra'

import type { Palette } from '@behold/sharp-vibrant/lib/color'

const debug = Debug('sqip')

export const loadSVG = (svg: string) => {
  return cheerio.load(svg, {
    xmlMode: true
  })
}

export function isError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error
}

export async function locateFiles(input: string): Promise<string[]> {
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
    if (isError(err) && err instanceof TypeError) {
      if (err.code === 'ENOENT') {
        throw err
      }
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

interface ParseColorOptions {
  palette: Palette
  color: string
}

export function parseColor({ palette, color }: ParseColorOptions): string {
  // @todo test, fallback to or detect transparent as color (for bg)
  return palette[color]?.hex || color
}
