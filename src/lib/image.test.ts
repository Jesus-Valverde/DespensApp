import { describe, it, expect, vi, afterEach } from 'vitest'
import { downscaleImage, MAX_IMAGE_SIZE } from './image'

interface CanvasCall {
  type: string
  quality: number
}

interface FakeBitmap {
  width: number
  height: number
  close: ReturnType<typeof vi.fn>
}

function fakeBitmap(width: number, height: number): FakeBitmap {
  return { width, height, close: vi.fn() }
}

/** Capture every canvas interaction: created size, draw args, toBlob params. */
function captureCanvas() {
  const draws: unknown[][] = []
  const toBlobCalls: CanvasCall[] = []
  const canvases: HTMLCanvasElement[] = []

  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (this: HTMLCanvasElement) {
    canvases.push(this)
    return { drawImage: (...args: unknown[]) => void draws.push(args) }
  }) as unknown as HTMLCanvasElement['getContext']

  HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type = '',
    quality?: number,
  ) {
    toBlobCalls.push({ type, quality: quality ?? NaN })
    callback(new Blob(['jpeg-bytes'], { type }))
  }) as HTMLCanvasElement['toBlob']

  return { draws, toBlobCalls, canvases }
}

const stubBitmapSource = (bitmap: FakeBitmap) =>
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('downscaleImage', () => {
  it('scales a 1024x768 photo down to max 512px as JPEG q=0.8', async () => {
    const bitmap = fakeBitmap(1024, 768)
    stubBitmapSource(bitmap)
    const { draws, toBlobCalls, canvases } = captureCanvas()

    const blob = await downscaleImage(new Blob(['img'], { type: 'image/png' }))

    expect(canvases[0]?.width).toBe(512)
    expect(canvases[0]?.height).toBe(384)
    expect(draws[0]).toEqual([bitmap, 0, 0, 512, 384])
    expect(toBlobCalls[0]).toEqual({ type: 'image/jpeg', quality: 0.8 })
    expect(blob.type).toBe('image/jpeg')
    expect(bitmap.close).toHaveBeenCalled()
  })

  it('bounds the LONGEST side: portrait 768x1024 becomes 384x512', async () => {
    stubBitmapSource(fakeBitmap(768, 1024))
    const { canvases } = captureCanvas()

    await downscaleImage(new Blob(['img'], { type: 'image/jpeg' }))

    expect(canvases[0]?.width).toBe(384)
    expect(canvases[0]?.height).toBe(512)
  })

  it('never upscales: a 300x200 image stays 300x200', async () => {
    stubBitmapSource(fakeBitmap(300, 200))
    const { canvases } = captureCanvas()

    await downscaleImage(new Blob(['img'], { type: 'image/jpeg' }))

    expect(canvases[0]?.width).toBe(300)
    expect(canvases[0]?.height).toBe(200)
  })

  it('exposes the configured size bound', () => {
    expect(MAX_IMAGE_SIZE).toBe(512)
  })
})
