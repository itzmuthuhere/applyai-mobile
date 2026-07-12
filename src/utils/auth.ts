import * as SecureStorage from './secureStorage';
import { SECURE_STORE_KEYS } from '../constants';

export const saveJwt = async (token: string): Promise<void> => {
  await SecureStorage.setItemAsync(SECURE_STORE_KEYS.JWT, token);
};

export const getJwt = async (): Promise<string | null> => {
  return await SecureStorage.getItemAsync(SECURE_STORE_KEYS.JWT);
};

export const clearJwt = async (): Promise<void> => {
  await SecureStorage.deleteItemAsync(SECURE_STORE_KEYS.JWT);
};
