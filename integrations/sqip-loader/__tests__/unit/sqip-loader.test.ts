import { describe, test, expect, vi, beforeEach } from 'vitest'

const { mockResult } = vi.hoisted(() => {
  const mockResult = {
    content: Buffer.from('<svg>mock</svg>'),
    metadata: {
      originalWidth: 800,
      originalHeight: 600,
      width: 300,
      height: 225,
      type: 'svg',
      mimeType: 'image/svg+xml',
      filename: 'test',
      dataURI: 'data:image/svg+xml,%3Csvg%3Emock%3C/svg%3E'
    }
  }
  return { mockResult }
})

vi.mock('sqip', () => ({
  sqip: vi.fn().mockResolvedValue(mockResult)
}))

import sqipLoader from '../../src/index.js'
import { sqip } from 'sqip'

function createLoaderContext(options: Record<string, unknown> = {}) {
  const callback = vi.fn()
  return {
    async: vi.fn(() => callback),
    getOptions: vi.fn(() => options),
    resourcePath: '/path/to/test.jpg',
    _callback: callback
  }
}

describe('sqip-loader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sqip).mockResolvedValue(mockResult)
  })

  test('is a function', () => {
    expect(typeof sqipLoader).toBe('function')
  })

  test('calls sqip with input buffer and default options', async () => {
    const ctx = createLoaderContext()
    const buffer = Buffer.from('fake-image-data')

    sqipLoader.call(ctx as never, buffer)

    await vi.waitFor(() => {
      expect(ctx._callback).toHaveBeenCalled()
    })

    expect(sqip).toHaveBeenCalledWith(
      expect.objectContaining({
        input: Buffer.from(buffer),
        outputFileName: 'test'
      })
    )
  })

  test('passes loader options through to sqip', async () => {
    const loaderOptions = {
      plugins: ['blur', 'svgo'],
      width: 200
    }
    const ctx = createLoaderContext(loaderOptions)
    const buffer = Buffer.from('fake-image-data')

    sqipLoader.call(ctx as never, buffer)

    await vi.waitFor(() => {
      expect(ctx._callback).toHaveBeenCalled()
    })

    expect(sqip).toHaveBeenCalledWith(
      expect.objectContaining({
        plugins: ['blur', 'svgo'],
        width: 200
      })
    )
  })

  test('produces a valid JS module exporting metadata and svg', async () => {
    const ctx = createLoaderContext()
    const buffer = Buffer.from('fake-image-data')

    sqipLoader.call(ctx as never, buffer)

    await vi.waitFor(() => {
      expect(ctx._callback).toHaveBeenCalled()
    })

    const [err, output] = ctx._callback.mock.calls[0]
    expect(err).toBeNull()
    expect(output).toContain('export default ')

    const jsonStr = (output as string).replace('export default ', '')
    const parsed = JSON.parse(jsonStr)
    expect(parsed.metadata).toBeDefined()
    expect(parsed.metadata.width).toBe(300)
    expect(parsed.metadata.height).toBe(225)
    expect(parsed.svg).toBe('<svg>mock</svg>')
  })

  test('handles sqip errors by calling back with error', async () => {
    const error = new Error('sqip processing failed')
    vi.mocked(sqip).mockRejectedValueOnce(error)

    const ctx = createLoaderContext()
    const buffer = Buffer.from('fake-image-data')

    sqipLoader.call(ctx as never, buffer)

    await vi.waitFor(() => {
      expect(ctx._callback).toHaveBeenCalled()
    })

    expect(ctx._callback).toHaveBeenCalledWith(error)
  })

  test('handles array results from sqip', async () => {
    vi.mocked(sqip).mockResolvedValueOnce([mockResult])

    const ctx = createLoaderContext()
    const buffer = Buffer.from('fake-image-data')

    sqipLoader.call(ctx as never, buffer)

    await vi.waitFor(() => {
      expect(ctx._callback).toHaveBeenCalled()
    })

    const [err, output] = ctx._callback.mock.calls[0]
    expect(err).toBeNull()

    const jsonStr = (output as string).replace('export default ', '')
    const parsed = JSON.parse(jsonStr)
    expect(parsed.svg).toBe('<svg>mock</svg>')
  })

  test('extracts outputFileName from resourcePath', async () => {
    const ctx = createLoaderContext()
    ctx.resourcePath = '/images/hero-banner.png'
    const buffer = Buffer.from('fake-image-data')

    sqipLoader.call(ctx as never, buffer)

    await vi.waitFor(() => {
      expect(ctx._callback).toHaveBeenCalled()
    })

    expect(sqip).toHaveBeenCalledWith(
      expect.objectContaining({
        outputFileName: 'hero-banner'
      })
    )
  })
})
