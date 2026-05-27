/** Lazy-load expo-image-picker so Metro works before a native rebuild. */

type ImagePickerModule = typeof import('expo-image-picker');

let cached: ImagePickerModule | null | undefined;

export async function getExpoImagePicker(): Promise<ImagePickerModule | null> {
  if (cached !== undefined) return cached;

  try {
    cached = await import('expo-image-picker');
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function imagePickerNativeMissing(): boolean {
  return cached === null;
}

export const IMAGE_PICKER_REBUILD_HINT =
  'Profile photos need a fresh dev build with expo-image-picker. Run: cd mobile && npx expo run:ios';
