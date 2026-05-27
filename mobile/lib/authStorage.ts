import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupportedStorage } from '@supabase/supabase-js';

const memory = new Map<string, string>();
let nativeStorageOk: boolean | null = null;
let warnedFallback = false;

async function canUseNativeStorage(): Promise<boolean> {
  if (nativeStorageOk !== null) return nativeStorageOk;
  try {
    const probeKey = '__dr_dose_storage_probe__';
    await AsyncStorage.setItem(probeKey, '1');
    await AsyncStorage.removeItem(probeKey);
    nativeStorageOk = true;
  } catch {
    nativeStorageOk = false;
    if (!warnedFallback) {
      warnedFallback = true;
      console.warn(
        '[Dr. Dose] AsyncStorage native module is missing. Rebuild the app: cd mobile && npx expo run:ios. Using in-memory session until then.',
      );
    }
  }
  return nativeStorageOk;
}

/** Supabase auth storage — AsyncStorage when native is linked, otherwise in-memory. */
export const authStorage: SupportedStorage = {
  getItem: async (key) => {
    if (await canUseNativeStorage()) {
      return AsyncStorage.getItem(key);
    }
    return memory.get(key) ?? null;
  },
  setItem: async (key, value) => {
    if (await canUseNativeStorage()) {
      await AsyncStorage.setItem(key, value);
      return;
    }
    memory.set(key, value);
  },
  removeItem: async (key) => {
    if (await canUseNativeStorage()) {
      await AsyncStorage.removeItem(key);
      return;
    }
    memory.delete(key);
  },
};
