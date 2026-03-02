import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { SqipResult, SqipImageMetadata } from 'sqip'

const { mockSqipResult } = vi.hoisted(() => {
  const mockSqipResult: SqipResult = {
    content: Buffer.from('<svg>mock</svg>'),
    metadata: {
      originalWidth: 800,
      originalHeight: 600,
      width: 300,
      height: 225,
      type: 'svg',
      mimeType: 'image/svg+xml',
      filename: 'test',
      palette: {},
      backgroundColor: '#ffffff',
      dataURI: 'data:image/svg+xml,...'
    } as SqipImageMetadata
  }
  return { mockSqipResult }
})

vi.mock('sqip', () => ({
  sqip: vi.fn().mockResolvedValue(mockSqipResult)
}))

import sqipPlugin from '../../src/index.js'
import { sqip } from 'sqip'
import type { Plugin } from 'vite'

function getLoadHook(plugin: Plugin) {
  return plugin.load as (id: string) => Promise<string | null>
}

describe('vite-plugin-sqip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sqip).mockResolvedValue(mockSqipResult)
  })

  test('plugin has correct name', () => {
    const plugin = sqipPlugin()
    expect(plugin.name).toBe('vite-plugin-sqip')
  })

  test('plugin enforces pre order', () => {
    const plugin = sqipPlugin()
    expect(plugin.enforce).toBe('pre')
  })

  test('load ignores IDs without ?sqip query', async () => {
    const plugin = sqipPlugin()
    const load = getLoadHook(plugin)

    expect(await load.call({}, '/path/to/image.jpg')).toBeNull()
    expect(await load.call({}, '/path/to/image.jpg?url')).toBeNull()
    expect(await load.call({}, '/path/to/style.css')).toBeNull()
    expect(sqip).not.toHaveBeenCalled()
  })

  test('ignores non-image files even with ?sqip query', async () => {
    const plugin = sqipPlugin()
    const load = getLoadHook(plugin)

    expect(await load.call({}, '/path/to/file.txt?sqip')).toBeNull()
    expect(sqip).not.toHaveBeenCalled()
  })

  test('load processes image IDs with ?sqip query', async () => {
    const plugin = sqipPlugin()
    const load = getLoadHook(plugin)

    const result = await load.call({}, '/path/to/image.jpg?sqip')

    expect(sqip).toHaveBeenCalledWith(
      expect.objectContaining({
        input: '/path/to/image.jpg',
        silent: true
      })
    )
    expect(result).toContain('export default')
  })

  test('strips additional query params after ?sqip', async () => {
    const plugin = sqipPlugin()
    const load = getLoadHook(plugin)

    await load.call({}, '/path/to/image.jpg?sqip&other=true')

    expect(sqip).toHaveBeenCalledWith(
      expect.objectContaining({
        input: '/path/to/image.jpg'
      })
    )
  })

  test('passes plugin options through to sqip', async () => {
    const plugin = sqipPlugin({
      plugins: ['blur', 'svgo'],
      width: 200
    })
    const load = getLoadHook(plugin)

    await load.call({}, '/path/to/image.jpg?sqip')

    expect(sqip).toHaveBeenCalledWith(
      expect.objectContaining({
        input: '/path/to/image.jpg',
        plugins: ['blur', 'svgo'],
        width: 200
      })
    )
  })

  test('produces a valid JS module with metadata and svg', async () => {
    const plugin = sqipPlugin()
    const load = getLoadHook(plugin)

    const result = await load.call({}, '/path/to/image.jpg?sqip')

    expect(result).not.toBeNull()
    const jsonStr = result!.replace('export default ', '')
    const parsed = JSON.parse(jsonStr)
    expect(parsed).toHaveProperty('metadata')
    expect(parsed).toHaveProperty('svg')
    expect(parsed.svg).toBe('<svg>mock</svg>')
    expect(parsed.metadata.width).toBe(300)
    expect(parsed.metadata.height).toBe(225)
  })

  test('handles various image extensions', async () => {
    const plugin = sqipPlugin()
    const load = getLoadHook(plugin)

    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'tiff']
    for (const ext of extensions) {
      vi.clearAllMocks()
      vi.mocked(sqip).mockResolvedValue(mockSqipResult)
      const result = await load.call({}, `/path/to/image.${ext}?sqip`)
      expect(result).not.toBeNull()
      expect(sqip).toHaveBeenCalled()
    }
  })

  test('handles array result from sqip', async () => {
    vi.mocked(sqip).mockResolvedValueOnce([mockSqipResult])

    const plugin = sqipPlugin()
    const load = getLoadHook(plugin)

    const result = await load.call({}, '/path/to/image.jpg?sqip')

    expect(result).toContain('export default')
    const jsonStr = result!.replace('export default ', '')
    const parsed = JSON.parse(jsonStr)
    expect(parsed.svg).toBe('<svg>mock</svg>')
  })
})
