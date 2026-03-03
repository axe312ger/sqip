# `sqip-plugin-svgo`

> SQIP plugin to optimize SVG output with SVGO

Optimizes SVG output using [SVGO](https://github.com/svg/svgo) for minimal file size. This plugin is typically used after a shape-generating plugin to compress the SVG before embedding or saving.

## Installation

```bash
npm install sqip sqip-plugin-svgo
```

## Options

| Option           | Type    | Default            | Description                                                          |
| ---------------- | ------- | ------------------ | -------------------------------------------------------------------- |
| `multipass`      | Boolean | `true`             | Run multiple optimization passes for better compression              |
| `floatPrecision` | Number  | `1`                | Decimal precision for floating-point values (lower = smaller SVG)    |
| `plugins`        | Array   | *(built-in preset)* | Array of SVGO plugin configurations (see [SVGO docs](https://github.com/svg/svgo#built-in-plugins)) |

The built-in plugin preset is tuned for maximum compression of SQIP-generated SVGs. You can override it by passing your own `plugins` array.

## Usage

### Node API

```js
import { sqip } from 'sqip'

// Default SVGO settings
const result = await sqip({
  input: 'photo.jpg',
  plugins: [
    'sqip-plugin-primitive',
    'sqip-plugin-blur',
    'sqip-plugin-svgo',
  ],
})

// Custom SVGO settings
const custom = await sqip({
  input: 'photo.jpg',
  plugins: [
    'sqip-plugin-primitive',
    {
      name: 'sqip-plugin-svgo',
      options: {
        multipass: true,
        floatPrecision: 2,
      },
    },
  ],
})
```

### CLI

```bash
sqip -i photo.jpg -p primitive -p blur -p svgo
```

## Part of SQIP

This plugin is part of the [SQIP](https://github.com/axe312ger/sqip) project. See the main README for the full list of plugins and integrations.
