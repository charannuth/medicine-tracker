export type AvatarCropState = {
  scale: number
  panX: number
  panY: number
}

export const AVATAR_CROP_VIEW_SIZE = 260
export const AVATAR_OUTPUT_SIZE = 256
export const AVATAR_MIN_SCALE = 1
export const AVATAR_MAX_SCALE = 3

export function clampCropScale(scale: number): number {
  return Math.min(AVATAR_MAX_SCALE, Math.max(AVATAR_MIN_SCALE, scale))
}

export function computeCropRect(
  imageWidth: number,
  imageHeight: number,
  crop: AvatarCropState,
  viewSize = AVATAR_CROP_VIEW_SIZE,
): { x: number; y: number; width: number; height: number } {
  const cover = Math.max(viewSize / imageWidth, viewSize / imageHeight)
  const totalScale = cover * crop.scale
  const drawW = imageWidth * totalScale
  const drawH = imageHeight * totalScale
  const drawX = (viewSize - drawW) / 2 + crop.panX
  const drawY = (viewSize - drawH) / 2 + crop.panY

  const size = viewSize / totalScale
  const x = -drawX / totalScale
  const y = -drawY / totalScale

  const maxX = Math.max(0, imageWidth - size)
  const maxY = Math.max(0, imageHeight - size)

  return {
    x: Math.min(maxX, Math.max(0, x)),
    y: Math.min(maxY, Math.max(0, y)),
    width: Math.min(size, imageWidth),
    height: Math.min(size, imageHeight),
  }
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })
}

export function cropImageToBlob(
  image: HTMLImageElement,
  crop: AvatarCropState,
): Promise<Blob> {
  const rect = computeCropRect(image.naturalWidth, image.naturalHeight, crop)
  const size = AVATAR_OUTPUT_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Could not prepare image'))

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    image,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    size,
    size,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Could not export image'))
      },
      'image/jpeg',
      0.9,
    )
  })
}
