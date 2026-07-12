import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store's web build is an empty stub — there's no browser keychain
// equivalent — so we fall back to localStorage on web (Expo's own documented
// guidance for this gap). Native platforms keep using the real SecureStore.
export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return window.localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
