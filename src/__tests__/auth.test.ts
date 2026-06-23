import * as SecureStore from 'expo-secure-store';
import { saveJwt, getJwt, clearJwt } from '../utils/auth';

const mockSet = SecureStore.setItemAsync as jest.MockedFunction<typeof SecureStore.setItemAsync>;
const mockGet = SecureStore.getItemAsync as jest.MockedFunction<typeof SecureStore.getItemAsync>;
const mockDelete = SecureStore.deleteItemAsync as jest.MockedFunction<typeof SecureStore.deleteItemAsync>;

describe('auth utils', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('saveJwt', () => {
    it('calls setItemAsync with key "jwt" and the token', async () => {
      mockSet.mockResolvedValueOnce();
      await saveJwt('my-jwt-token');
      expect(mockSet).toHaveBeenCalledWith('jwt', 'my-jwt-token');
    });

    it('propagates error from SecureStore', async () => {
      mockSet.mockRejectedValueOnce(new Error('Storage full'));
      await expect(saveJwt('token')).rejects.toThrow('Storage full');
    });
  });

  describe('getJwt', () => {
    it('returns stored token when it exists', async () => {
      mockGet.mockResolvedValueOnce('stored-token');
      const result = await getJwt();
      expect(result).toBe('stored-token');
      expect(mockGet).toHaveBeenCalledWith('jwt');
    });

    it('returns null when no token is stored', async () => {
      mockGet.mockResolvedValueOnce(null);
      const result = await getJwt();
      expect(result).toBeNull();
    });

    it('propagates error from SecureStore', async () => {
      mockGet.mockRejectedValueOnce(new Error('Permission denied'));
      await expect(getJwt()).rejects.toThrow('Permission denied');
    });
  });

  describe('clearJwt', () => {
    it('calls deleteItemAsync with key "jwt"', async () => {
      mockDelete.mockResolvedValueOnce();
      await clearJwt();
      expect(mockDelete).toHaveBeenCalledWith('jwt');
    });

    it('propagates error from SecureStore', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Item not found'));
      await expect(clearJwt()).rejects.toThrow('Item not found');
    });
  });
});
