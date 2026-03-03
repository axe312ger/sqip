export type Category = 'placeholder' | 'artistic' | 'blur-test'

export interface VariantConfig {
  name: string
  title: string
  category: Category
  description: string
  pluginChain: string[]
  resultFileType: 'jpg' | 'webp' | 'svg'
  /** Code snippet showing how to reproduce this variant */
  configSnippet: string
  /** Non-trivial native dependencies (e.g. 'sharp', 'Go') */
  dependencies: string[]
  sqipConfig?: {
    plugins: (string | { name: string; options: Record<string, unknown> })[]
  }
  /** If set, this variant uses lqip-modern instead of sqip */
  lqipModern?: {
    outputFormat?: 'webp' | 'jpeg'
    resize?: number
  }
  /** If set, this variant is a sharp thumbnail */
  thumbnail?: boolean
}

export const categories: Record<Category, { label: string; description: string }> = {
  placeholder: {
    label: 'Placeholders',
    description: 'Fast, small placeholders for lazy-loading images',
  },
  artistic: {
    label: 'Artistic',
    description: 'Slow, detailed variants for decorative or artistic use',
  },
  'blur-test': {
    label: 'Blur Test',
    description: 'Compare different blur techniques side by side',
  },
}

export const variants: VariantConfig[] = [
  // === Placeholders ===
  {
    name: 'thumbnail',
    title: 'Thumbnail (300px)',
    category: 'placeholder',
    description: 'A 300px wide JPEG thumbnail via sharp — the baseline for size comparison.',
    pluginChain: ['sharp resize'],
    resultFileType: 'jpg',
    configSnippet: `import sharp from 'sharp'\nawait sharp('image.jpg').resize(300).jpeg().toBuffer()`,
    dependencies: ['sharp'],
    thumbnail: true,
  },
  {
    name: 'lqip-modern-webp',
    title: 'LQIP Modern (WebP)',
    category: 'placeholder',
    description: "Medium's approach: 16px resize + WebP quality 20 via lqip-modern.",
    pluginChain: ['lqip-modern'],
    resultFileType: 'webp',
    configSnippet: `import lqip from 'lqip-modern'\nconst { content } = await lqip('image.jpg')`,
    dependencies: ['sharp'],
    lqipModern: { outputFormat: 'webp' },
  },
  {
    name: 'lqip-modern-webp-hd',
    title: 'LQIP Modern (WebP HD)',
    category: 'placeholder',
    description: 'Double resolution (32px) WebP via lqip-modern — more detail at a small size cost.',
    pluginChain: ['lqip-modern(32px)'],
    resultFileType: 'webp',
    configSnippet: `import lqip from 'lqip-modern'\nconst { content } = await lqip('image.jpg', { resize: 32 })`,
    dependencies: ['sharp'],
    lqipModern: { outputFormat: 'webp', resize: 32 },
  },
  {
    name: 'lqip-modern-jpeg',
    title: 'LQIP Modern (JPEG)',
    category: 'placeholder',
    description: 'Same as LQIP Modern but with JPEG output via lqip-modern.',
    pluginChain: ['lqip-modern'],
    resultFileType: 'jpg',
    configSnippet: `import lqip from 'lqip-modern'\nconst { content } = await lqip('image.jpg', { outputFormat: 'jpeg' })`,
    dependencies: ['sharp'],
    lqipModern: { outputFormat: 'jpeg' },
  },
  {
    name: 'sqip-default',
    title: 'SQIP Default',
    category: 'placeholder',
    description: 'Default settings: 8 geometric primitives + SVGO optimization.',
    pluginChain: ['primitive', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: ['primitive', 'svgo', 'data-uri'],\n})`,
    dependencies: ['Go', 'sharp'],
    sqipConfig: {
      plugins: ['primitive', 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-pixels',
    title: 'SQIP Pixels',
    category: 'placeholder',
    description: 'Pixel art placeholder via sqip-plugin-pixels.',
    pluginChain: ['pixels', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: ['pixels', 'svgo', 'data-uri'],\n})`,
    dependencies: ['sharp'],
    sqipConfig: {
      plugins: ['pixels', 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-potrace',
    title: 'SQIP Potrace',
    category: 'placeholder',
    description: 'Vector tracing via sqip-plugin-potrace.',
    pluginChain: ['potrace', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: ['potrace', 'svgo', 'data-uri'],\n})`,
    dependencies: ['sharp'],
    sqipConfig: {
      plugins: ['potrace', 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-triangle',
    title: 'SQIP Triangle',
    category: 'placeholder',
    description: 'Delaunay triangulation via sqip-plugin-triangle.',
    pluginChain: ['triangle', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: ['triangle', 'svgo', 'data-uri'],\n})`,
    dependencies: ['Go', 'sharp'],
    sqipConfig: {
      plugins: ['triangle', 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-blurhash',
    title: 'SQIP Blurhash',
    category: 'placeholder',
    description: 'BlurHash encoding — ultra-compact placeholder.',
    pluginChain: ['blurhash'],
    resultFileType: 'jpg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: ['blurhash'],\n})`,
    dependencies: ['sharp'],
    sqipConfig: {
      plugins: ['blurhash'],
    },
  },
  {
    name: 'sqip-blurhash-hd',
    title: 'SQIP Blurhash HD',
    category: 'placeholder',
    description: 'BlurHash with increased resolution (width: 10) for more detail.',
    pluginChain: ['blurhash(width:10)'],
    resultFileType: 'jpg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: [\n    { name: 'blurhash', options: { width: 10 } },\n  ],\n})`,
    dependencies: ['sharp'],
    sqipConfig: {
      plugins: [{ name: 'blurhash', options: { width: 10 } }],
    },
  },

  // === Artistic ===
  {
    name: 'sqip-potrace-posterize',
    title: 'Potrace Posterize',
    category: 'artistic',
    description: 'Multi-color posterized vector tracing — richer detail than single-color potrace.',
    pluginChain: ['potrace(posterize)', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: [\n    { name: 'potrace', options: { posterize: true } },\n    'svgo', 'data-uri',\n  ],\n})`,
    dependencies: ['sharp'],
    sqipConfig: {
      plugins: [{ name: 'potrace', options: { posterize: true } }, 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-primitive-art',
    title: 'Primitive Art',
    category: 'artistic',
    description: '50 triangles — high-detail geometric art.',
    pluginChain: ['primitive(50, triangles)', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: [\n    { name: 'primitive', options: { numberOfPrimitives: 50, mode: 1 } },\n    'svgo', 'data-uri',\n  ],\n})`,
    dependencies: ['Go', 'sharp'],
    sqipConfig: {
      plugins: [
        { name: 'primitive', options: { numberOfPrimitives: 50, mode: 1 } },
        'svgo',
        'data-uri',
      ],
    },
  },
  {
    name: 'sqip-primitive-circles',
    title: 'Primitive Circles',
    category: 'placeholder',
    description: '30 circles — organic, bokeh-like placeholder.',
    pluginChain: ['primitive(30, circles)', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: [\n    { name: 'primitive', options: { numberOfPrimitives: 30, mode: 4 } },\n    'svgo', 'data-uri',\n  ],\n})`,
    dependencies: ['Go', 'sharp'],
    sqipConfig: {
      plugins: [
        { name: 'primitive', options: { numberOfPrimitives: 30, mode: 4 } },
        'svgo',
        'data-uri',
      ],
    },
  },
  {
    name: 'sqip-triangle-art',
    title: 'Triangle Art',
    category: 'artistic',
    description: 'High-detail low-poly art with 420 points.',
    pluginChain: ['triangle(pts:420)', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: [\n    { name: 'triangle', options: { pts: 420 } },\n    'svgo', 'data-uri',\n  ],\n})`,
    dependencies: ['Go', 'sharp'],
    sqipConfig: {
      plugins: [{ name: 'triangle', options: { pts: 420 } }, 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-pixels-mosaic',
    title: 'Pixel Mosaic',
    category: 'artistic',
    description: 'Large 16px pixel mosaic — bold, chunky pixel art.',
    pluginChain: ['pixels(16)', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: [\n    { name: 'pixels', options: { pixels: 16 } },\n    'svgo', 'data-uri',\n  ],\n})`,
    dependencies: ['sharp'],
    sqipConfig: {
      plugins: [{ name: 'pixels', options: { pixels: 16 } }, 'svgo', 'data-uri'],
    },
  },

  // === Blur Test ===
  {
    name: 'blur-none',
    title: 'No Blur',
    category: 'blur-test',
    description: 'Baseline: 8 geometric primitives without any blur applied.',
    pluginChain: ['primitive', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: ['primitive', 'svgo', 'data-uri'],\n})`,
    dependencies: ['Go', 'sharp'],
    sqipConfig: {
      plugins: ['primitive', 'svgo', 'data-uri'],
    },
  },
  {
    name: 'blur-legacy',
    title: 'Legacy SVG Blur',
    category: 'blur-test',
    description: 'Classic SVG feGaussianBlur filter — works everywhere but increases SVG size.',
    pluginChain: ['primitive', 'blur(legacy)', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: [\n    'primitive',\n    { name: 'blur', options: { legacyBlur: true } },\n    'svgo', 'data-uri',\n  ],\n})`,
    dependencies: ['Go', 'sharp'],
    sqipConfig: {
      plugins: [
        'primitive',
        { name: 'blur', options: { legacyBlur: true } },
        'svgo',
        'data-uri',
      ],
    },
  },
  {
    name: 'blur-css',
    title: 'CSS Blur (Plugin)',
    category: 'blur-test',
    description: 'CSS filter blur applied inside the SVG by the blur plugin — compact and modern.',
    pluginChain: ['primitive', 'blur', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `import { sqip } from 'sqip'\nconst result = await sqip({\n  input: 'image.jpg',\n  plugins: [\n    'primitive', 'blur', 'svgo', 'data-uri',\n  ],\n})`,
    dependencies: ['Go', 'sharp'],
    sqipConfig: {
      plugins: ['primitive', 'blur', 'svgo', 'data-uri'],
    },
  },
  {
    name: 'blur-browser',
    title: 'CSS Blur (Browser)',
    category: 'blur-test',
    description: 'No blur in the SVG — CSS filter:blur() applied on the <img> element at display time.',
    pluginChain: ['primitive', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    configSnippet: `<!-- No blur plugin needed -->\n<img\n  src="placeholder.svg"\n  style="filter: blur(12px);"\n/>`,
    dependencies: ['Go', 'sharp'],
    sqipConfig: {
      plugins: ['primitive', 'svgo', 'data-uri'],
    },
  },
]
