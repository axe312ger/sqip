**This is the `v1 alpha` readme. [You can find the current docs here.](https://github.com/axe312ger/sqip/tree/legacy#readme)**

SQIP - SVG-Based Image Placeholder
====================

[![npm](https://img.shields.io/npm/v/sqip.svg)](https://www.npmjs.com/package/sqip)
[![npm](https://img.shields.io/npm/dm/sqip.svg)](https://www.npmjs.com/package/sqip)
[![CircleCI](https://circleci.com/gh/axe312ger/sqip.svg?style=svg)](https://circleci.com/gh/axe312ger/sqip)
[![codecov](https://codecov.io/gh/axe312ger/sqip/branch/master/graph/badge.svg)](https://codecov.io/gh/axe312ger/sqip)
[![Maintainability](https://api.codeclimate.com/v1/badges/fc81fa5e535561c0a6ff/maintainability)](https://codeclimate.com/github/axe312ger/sqip/maintainability)

## Overview

"SQIP" (pronounced \skwɪb\ like the non-magical folk of magical descent) is a
SVG-based [LQIP](https://www.guypo.com/introducing-lqip-low-quality-image-placeholders/) technique.

## Examples

| Original | LQIP | SQIP default | SQIP pixels plugin 8px width |
|----------|------|--------------|------------------------------|
| <img width="180" src="demo/beach.jpg"> | <img width="180" src="demo/beach-lqip.jpg"> | <img width="180" src="demo/beach-sqip.png"> | <img width="180" src="demo/beach-pixels.svg"> |
| Size: | 354B (gz: 282 B) | 895B (gz: 479B) | 1.9K (gz: 470 B)|
| <img width="180" src="./demo/monkey-selfie.jpg"> | <img width="180" src="./demo/monkey-selfie-lqip.jpg"> | <img width="180" src="./demo/monkey-selfie-sqip.png"> | <img width="180" src="./demo/monkey-selfie-pixels.svg"> |
| Size: | 435B (gz: 369 B) | 980B (gz: 513B) | 4.1K (gz: 845 B)|
| <img width="180" src="./demo/mona-lisa.jpg"> | <img width="180" src="./demo/mona-lisa-lqip.jpg"> | <img width="180" src="./demo/mona-lisa-sqip.png"> | <img width="180" src="./demo/mona-lisa-pixels.svg"> |
| Size: | 442B (gz: 372 B) | 937B (gz: 487B) | 4.5K (gz: 915 B)|

## Requirements
* Node.js >= v8 (https://nodejs.org/en/)

<details>
<summary>
<strong>Non-64bit operating systems requirements</strong>
</summary>

* Golang (https://golang.org/doc/install)
* Primitive (https://github.com/fogleman/primitive) (`go get -u github.com/fogleman/primitive`)

After installing Primitive, you may also need to add the path to the ```Primitive``` binary file.

#### For macOS
It would generally look something like
```bash
/Users/myMacbook/go/bin
```
To do this on a Mac, type: ```sudo vim /etc/paths``` into your terminal, and add the path to your ```Primitive``` binary file, but be sure to add the full path, ```/Users/<username>/go/bin``` and not ```~/go/bin```.

#### For PC
Using the command line (https://www.windows-commandline.com/set-path-command-line) <br>
Using a GUI (https://www.computerhope.com/issues/ch000549.htm)

</details>

## Node

[CLI see here](#cli)

### Installation

```bash
npm install sqip sqip-plugin-primitive sqip-plugin-svgo sqip-plugin-data-uri
```

### Examples

#### Process folder with default settings

```js
import sqip from 'sqip'
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

* Primitive with custom settings
* SVGO with default settings

```js
;(async () => {
  const pluginResults = await sqip({
    input: resolve(__dirname, 'images/originals'),
    output: resolve(__dirname, 'images/previews')
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
  console.log(pluginResults)
})()
```

[For further configuration options see here](#config)


## CLI

### Installation

```sh
npm install -g sqip-cli
```

### Examples

#### Process single file

```sh
sqip -input "demo/beach.jpg"
# <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="640" viewBox="0 0 1024 640"><filter id="a"><feGaussianBlur stdDeviation="12"/></filter><rect width="100%" height="100%" fill="#718d95"/><g filter="url(#a)">...</g></svg>
```

##### Process multiple files via glob and use custom plugin config

```sh
sqip -p primitive -p blur -p svgo \
-i "demo/*.jpg" \
-b 6
# <svg>...</svg>
# <svg>...</svg>
# <svg>...</svg>
# <svg>...</svg>
```

[For further configuration options see here](#config)

## Config

### `-i/--input`

Input file or directory. Supports globbing.

### `-o/--output`

If set, output will be written to given file or directory.

### `-s/--silent`

No output.

Default: `false` (CLI), `true` (Node API)

### plugins[]: `['primitive', 'svgo']`

One or more plugins. Either as string (default config will be applied) or as config object.


#### `-p/--plugins`:

comma seperated list of plugins, will be transformed to:

`sqip-plugin-[name]`

Default: `primitive,svgo`

### Plugin specific config

See the [Plugins](#plugins) section. Follows the pattern `--[plugin name]-[option]=[value]`

## Plugins

SQIP comes with some core plugins, the community is very welcome to [contribute their own plugins](#contribution) to SQIP.

### Core plugins

* [sqip-plugin-primitive](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-primitive#readme)
* [sqip-plugin-blur](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-blur#readme)
* [sqip-plugin-svgo](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-svgo#readme)
* [sqip-plugin-datauri](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-datauri#readme)
* [sqip-plugin-pixels](https://github.com/axe312ger/sqip/tree/master/packages/sqip-plugin-pixels#readme)

## Background & reseach

Image placeholders are a thing: from grey boxes in skeleton screens over boxes
that show the predominant color of the image that will later occupy the space
and CSS color gradients made from two dominant colors up to actual low quality
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
made a significant impact with their LQIP implementations and the most popular
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
of [Primitive](https://github.com/fogleman/primitive) to generate a SVG
consisting of several simple shapes that approximate the main features visible
inside the image, optimizes the SVG using [SVGO](https://github.com/svg/svgo)
and adds a Gaussian Blur filter to it. This produces a SVG placeholder which
weighs in at only ~800-1000 bytes, looks smooth on all screens and provides an
visual cue of image contents to come.

## Credits
* trivago N.V. (https://github.com/trivago)
* Efe Gürkan Yalaman (https://github.com/efegurkan)
* Benedikt Rötsch (https://github.com/axe312ger)
* Michael Fogleman (https://github.com/fogleman)

## Licence

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
