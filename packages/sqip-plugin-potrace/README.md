# `sqip-plugin-potrace`

> SQIP plugin to trace raster images into SVG vector paths

Traces raster images into SVG vector paths using [@gatsbyjs/potrace](https://www.npmjs.com/package/@gatsbyjs/potrace), a Node.js implementation of the [Potrace](http://potrace.sourceforge.net/) algorithm. Supports both single-color tracing (default) and multi-color posterization. Produces clean, stylized silhouettes of the original image.

## Examples

| Original (59 KB) | Trace — default (8.5 KB) | Posterize — 8 steps (27.6 KB) |
|---|---|---|
| <img src="./examples/beach.jpg" width="300" alt="Original" /> | <img src="./examples/beach-sqip-potrace.svg" width="300" alt="Trace" /> | <img src="./examples/beach-sqip-potrace-posterize.svg" width="300" alt="Posterize" /> |

> Try the [interactive demo](https://sqip.vercel.app/) to compare all plugins and configurations side by side.

## Installation

```bash
npm install sqip sqip-plugin-potrace
```

## Options

| Option         | Type    | Default                 | CLI Flag                  | Description                                                                     |
| -------------- | ------- | ----------------------- | ------------------------- | ------------------------------------------------------------------------------- |
| `posterize`    | Boolean | `false`                 | `--potrace-posterize`     | Use posterize mode instead of trace (multi-color output)                        |
| `steps`        | Number  | `4`                     | `--potrace-steps`         | Number of threshold steps (posterize mode only)                                 |
| `color`        | String  | *auto*                  | `--potrace-color`         | Fill color — SQIP picks a fitting color by default                              |
| `background`   | String  | *auto*                  | `--potrace-background`    | Background color — SQIP picks a fitting color by default                        |
| `turnPolicy`   | String  | `'TURNPOLICY_MINORITY'` | `--potrace-turnPolicy`    | Ambiguity resolution: TURNPOLICY_BLACK, TURNPOLICY_WHITE, TURNPOLICY_LEFT, TURNPOLICY_RIGHT, TURNPOLICY_MINORITY, TURNPOLICY_MAJORITY |
| `turdSize`     | Number  | `2`                     | `--potrace-turdSize`      | Suppress speckles up to this pixel size                                         |
| `alphaMax`     | Number  | `1`                     | `--potrace-alphaMax`      | Corner threshold parameter                                                      |
| `optCurve`     | Boolean | `true`                  | `--potrace-optCurve`      | Enable curve optimization                                                       |
| `optTolerance` | Number  | `0.2`                   | `--potrace-optTolerance`  | Curve optimization tolerance                                                    |
| `threshold`    | Number  | *auto*                  | `--potrace-threshold`     | Black/white threshold (0–255). Auto uses multilevel thresholding algorithm.     |
| `blackOnWhite` | Boolean | `true`                  | `--potrace-blackOnWhite`  | Which side of the threshold becomes the vector shape                            |

## Usage

### Node API

```js
import { sqip } from 'sqip'

// Single-color trace
const traced = await sqip({
  input: 'photo.jpg',
  plugins: [
    'sqip-plugin-potrace',
    'sqip-plugin-svgo',
    'sqip-plugin-data-uri',
  ],
})

// Multi-color posterize
const posterized = await sqip({
  input: 'photo.jpg',
  plugins: [
    { name: 'sqip-plugin-potrace', options: { posterize: true, steps: 8 } },
    'sqip-plugin-svgo',
    'sqip-plugin-data-uri',
  ],
})
```

### CLI

```bash
# Default trace
sqip -i photo.jpg -p potrace -p svgo

# Posterize with 8 steps
sqip -i photo.jpg -p potrace -p svgo --potrace-posterize --potrace-steps 8
```

## Part of SQIP

This plugin is part of the [SQIP](https://github.com/axe312ger/sqip) project. See the main README for the full list of plugins and integrations.
