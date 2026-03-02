export type Category = 'baseline' | 'standard' | 'artistic'

export interface VariantConfig {
  name: string
  title: string
  category: Category
  description: string
  pluginChain: string[]
  resultFileType: 'jpg' | 'webp' | 'svg'
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
  baseline: {
    label: 'Baselines',
    description: 'Reference images and non-SQIP placeholder techniques',
  },
  standard: {
    label: 'SQIP Standard',
    description: 'Default and common SQIP plugin configurations',
  },
  artistic: {
    label: 'Artistic / Complex',
    description: 'Creative and high-detail plugin chains',
  },
}

export const variants: VariantConfig[] = [
  // === Baselines ===
  {
    name: 'thumbnail',
    title: 'Thumbnail (300px)',
    category: 'baseline',
    description: 'A 300px wide JPEG thumbnail via sharp — the baseline for size comparison.',
    pluginChain: ['sharp resize'],
    resultFileType: 'jpg',
    thumbnail: true,
  },
  {
    name: 'lqip-modern-webp',
    title: 'LQIP Modern (WebP)',
    category: 'baseline',
    description:
      'Medium\'s approach: 16px resize + WebP quality 20 via lqip-modern.',
    pluginChain: ['lqip-modern'],
    resultFileType: 'webp',
    lqipModern: { outputFormat: 'webp' },
  },
  {
    name: 'lqip-modern-webp-hd',
    title: 'LQIP Modern (WebP HD)',
    category: 'baseline',
    description:
      'Double resolution (32px) WebP via lqip-modern — more detail at a small size cost.',
    pluginChain: ['lqip-modern(32px)'],
    resultFileType: 'webp',
    lqipModern: { outputFormat: 'webp', resize: 32 },
  },
  {
    name: 'lqip-modern-jpeg',
    title: 'LQIP Modern (JPEG)',
    category: 'baseline',
    description:
      'Same as LQIP Modern but with JPEG output via lqip-modern.',
    pluginChain: ['lqip-modern'],
    resultFileType: 'jpg',
    lqipModern: { outputFormat: 'jpeg' },
  },

  // === SQIP Standard ===
  {
    name: 'sqip-default',
    title: 'SQIP Default',
    category: 'standard',
    description: 'Default settings: 8 geometric primitives + SVGO optimization.',
    pluginChain: ['primitive', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    sqipConfig: {
      plugins: ['primitive', 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-pixels',
    title: 'SQIP Pixels',
    category: 'standard',
    description: 'Pixel art placeholder via sqip-plugin-pixels.',
    pluginChain: ['pixels', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    sqipConfig: {
      plugins: ['pixels', 'svgo', 'data-uri'],
    },
  },

  {
    name: 'sqip-potrace',
    title: 'SQIP Potrace',
    category: 'standard',
    description: 'Vector tracing via sqip-plugin-potrace.',
    pluginChain: ['potrace', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    sqipConfig: {
      plugins: ['potrace', 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-potrace-posterize',
    title: 'SQIP Potrace Posterize',
    category: 'standard',
    description: 'Multi-color posterized vector tracing — richer detail than single-color potrace.',
    pluginChain: ['potrace(posterize)', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    sqipConfig: {
      plugins: [{ name: 'potrace', options: { posterize: true } }, 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-triangle',
    title: 'SQIP Triangle',
    category: 'standard',
    description: 'Delaunay triangulation via sqip-plugin-triangle.',
    pluginChain: ['triangle', 'svgo', 'data-uri'],
    resultFileType: 'svg',
    sqipConfig: {
      plugins: ['triangle', 'svgo', 'data-uri'],
    },
  },
  {
    name: 'sqip-blurhash',
    title: 'SQIP Blurhash',
    category: 'standard',
    description: 'BlurHash encoding — ultra-compact placeholder.',
    pluginChain: ['blurhash'],
    resultFileType: 'jpg',
    sqipConfig: {
      plugins: ['blurhash'],
    },
  },
  {
    name: 'sqip-blurhash-hd',
    title: 'SQIP Blurhash HD',
    category: 'standard',
    description: 'BlurHash with increased resolution (width: 10) for more detail.',
    pluginChain: ['blurhash(width:10)'],
    resultFileType: 'jpg',
    sqipConfig: {
      plugins: [{ name: 'blurhash', options: { width: 10 } }],
    },
  },

  // === Artistic / Complex ===
  {
    name: 'sqip-primitive-art',
    title: 'Primitive Art',
    category: 'artistic',
    description: '50 triangles — high-detail geometric art.',
    pluginChain: ['primitive(50, triangles)', 'svgo', 'data-uri'],
    resultFileType: 'svg',
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
    category: 'artistic',
    description: '30 circles — organic, bokeh-like art.',
    pluginChain: ['primitive(30, circles)', 'svgo', 'data-uri'],
    resultFileType: 'svg',
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
    sqipConfig: {
      plugins: [{ name: 'pixels', options: { pixels: 16 } }, 'svgo', 'data-uri'],
    },
  },
]
