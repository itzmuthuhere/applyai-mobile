import * as SecureStore from 'expo-secure-store';
import { SECURE_STORE_KEYS } from '../constants';

export const saveJwt = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.JWT, token);
};

export const getJwt = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(SECURE_STORE_KEYS.JWT);
};

export const clearJwt = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.JWT);
};
