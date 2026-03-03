# `sqip-plugin-data-uri`

> SQIP plugin to convert SVG output into embeddable Data URI strings

Converts the SVG output into Data URI strings that can be embedded directly in HTML or CSS. This is typically the last plugin in the pipeline.

The plugin produces two variants:

- **`dataURI`** — Uses [mini-svg-data-uri](https://github.com/tigt/mini-svg-data-uri) to produce a URL-safe minified SVG data URI. This encoding is typically **smaller** than Base64 because it avoids the ~33% overhead of Base64 encoding while using optimized URL-safe character escaping.
- **`dataURIBase64`** — Uses standard Node.js Base64 encoding for broader compatibility.

## Installation

```bash
npm install sqip sqip-plugin-data-uri
```

## Options

This plugin has no configuration options.

## Output

The plugin adds two fields to `result.metadata`:

| Field           | Format                           | Description                                    |
| --------------- | -------------------------------- | ---------------------------------------------- |
| `dataURI`       | `data:image/svg+xml,...`         | Minified SVG data URI (smaller, URL-encoded)   |
| `dataURIBase64` | `data:image/svg+xml;base64,...`  | Base64-encoded SVG data URI                    |

### Using in HTML

```html
<!-- As an img src -->
<img src="data:image/svg+xml,..." alt="placeholder" />

<!-- As a CSS background -->
<div style="background-image: url('data:image/svg+xml,...')"></div>
```

## Usage

### Node API

```js
import { sqip } from 'sqip'

const result = await sqip({
  input: 'photo.jpg',
  plugins: [
    'sqip-plugin-primitive',
    'sqip-plugin-blur',
    'sqip-plugin-svgo',
    'sqip-plugin-data-uri',
  ],
})

// Use the data URIs
console.log(result.metadata.dataURI)       // data:image/svg+xml,...
console.log(result.metadata.dataURIBase64) // data:image/svg+xml;base64,...
```

### CLI

```bash
sqip -i photo.jpg -p primitive -p blur -p svgo -p data-uri
```

## Part of SQIP

This plugin is part of the [SQIP](https://github.com/axe312ger/sqip) project. See the main README for the full list of plugins and integrations.
