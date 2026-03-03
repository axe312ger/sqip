# `sqip-cli`

> CLI for SQIP — SVG-Based Image Placeholder

Command-line tool for [SQIP](https://github.com/axe312ger/sqip). Process images into SVG-based placeholders directly from your terminal.

## Installation

```bash
npm install -g sqip-cli
```

This installs the `sqip` command globally. The default plugin chain (`primitive → blur → svgo → data-uri`) is included with `sqip`, so no extra install is needed for the standard pipeline. If you want to use non-default plugins (e.g. `sqip-plugin-pixels`, `sqip-plugin-potrace`, `sqip-plugin-triangle`, `sqip-plugin-blurhash`), install them globally as well:

```bash
npm install -g sqip-plugin-pixels
```

## Usage

### Basic Usage

Process a single image with default settings (primitive → blur → svgo → data-uri):

```bash
sqip -i path/to/image.jpg
```

### Show Help

Specify plugins with `--help` to see all available options for those plugins:

```bash
sqip -h -p primitive -p blur -p svgo
```

### Process a Single File

```bash
sqip -i photo.jpg
```

Output:

```
Processing: photo.jpg
┌───────────────┬────────────────┬───────┬────────┬──────┐
│ originalWidth │ originalHeight │ width │ height │ type │
├───────────────┼────────────────┼───────┼────────┼──────┤
│ 1024          │ 640            │ 300   │ 188    │ svg  │
└───────────────┴────────────────┴───────┴────────┴──────┘
```

### Process Multiple Files with Custom Config

```bash
sqip -p primitive -p blur -p svgo \
  -i "images/*.jpg" \
  -n 25 -b 6
```

### Save Output to File

```bash
sqip -i input.jpg -o output.svg
```

### Print SVG to stdout

```bash
sqip -i input.jpg --print
```

## Options

| Option              | Short | Description                                                     |
| ------------------- | ----- | --------------------------------------------------------------- |
| `--help`            | `-h`  | Show help (include `-p` flags to see plugin-specific options)   |
| `--version`         |       | Show version number                                             |
| `--input`           | `-i`  | Input file, directory, or glob pattern                          |
| `--output`          | `-o`  | Output file or directory                                        |
| `--plugins`         | `-p`  | One or more plugins (can be repeated: `-p primitive -p blur`)   |
| `--width`           | `-w`  | Width of the resulting image (0 or negative = original)         |
| `--silent`          |       | Suppress all output                                             |
| `--parseable-output`|       | Machine-readable output (no preview images, no table borders)   |
| `--print`           |       | Print resulting SVG to stdout                                   |

### Plugin-Specific Options

Plugin options follow the pattern `--[plugin-name]-[option]=[value]`:

```bash
# Set primitive shapes to 25 and blur to 6
sqip -i photo.jpg -p primitive -p blur -p svgo \
  --primitive-numberOfPrimitives 25 \
  --blur-blur 6
```

Common shortcuts:

| Shortcut | Expands to                          |
| -------- | ----------------------------------- |
| `-n`     | `--primitive-numberOfPrimitives`    |
| `-m`     | `--primitive-mode`                  |
| `-b`     | `--blur-blur`                       |

## Debugging

Set the `DEBUG` environment variable to see detailed output:

```bash
DEBUG=sqip* sqip -i photo.jpg
```

## Part of SQIP

This is the CLI for [SQIP](https://github.com/axe312ger/sqip). See the main README for the full plugin reference, Node.js API documentation, and bundler integrations.
