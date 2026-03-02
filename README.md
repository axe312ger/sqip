# SQIP - a pluggable image converter with vector support

[![npm](https://img.shields.io/npm/v/sqip.svg)](https://www.npmjs.com/package/sqip)
[![npm](https://img.shields.io/npm/dm/sqip.svg)](https://www.npmjs.com/package/sqip)

[![CircleCI](https://circleci.com/gh/axe312ger/sqip.svg?style=svg)](https://circleci.com/gh/axe312ger/sqip)
[![codecov](https://codecov.io/gh/axe312ger/sqip/branch/master/graph/badge.svg)](https://codecov.io/gh/axe312ger/sqip)
[![Maintainability](https://api.codeclimate.com/v1/badges/fc81fa5e535561c0a6ff/maintainability)](https://codeclimate.com/github/axe312ger/sqip/maintainability)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

**SQIP** is a flexible, and a little bit different image processor. It is available as node API and CLI.

By combining plugins you can use it for several purposes:

- Create super-tiny image previews to improve your websites lazy loading experience
- Do art by converting images into abstract representations of themselves
- Quickly convert, resize or optimize a set of pixel or vector images
- More? Ideas, contributions and community plugins are very welcome

## Table of contents

- [Examples](#examples)
- [Requirements](#requirements)
- [Node](#node)
- [CLI](#cli)
- [Config](#config)
- [Plugins](#plugins)
- [Bundler Integrations](#bundler-integrations)
- [Background & research](#background--research-about-image-placeholder--previews)
- [Credits](#credits)
- [Contributing](#contributing)
- [License](#license)

## Examples

Check out the [interactive demo](https://sqip.vercel.app/) to compare all plugins and configurations side by side.

[![](demo/example.jpg)](https://sqip.vercel.app/)

## Requirements

- Node.js >= 20 (https://nodejs.org/en/)
- 64-bit OS (Not all plugins, see below)

<details>
<summary>
<strong>Non-64bit operating systems requirements</strong>
</summary>

The most common plugin `sqip-plugin-primitive` is packed with a 64bit executable for all 3 major operating systems. Users with non 32-bit operating system or those who simply want to use the latest and greatest verison of primitive need:

- Golang (https://golang.org/doc/install)
- Primitive (https://github.com/hashbite/primitive) (`go get -u github.com/hashbite/primitive`)

After installing Primitive, you may also need to add the path to the `Primitive` binary file.

#### For macOS

It would generally look something like

```bash
/Users/myMacbook/go/bin
```

To do this on a Mac, type: `sudo vim /etc/paths` into your terminal, and add the path to your `Primitive` binary file, but be sure to add the full path, `/Users/<username>/go/bin` and not `~/go/bin`.

#### For PC

Using the command line (https://www.windows-commandline.com/set-path-command-line)
Using a GUI (https://www.computerhope.com/issues/ch000549.htm)

</details>

## Node

[CLI see here](#cli)

### Installation

You need the core plugin `sqip` plus all the plugins you want to use like `sqip-plugin-primtive`, `sqip-plugin-svgo` and more.

For example:

```bash
npm install sqip sqip-plugin-primitive sqip-plugin-svgo sqip-plugin-data-uri
```

**Hint:** SQIP is plugin based, you might want to install more plugins later on. See [Plugins](#plugins-1) section.

> Migrating from v0? See the [Migration Guide](./MIGRATION.md).

### Usage

SQIP is async.

```js
try {
  const result = await sqip({ ...options })
  console.log(result)
} catch (err) {
  console.error(err)
}

// or

sqip({ ...options })
  .then((result) => console.log(result))
  .catch((error) => console.error(error))
```

If you passed a single image to process, SQIP will return the following result object:

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
    // These will be added by sqip-plugin-data-uri
    dataURI: "data:image/svg+xml,...",
    dataURIBase64: 'data:image/svg+xml;base64,...'
  }
}
```

Documentation for all 6 colors from the palette: [Vibrant.Swatch](https://github.com/akfish/node-vibrant#vibrantswatch)

Plugins might add their own meta data

Multiple input images will result in an array of result objects.

#### Process folder with default settings

```js
import { sqip } from 'sqip'
import { resolve } from 'path'
;(async () => {
  try {
    // Process whole folder with default settings
    const folderResults = await sqip({
      input: resolve(__dirname, 'images/originals'),
      output: resolve(__dirname, 'images/previews')
    })
    console.log(folderResults)
  } catch (err) {
    console.log('Something went wrong generating the SQIP previews')
    console.error(err)
  }
})()
```

#### Use custom plugin config

This will run:

- Primitive with custom settings
- SVGO with default settings

```js
;(async () => {
  const pluginResults = await sqip({
    input: resolve(__dirname, 'images/originals'),
    output: resolve(__dirname, 'images/previews'),
    plugins: [
      {
        name: 'sqip-plugin-primitive',
        options: {
          numberOfPrimitives: 8,
          mode: 0
        }
      },
      'sqip-plugin-svgo'
    ]
  })
  console.log(pluginResults)
})()
```

[For further configuration options see here](#config)

## CLI

### Installation

```sh
npm install -g sqip-cli
```

### Usage examples

#### Using the help efficently

Make sure to specify plugins when using `--help` to see the available plugin options.

```sh
sqip -h -p primitive -p blur -p svgo
```

<details>
<summary>Result:</summary>

```sh
sqip CLI

  Usage: sqip --input [path]

  "SQIP" (pronounced skwɪb like the non-magical folk of magical descent) is a
  SVG-based LQIP technique - https://github.com/technopagan/sqip

Options

  -h, --help string                           Show help
  --version string                            Show version number
  -p, --plugins string[]                      One or more plugins. E.g. "-p
                                              primitive blur"
  -i, --input string
  -o, --output string                         Define the path of the resulting
                                              file. By default SQIP will guess
                                              the output file name.
  -w, --width number                          Width of the resulting file.
                                              Negative values and 0 will fall
                                              back to original image width.
  --silent                                    Supress all output
  --parseable-output                          Ensure the output is parseable.
                                              Will suppress the preview images
                                              and the table borders.
  --print                                     Print resulting svg to stdout.
  -n, --primitive-numberOfPrimitives number   The number of primitive shapes to
                                              use to build the SQIP SVG
  -m, --primitive-mode number                 The style of primitives to use:
                                              0=combo, 1=triangle, 2=rect,
                                              3=ellipse, 4=circle,
                                              5=rotatedrect, 6=beziers,
                                              7=rotatedellipse, 8=polygon
  -b, --blur-blur number                      Set the blur value. If you pass a
                                              number, it will be converted to
                                              px for css blur. It will also set
                                              the stdDeviation for the legacy
                                              SVG blur.

Examples

  Output input.jpg image as SQIP
  $ sqip --input /path/to/input.jpg

  Save input.jpg as result.svg with 25 shapes and no blur
  $ sqip -i input.jpg -n 25 -b 0 -o result.svg
```

</details>

#### Process single file

```sh
$ sqip -i __tests__/fixtures/beach.jpg
Processing: __tests__/fixtures/beach.jpg
[Preview image (iTerm2 users only)]
┌───────────────┬────────────────┬───────┬────────┬──────┐
│ originalWidth │ originalHeight │ width │ height │ type │
├───────────────┼────────────────┼───────┼────────┼──────┤
│ 1024          │ 640            │ 300   │ 188    │ svg  │
└───────────────┴────────────────┴───────┴────────┴──────┘
┌─────────┬─────────────┬──────────────┬─────────┬───────────┬────────────┐
│ Vibrant │ DarkVibrant │ LightVibrant │ Muted   │ DarkMuted │ LightMuted │
├─────────┼─────────────┼──────────────┼─────────┼───────────┼────────────┤
│ #dd852f │ #be4e0c     │ #f2b17a      │ #5c8fa4 │ #694e35   │ #cfc8b7    │
└─────────┴─────────────┴──────────────┴─────────┴───────────┴────────────┘
```

##### Process multiple files via glob and use custom plugin config

```sh
sqip -p primitive -p blur -p svgo \
-i "demo/*.jpg" \
-b 6
```

[For further configuration options see here](#config)

## Config

The configuration consists of three parts. A required input, an optional output path and a configuration of plugins to be applied on the images.

### `input` - required

Input file or directory. Supports feature rich globbing via [micromatch](https://github.com/micromatch/micromatch#why-use-micromatch).

**CLI usage:** `-i/--input`

### `output`

If set, the output will be written to the given file or directory.

Otherwise, results will be output to CLI

**CLI usage:** `-o/--output`

### `width`

Set the width of the resulting image. Negative values and 0 will fall back to the original image width.

**CLI usage:** `-w/--width`

### `plugins`

**Default:** `['primitive', 'blur', 'svgo', 'data-uri']`

Array of plugins. Either as a string (default config will be applied) or as a config object.

**Example:**

```js
await sqip({
  ...
  plugins: [
    {
      name: 'sqip-plugin-primitive',
      options: {
        numberOfPrimitives: 8,
        mode: 0,
      },
    },
    `sqip-plugin-svgo`,
  ],
})
```

**CLI usage:**

`-p/--plugins`

- Can be specified multiple times: `-p svgo -p blur`
- If prefix was skipped, plugin names will be transformed to: `sqip-plugin-[name]`
- To set plugin options, see [plugin-specific config](#plugin-specific-config)

### Plugin-specific config

- See the [Plugins](#plugins) section for a list of available plugins.
- List all plugins subcommands by adding the plugin plus using the help parameter. For example: `-p blur -p svgo -h` will list you all options of the blur and the svgo plugins.
- Follows the pattern `--[plugin-name]-[option]=[value]`

**Example:**

Set `blur` option of `blur` plugin to 3. You could use the `-b` shortcut as well.

```sh
sqip -i foo.jpg -p primitive -p blur -blur-blur 3
```

### `--parseable-output`

non-TTY consoles and when the `--parseable-output` input flag is set, the output will be the following:

```sh
$ sqip -i __tests__/fixtures/beach.jpg --parseable-output
Processing: __tests__/fixtures/beach.jpg
originalWidth originalHeight width height type
1024          640            300   188    svg
Vibrant DarkVibrant LightVibrant Muted   DarkMuted LightMuted
#dd852f #be4e0c     #f2b17a      #5c8fa4 #694e35   #cfc8b7
```

### `--silent`

No output at all on STDOUT. The process will still return an error code & message when something failed.

### `--print`

Outputs resulting SVG to STDOUT. Ignores `--silent` and works with `--parseable-output`.

## Plugins

SQIP comes with some core plugins, the community is very welcome to [contribute their own plugins](#contributing) to SQIP. The effort to implement a tool or script doing something with images into SQIP is very minimal.

### Core plugins

Here is a list of all current core plugins:

- [sqip-plugin-primitive](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-primitive#readme) — Generate SVG shapes using [Primitive](https://github.com/hashbite/primitive)
- [sqip-plugin-blur](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-blur#readme) — Add CSS or SVG blur to the image
- [sqip-plugin-svgo](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-svgo#readme) — Optimize SVG output with SVGO
- [sqip-plugin-data-uri](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-data-uri#readme) — Convert SVG to Data URI
- [sqip-plugin-pixels](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-pixels#readme) — Create a pixelated placeholder
- [sqip-plugin-potrace](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-potrace#readme) — Trace images into vector paths
- [sqip-plugin-triangle](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-triangle#readme) — Generate triangulated SVG art
- [sqip-plugin-blurhash](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-blurhash#readme) — Generate BlurHash previews

### Plugin Configuration Reference

<details>
<summary><strong>sqip-plugin-primitive</strong> — Generate SVG shapes</summary>

| Option                    | Type    | Default   | CLI Flag | Description                                                                                                          |
| ------------------------- | ------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `numberOfPrimitives`      | Number  | `8`       | `-n`     | The number of primitive shapes to use                                                                                |
| `mode`                    | Number  | `0`       | `-m`     | Shape style: 0=combo, 1=triangle, 2=rect, 3=ellipse, 4=circle, 5=rotatedrect, 6=beziers, 7=rotatedellipse, 8=polygon |
| `rep`                     | Number  | `0`       |          | Extra shapes each iteration with reduced search                                                                      |
| `alpha`                   | Number  | `128`     |          | Color alpha (0 = algorithm chooses)                                                                                  |
| `background`              | String  | `'Muted'` |          | Background color: palette color name or hex value                                                                    |
| `cores`                   | Number  | `0`       |          | Parallel workers (0 = all cores)                                                                                     |
| `removeBackgroundElement` | Boolean | `false`   |          | Remove the background element created by primitive                                                                   |

</details>

<details>
<summary><strong>sqip-plugin-blur</strong> — Add blur effect</summary>

| Option            | Type    | Default   | CLI Flag | Description                                                     |
| ----------------- | ------- | --------- | -------- | --------------------------------------------------------------- |
| `blur`            | Number  | `12`      | `-b`     | Blur value in px for CSS blur / stdDeviation for SVG blur       |
| `legacyBlur`      | Boolean | `false`   |          | Use SVG `feGaussianBlur` filter instead of CSS `filter: blur()` |
| `backgroundColor` | String  | `'Muted'` |          | Background rectangle color to prevent transparent blur edges    |

</details>

<details>
<summary><strong>sqip-plugin-svgo</strong> — Optimize SVG output</summary>

Passes all options through to [SVGO](https://github.com/svg/svgo). See SVGO documentation for available options.

</details>

<details>
<summary><strong>sqip-plugin-data-uri</strong> — Convert to Data URI</summary>

No configuration options. Converts the SVG output to a Data URI string, available as `result.metadata.dataURI` and `result.metadata.dataURIBase64`.

</details>

<details>
<summary><strong>sqip-plugin-pixels</strong> — Pixelated placeholder</summary>

| Option            | Type   | Default    | Description                                                    |
| ----------------- | ------ | ---------- | -------------------------------------------------------------- |
| `pixels`          | Number | `8`        | Number of pixels on the longer axis                            |
| `backgroundColor` | String | `'DETECT'` | Transparent pixel color (hex with alpha or palette color name) |

</details>

<details>
<summary><strong>sqip-plugin-potrace</strong> — Vector tracing</summary>

| Option         | Type    | Default                 | Description                                  |
| -------------- | ------- | ----------------------- | -------------------------------------------- |
| `posterize`    | Boolean | `false`                 | Use posterize instead of trace               |
| `steps`        | Number  | `4`                     | Posterize: number of threshold steps         |
| `color`        | String  | auto                    | Fill color                                   |
| `background`   | String  | auto                    | Background color                             |
| `turnPolicy`   | String  | `'TURNPOLICY_MINORITY'` | Path decomposition ambiguity resolution      |
| `turdSize`     | Number  | `2`                     | Suppress speckles up to this size            |
| `alphaMax`     | Number  | `1`                     | Corner threshold parameter                   |
| `optCurve`     | Boolean | `true`                  | Enable curve optimization                    |
| `optTolerance` | Number  | `0.2`                   | Curve optimization tolerance                 |
| `threshold`    | Number  | auto                    | Black/white threshold (0-255)                |
| `blackOnWhite` | Boolean | `true`                  | Which side of threshold becomes vector shape |

</details>

<details>
<summary><strong>sqip-plugin-triangle</strong> — Triangulated SVG art</summary>

| Option | Type    | Default   | Description                                  |
| ------ | ------- | --------- | -------------------------------------------- |
| `bl`   | Number  | `2`       | Blur radius                                  |
| `nf`   | Number  | `0`       | Noise factor                                 |
| `bf`   | Number  | `1`       | Blur factor                                  |
| `ef`   | Number  | `6`       | Edge factor                                  |
| `pr`   | Number  | `0.075`   | Point rate                                   |
| `pth`  | Number  | `10`      | Points threshold                             |
| `pts`  | Number  | `6`       | Maximum number of points                     |
| `so`   | Number  | `10`      | Sobel filter threshold                       |
| `sl`   | Boolean | `false`   | Use solid stroke color                       |
| `wf`   | Number  | `0`       | Wireframe mode                               |
| `st`   | Number  | `1`       | Stroke width                                 |
| `gr`   | Boolean | `false`   | Grayscale mode                               |
| `bg`   | String  | `'Muted'` | Background color (hex or palette color name) |

</details>

<details>
<summary><strong>sqip-plugin-blurhash</strong> — BlurHash previews</summary>

| Option         | Type   | Default | Description                                           |
| -------------- | ------ | ------- | ----------------------------------------------------- |
| `width`        | Number | `4`     | Horizontal blur components (max 9)                    |
| `height`       | Number | `-1`    | Vertical blur components (max 9, -1 = auto)           |
| `resizeWidth`  | Number | `64`    | Resize image width for faster processing              |
| `resizeHeight` | Number | `-1`    | Resize image height for faster processing (-1 = auto) |

</details>

## Debugging

If something is not going as expected, adding debug output might help a lot. You can achieve this by setting the `DEBUG` environment variable to `sqip*`.

On a \*NIX environment, you might do the following:

```sh
DEBUG=sqip* node myscript.js

# or for CLI:

DEBUG=sqip* sqip --input...
```

## Bundler Integrations

SQIP integrates with most common JavaScript frameworks and bundlers via two official packages. Together they cover **Webpack, Turbopack, Vite, Rollup** and any framework built on top of them — including **Next.js, Nuxt, SvelteKit, Astro, Remix**, and more.

| Package | Bundlers | Frameworks |
|---|---|---|
| [`sqip-loader`](./integrations/sqip-loader) | Webpack 5, Turbopack | Next.js, Nuxt (Webpack mode), any Webpack-based setup |
| [`vite-plugin-sqip`](./integrations/vite-plugin-sqip) | Vite, Rollup | Astro, SvelteKit, Nuxt (Vite mode), Remix (Vite mode), any Vite-based setup |

### sqip-loader

Webpack/Turbopack loader. Receives raw image buffers and emits JS modules with SQIP metadata.

```bash
npm install sqip-loader sqip sqip-plugin-primitive sqip-plugin-blur sqip-plugin-svgo sqip-plugin-data-uri
```

**webpack.config.js:**

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(jpe?g|png|gif|webp)$/i,
        use: [
          {
            loader: 'sqip-loader',
            options: {
              plugins: [
                { name: 'primitive', options: { numberOfPrimitives: 8, mode: 0 } },
                'blur',
                'svgo',
                'data-uri'
              ],
              width: 300
            }
          }
        ]
      }
    ]
  }
}
```

```js
import placeholder from './photo.jpg'

// placeholder.metadata.dataURI → "data:image/svg+xml,..."
// placeholder.svg → "<svg ...>...</svg>"
```

For a full **Next.js** reference implementation using `sqip-loader` in `next.config.mjs`, see [`integrations/__tests__/fixtures/nextjs-app/`](./integrations/__tests__/fixtures/nextjs-app/).

For a standalone **Webpack** reference, see [`integrations/__tests__/fixtures/webpack-app/`](./integrations/__tests__/fixtures/webpack-app/).

### vite-plugin-sqip

Vite/Rollup plugin. Uses the `?sqip` query parameter to opt-in per import, so it doesn't interfere with Vite's built-in asset handling.

```bash
npm install vite-plugin-sqip sqip sqip-plugin-primitive sqip-plugin-blur sqip-plugin-svgo sqip-plugin-data-uri
```

**vite.config.js:**

```js
import sqipPlugin from 'vite-plugin-sqip'

export default {
  plugins: [
    sqipPlugin({
      plugins: [
        { name: 'primitive', options: { numberOfPrimitives: 8, mode: 0 } },
        'blur',
        'svgo',
        'data-uri'
      ],
      width: 300
    })
  ]
}
```

```js
// The ?sqip query triggers the plugin — regular imports are unaffected
import placeholder from './photo.jpg?sqip'

// placeholder.metadata.dataURI → "data:image/svg+xml,..."
// placeholder.svg → "<svg ...>...</svg>"
```

For a full **Astro** reference implementation using `vite-plugin-sqip`, see [`integrations/__tests__/fixtures/astro-app/`](./integrations/__tests__/fixtures/astro-app/).

## Background & research about image placeholder & previews

Image placeholders are a thing: from grey boxes in skeleton screens over boxes
that show the predominant color of the image that will later occupy the space
and CSS color gradients made from two dominant colors up to an actual low quality
raster images downscaled to a few pixels, saved in low quality and then blurred
to provide a preview of image contents.

Many major players have adopted one of these image placeholder techniques:
[Guypo](https://twitter.com/guypod) [incepted
LQIP](https://www.guypo.com/introducing-lqip-low-quality-image-placeholders/) in
2012 and Akamai adopted it as part of their image optimization tools, Google
started using colored placeholders a long time ago,
[Facebook](https://code.facebook.com/posts/991252547593574/the-technology-behind-preview-photos/),
[Pinterest](https://blog.embed.ly/pinterests-colored-background-placeholders-4b4c9fb8bb77)
and
[Medium](https://jmperezperez.com/medium-image-progressive-loading-placeholder/)
made a significant impact on their LQIP implementations and the most popular
[JS libraries for responsive
images](https://github.com/aFarkas/lazysizes#lqipblurry-image-placeholderblur-up-image-technique)
include LQIP implementations.

**Overview of Image Placeholder Techniques**
[![Overview of Image Placeholders](demo/placeholder-overview.jpg)](https://raw.githubusercontent.com/technopagan/sqip/master/demo/placeholder-overview.jpg)

On the low end of the bytesize spectrum of image placeholder implementations, we
have skeleton screens and colored boxes, weighing only a few extra bytes each,
but providing no preview of image contents. On the high end of the bytesize
spectrum, the LQIP technique ships an actual raster image, which gives a good
initial impression of image contents to come, but weighs more heavily in
bytesize.

If we disregard Facebooks's native-app implementation of shipping a custom image
decoder that enables them to hardcode image headers, the current minimum
bytesize for LQIP raster images is ~400-600 bytes. At this byterange, the
preview image often looks distorted and coarse, especially on HiDPI screens.
Many other LQIP implementations go for preview images of ~2kb in size, which
provides a much better initial visual impression but comes at the cost of
significantly increased bytesize for the LQIP implementation.

SQIP is an attempt to find a balance between these two extremes: it makes use
of [Primitive](https://github.com/hashbite/primitive) to generate a SVG
consisting of several simple shapes that approximate the main features visible
inside the image, optimizes the SVG using [SVGO](https://github.com/svg/svgo)
and adds a Gaussian Blur filter to it. This produces a SVG placeholder which
weighs in at only ~800-1000 bytes, looks smooth on all screens and provides an
visual cue of image contents to come.

## Contributing

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v1.4%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

Before contribution, please make sure to read the [contribution guidelines](./CONTRIBUTING.md) guidelines and the [code of conduct](./CODE_OF_CONDUCT.md).

Pull requests, forks and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/axe312ger/sqip/issues/new).

## Credits

- trivago N.V. (https://github.com/trivago)
- Efe Gürkan Yalaman (https://github.com/efegurkan)
- Benedikt Rötsch (https://github.com/axe312ger)
- Michael Fogleman (https://github.com/fogleman)

## License

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to [<http://unlicense.org/>](http://unlicense.org/)


---

## 🛠️ Sponsored by [hashbite.net](https://hashbite.net) | support & custom development available

We welcome everyone to post issues, fork the project, and contribute via pull requests. Together we can make this a better tool for all of us!

If the contribution process feels too slow or complex for your needs, [hashbite.net](https://hashbite.net) can quickly implement features, fix bugs, or develop custom variations of this plugin on a paid basis. Just reach out through their website for direct support.
