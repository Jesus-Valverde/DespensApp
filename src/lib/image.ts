// Image helpers for product photos (design decision 10):
// createImageBitmap + canvas downscale to max 512px, JPEG quality 0.8.

export const MAX_IMAGE_SIZE = 512
export const JPEG_QUALITY = 0.8

export function downscaleImage(file: Blob): Promise<Blob> {
  return createImageBitmap(file).then(async (bitmap) => {
    try {
      const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(bitmap.width, bitmap.height))
      const width = Math.round(bitmap.width * scale)
      const height = Math.round(bitmap.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo procesar la imagen')
      ctx.drawImage(bitmap, 0, 0, width, height)

      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))),
          'image/jpeg',
          JPEG_QUALITY,
        )
      })
    } finally {
      bitmap.close()
    }
  })
}
