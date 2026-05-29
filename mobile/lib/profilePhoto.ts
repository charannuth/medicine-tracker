import { Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const PROFILE_PHOTO_MAX_BYTES = 8 * 1024 * 1024;

/** JPEG bytes for Supabase Storage (React Native cannot build Blob from ArrayBuffer). */
export type ProfilePhotoUpload = ArrayBuffer;

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
  base64: true,
};

export function mediaLibraryAccessGranted(
  permission: ImagePicker.MediaLibraryPermissionResponse,
): boolean {
  return permission.granted || permission.accessPrivileges === 'limited';
}

export async function requestPhotoLibraryAccess(): Promise<boolean> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return mediaLibraryAccessGranted(permission);
}

export async function requestCameraAccess(): Promise<boolean> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  return permission.granted;
}

export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

export async function pickProfilePhotoFromLibrary(): Promise<ProfilePhotoUpload | null> {
  const allowed = await requestPhotoLibraryAccess();
  if (!allowed) {
    throw new PhotoPermissionError('library');
  }

  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  return assetToUploadBytes(result);
}

export async function takeProfilePhotoWithCamera(): Promise<ProfilePhotoUpload | null> {
  const allowed = await requestCameraAccess();
  if (!allowed) {
    throw new PhotoPermissionError('camera');
  }

  const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  return assetToUploadBytes(result);
}

export class PhotoPermissionError extends Error {
  constructor(readonly source: 'library' | 'camera') {
    super(
      source === 'library'
        ? 'Photo library access is required to choose a profile picture.'
        : 'Camera access is required to take a profile picture.',
    );
    this.name = 'PhotoPermissionError';
  }
}

async function assetToUploadBytes(
  result: ImagePicker.ImagePickerResult,
): Promise<ProfilePhotoUpload | null> {
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > PROFILE_PHOTO_MAX_BYTES) {
    throw new Error('Image must be 8 MB or smaller.');
  }

  if (asset.type && asset.type !== 'image') {
    throw new Error('Choose an image file.');
  }

  return imageAssetToUploadBytes(asset);
}

/** Read a picked image as JPEG bytes for Supabase upload. */
export async function imageAssetToUploadBytes(
  asset: ImagePicker.ImagePickerAsset,
): Promise<ProfilePhotoUpload> {
  if (asset.uri) {
    try {
      const response = await fetch(asset.uri);
      if (response.ok) {
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength > 0) {
          return bytes;
        }
      }
    } catch {
      // fall through to base64
    }
  }

  if (asset.base64) {
    return base64ToArrayBuffer(asset.base64);
  }

  throw new Error('Could not read the selected photo.');
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function profilePhotoPermissionMessage(source: 'library' | 'camera'): string {
  if (source === 'library') {
    return Platform.OS === 'ios'
      ? 'Allow access to your photos in Settings to choose a profile picture.'
      : 'Allow access to your photo library to choose a profile picture.';
  }
  return 'Allow camera access in Settings to take a profile picture.';
}
