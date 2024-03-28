import path from 'path'

import { SVG, registerWindow, Element } from '@svgdotjs/svg.js'
import Debug from 'debug'
import expandTilde from 'expand-tilde'
import fastGlob from 'fast-glob'
import fs from 'fs-extra'
import sharp from 'sharp'

import type { Palette } from '@behold/sharp-vibrant/lib/color'

const debug = Debug('sqip')

export const loadSVG = async (
  svg: string
): Promise<{ svg: Element; SVG: typeof SVG }> => {
  const { createSVGWindow } = await import('svgdom')
  const window = createSVGWindow()
  const document = window.document
  registerWindow(window, document)

  return { svg: SVG(svg), SVG }
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

export async function findBackgroundColor(imageBuffer: Buffer): Promise<string> {
  const image = sharp(imageBuffer)
  const { width, height } = await image.metadata()

  if (!width || !height) {
    throw new Error(
      'Unable to detect image sizes for background color extraction.'
    )
  }

  // Sample edge pixels
  const edgePixels = await Promise.all([
    // Top left corner
    image
      .clone()
      .extract({ left: 0, top: 0, width: 1, height: 1 })
      .raw()
      .toBuffer(),
    // Top right corner
    image
      .clone()
      .extract({ left: 1, top: 1, width: 1, height: 1 })
      .raw()
      .toBuffer(),
    // Bottom left corner
    image
      .clone()
      .extract({ left: 0, top: height - 1, width: 1, height: 1 })
      .raw()
      .toBuffer(),
    // Bottom right corner
    image
      .clone()
      .extract({ left: width - 1, top: height - 1, width: 1, height: 1 })
      .raw()
      .toBuffer()
  ])

  // Process edge pixels to find the most common color including alpha channel
  const colors = edgePixels.map((pixel) => {
    // Convert raw pixel data (RGBA) to hex color, including alpha
    return '#' + pixel.toString('hex')
  })

  // Count occurrences of each color, considering the alpha channel
  const colorCount = colors.reduce<{
    [color: string]: number
  }>((acc, color) => {
    acc[color] = (acc[color] || 0) + 1
    return acc
  }, {})

  // Find the most frequent color, taking into account transparency
  const backgroundColor = Object.keys(colorCount).reduce((a, b) =>
    colorCount[a] > colorCount[b] ? a : b
  )

  // If you want to detect and handle (semi) transparent backgrounds specifically
  const isTransparent = (color: string) => {
    // Extract the alpha value from the hex color
    const alpha = parseInt(color.slice(7, 9), 16) / 255
    return alpha < 1
  }

  // Example usage: Check if the background is transparent
  if (isTransparent(backgroundColor)) {
    return backgroundColor
  }
  return backgroundColor
}
