import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  AVATAR_CROP_VIEW_SIZE,
  AVATAR_MAX_SCALE,
  AVATAR_MIN_SCALE,
  clampCropScale,
  cropImageToBlob,
  loadImageFromFile,
  type AvatarCropState,
} from '../lib/avatarCrop'
import { getAvatarUrl } from '../lib/profile'
import { ProfileAvatar } from './ProfileAvatar'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_FILE_BYTES = 8 * 1024 * 1024

export function ProfilePictureEditor() {
  const { user, updateProfileAvatar, removeProfileAvatar } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  )

  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null)
  const [crop, setCrop] = useState<AvatarCropState>({ scale: 1, panX: 0, panY: 0 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const hasAvatar = Boolean(getAvatarUrl(user))
  const cropping = cropImage !== null

  const resetCropSession = useCallback(() => {
    setCropImage(null)
    setCrop({ scale: 1, panX: 0, panY: 0 })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    setMessage(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Choose a JPEG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Image must be 8 MB or smaller.')
      return
    }

    try {
      const img = await loadImageFromFile(file)
      setCropImage(img)
      setCrop({ scale: 1, panX: 0, panY: 0 })
    } catch {
      setError('Could not load that image.')
    }
  }

  function onCropPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!cropping) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: crop.panX,
      panY: crop.panY,
    }
  }

  function onCropPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    setCrop((prev) => ({
      ...prev,
      panX: drag.panX + (e.clientX - drag.x),
      panY: drag.panY + (e.clientY - drag.y),
    }))
  }

  function onCropPointerUp() {
    dragRef.current = null
  }

  async function handleSaveCrop() {
    if (!cropImage) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const blob = await cropImageToBlob(cropImage, crop)
      await updateProfileAvatar(blob)
      resetCropSession()
      setMessage('Profile photo saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save photo')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!hasAvatar) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await removeProfileAvatar()
      resetCropSession()
      setMessage('Profile photo removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove photo')
    } finally {
      setBusy(false)
    }
  }

  const coverScale = cropImage
    ? Math.max(
        AVATAR_CROP_VIEW_SIZE / cropImage.naturalWidth,
        AVATAR_CROP_VIEW_SIZE / cropImage.naturalHeight,
      )
    : 1
  const totalScale = coverScale * crop.scale
  const drawW = cropImage ? cropImage.naturalWidth * totalScale : 0
  const drawH = cropImage ? cropImage.naturalHeight * totalScale : 0
  const drawX = (AVATAR_CROP_VIEW_SIZE - drawW) / 2 + crop.panX
  const drawY = (AVATAR_CROP_VIEW_SIZE - drawH) / 2 + crop.panY

  return (
    <section className="account-profile-photo" aria-labelledby="profile-photo-heading">
      <h4 id="profile-photo-heading" className="account-profile-photo-title">
        Profile photo
      </h4>
      <p className="field-hint account-profile-photo-hint">
        Optional. Your initials show until you add a photo. Drag to reposition and use the
        slider to zoom before saving.
      </p>

      <div className="account-profile-photo-row">
        <ProfileAvatar user={user} size="lg" className="account-profile-photo-preview" />

        <div className="account-profile-photo-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="visually-hidden"
            onChange={(e) => void handleFileChange(e)}
          />
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {hasAvatar ? 'Change photo' : 'Choose photo'}
          </button>
          {hasAvatar && !cropping && (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => void handleRemove()}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      {cropping && cropImage && (
        <div className="profile-crop-panel">
          <div
            className="profile-crop-stage"
            style={{ width: AVATAR_CROP_VIEW_SIZE, height: AVATAR_CROP_VIEW_SIZE }}
            onPointerDown={onCropPointerDown}
            onPointerMove={onCropPointerMove}
            onPointerUp={onCropPointerUp}
            onPointerCancel={onCropPointerUp}
          >
            <img
              src={cropImage.src}
              alt=""
              className="profile-crop-image"
              style={{
                width: drawW,
                height: drawH,
                transform: `translate(${drawX}px, ${drawY}px)`,
              }}
              draggable={false}
            />
            <div className="profile-crop-ring" aria-hidden />
          </div>

          <label className="profile-crop-zoom">
            Zoom
            <input
              type="range"
              min={AVATAR_MIN_SCALE}
              max={AVATAR_MAX_SCALE}
              step={0.01}
              value={crop.scale}
              onChange={(e) =>
                setCrop((prev) => ({
                  ...prev,
                  scale: clampCropScale(parseFloat(e.target.value)),
                }))
              }
            />
          </label>

          <div className="profile-crop-buttons">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void handleSaveCrop()}
            >
              {busy ? 'Saving…' : 'Save photo'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={resetCropSession}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
    </section>
  )
}
