# `sqip`

> SQIP core library — SVG-Based Image Placeholder

**SQIP** (pronounced \skwɪb\) is a flexible, pluggable image processor available as a Node.js API. By combining plugins, you can generate super-tiny SVG image previews, create abstract art from photographs, or quickly process a set of images.

This is the core library. You'll also need one or more plugins — see [Plugins](#plugins) below.

## Installation

```bash
npm install sqip sqip-plugin-primitive sqip-plugin-blur sqip-plugin-svgo sqip-plugin-data-uri
```

Install `sqip` plus whichever plugins you need. The default pipeline uses `primitive → blur → svgo → data-uri`.

## Usage

SQIP is async and returns a result object (or an array when processing multiple files).

```js
import { sqip } from 'sqip'

const result = await sqip({
  input: 'path/to/image.jpg',
  plugins: [
    { name: 'sqip-plugin-primitive', options: { numberOfPrimitives: 8, mode: 0 } },
    'sqip-plugin-blur',
    'sqip-plugin-svgo',
    'sqip-plugin-data-uri',
  ],
})

console.log(result)
```

### Result Object

```js
{
  content: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 188">...</svg>'),
  metadata: {
    originalWidth: 1024,
    originalHeight: 640,
    palette: {
      Vibrant: Vibrant.Swatch,
      DarkVibrant: Vibrant.Swatch,
      LightVibrant: Vibrant.Swatch,
      Muted: Vibrant.Swatch,
      DarkMuted: Vibrant.Swatch,
      LightMuted: Vibrant.Swatch
    },
    width: 300,
    height: 188,
    type: 'svg',
    dataURI: "data:image/svg+xml,...",       // added by sqip-plugin-data-uri
    dataURIBase64: 'data:image/svg+xml;base64,...'  // added by sqip-plugin-data-uri
  }
}
```

Palette colors come from [node-vibrant](https://github.com/akfish/node-vibrant#vibrantswatch). Plugins may add additional metadata fields.

### Process a Folder

```js
import { sqip } from 'sqip'
import { resolve } from 'path'

const results = await sqip({
  input: resolve('images/originals'),
  output: resolve('images/previews'),
})

console.log(results) // Array of result objects
```

### Custom Plugin Config

```js
const result = await sqip({
  input: 'photo.jpg',
  plugins: [
    { name: 'sqip-plugin-primitive', options: { numberOfPrimitives: 20, mode: 1 } },
    'sqip-plugin-svgo',
    'sqip-plugin-data-uri',
  ],
})
```

## Options

| Option    | Type             | Default                                         | Description                                              |
| --------- | ---------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `input`   | String           | *(required)*                                    | Input file, directory, or glob pattern                   |
| `output`  | String           |                                                 | Output file or directory                                 |
| `width`   | Number           | `300`                                           | Width of the resulting SVG (0 or negative = original)    |
| `plugins` | Array            | `['primitive', 'blur', 'svgo', 'data-uri']`     | Array of plugin names or `{ name, options }` objects     |

## Plugins

| Plugin | Description |
| ------ | ----------- |
| [`sqip-plugin-primitive`](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-primitive#readme) | Generate SVG shapes using Primitive |
| [`sqip-plugin-blur`](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-blur#readme) | Add CSS or SVG blur to the image |
| [`sqip-plugin-svgo`](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-svgo#readme) | Optimize SVG output with SVGO |
| [`sqip-plugin-data-uri`](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-data-uri#readme) | Convert SVG to Data URI |
| [`sqip-plugin-pixels`](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-pixels#readme) | Create a pixelated placeholder |
| [`sqip-plugin-potrace`](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-potrace#readme) | Trace images into vector paths |
| [`sqip-plugin-triangle`](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-triangle#readme) | Generate triangulated SVG art |
| [`sqip-plugin-blurhash`](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-blurhash#readme) | Generate BlurHash previews |

## CLI

For command-line usage, install [`sqip-cli`](https://github.com/axe312ger/sqip/tree/master/packages/sqip-cli#readme):

```bash
npm install -g sqip-cli
```

## Bundler Integrations

SQIP integrates with Webpack, Vite, and frameworks built on them. See the [main README](https://github.com/axe312ger/sqip#bundler-integrations) for details on `sqip-loader` and `vite-plugin-sqip`.

## Part of SQIP

See the [main project README](https://github.com/axe312ger/sqip) for the full documentation, examples, and background research.
