import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import {
  initRevenueCat,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getActiveEntitlements,
} from '../services/revenueCat';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    setLogLevel: jest.fn(),
    configure: jest.fn(),
    logIn: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
  },
  LOG_LEVEL: { ERROR: 'ERROR' },
}));

const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;

describe('revenueCat service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('initRevenueCat', () => {
    it('configures Purchases with the SDK key', () => {
      initRevenueCat('user@example.com');
      expect(mockPurchases.configure).toHaveBeenCalledWith({ apiKey: expect.any(String) });
    });

    it('sets log level to ERROR', () => {
      initRevenueCat('user@example.com');
      expect(mockPurchases.setLogLevel).toHaveBeenCalledWith(LOG_LEVEL.ERROR);
    });

    it('logs in with user email', () => {
      initRevenueCat('muthu@example.com');
      expect(mockPurchases.logIn).toHaveBeenCalledWith('muthu@example.com');
    });
  });

  describe('getOfferings', () => {
    it('returns current offerings', async () => {
      const fakeOffering = { identifier: 'default', packages: [] };
      mockPurchases.getOfferings.mockResolvedValueOnce({
        current: fakeOffering,
        all: { default: fakeOffering },
      } as any);

      const result = await getOfferings();
      expect(result).toBe(fakeOffering);
    });

    it('propagates error from Purchases', async () => {
      mockPurchases.getOfferings.mockRejectedValueOnce(new Error('Network error'));
      await expect(getOfferings()).rejects.toThrow('Network error');
    });
  });

  describe('purchasePackage', () => {
    it('returns customerInfo on success', async () => {
      const customerInfo = { entitlements: { active: { pro: {} } } };
      mockPurchases.purchasePackage.mockResolvedValueOnce({ customerInfo } as any);

      const result = await purchasePackage({ identifier: 'monthly' } as any);
      expect(result).toBe(customerInfo);
    });

    it('propagates error (user cancelled)', async () => {
      mockPurchases.purchasePackage.mockRejectedValueOnce(new Error('USER_CANCELLED'));
      await expect(purchasePackage({} as any)).rejects.toThrow('USER_CANCELLED');
    });
  });

  describe('restorePurchases', () => {
    it('returns restored customer info', async () => {
      const customerInfo = { entitlements: { active: {} } };
      mockPurchases.restorePurchases.mockResolvedValueOnce(customerInfo as any);

      const result = await restorePurchases();
      expect(result).toBe(customerInfo);
    });

    it('propagates error from Purchases', async () => {
      mockPurchases.restorePurchases.mockRejectedValueOnce(new Error('Restore failed'));
      await expect(restorePurchases()).rejects.toThrow('Restore failed');
    });
  });

  describe('getActiveEntitlements', () => {
    it('returns list of active entitlement keys', async () => {
      mockPurchases.getCustomerInfo.mockResolvedValueOnce({
        entitlements: { active: { pro: {}, hunter: {} } },
      } as any);

      const result = await getActiveEntitlements();
      expect(result).toEqual(expect.arrayContaining(['pro', 'hunter']));
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no active entitlements', async () => {
      mockPurchases.getCustomerInfo.mockResolvedValueOnce({
        entitlements: { active: {} },
      } as any);

      const result = await getActiveEntitlements();
      expect(result).toEqual([]);
    });

    it('propagates error from getCustomerInfo', async () => {
      mockPurchases.getCustomerInfo.mockRejectedValueOnce(new Error('Not configured'));
      await expect(getActiveEntitlements()).rejects.toThrow('Not configured');
    });
  });

  describe('on web', () => {
    const originalOS = Platform.OS;
    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
    });

    it('initRevenueCat no-ops instead of configuring Purchases (web billing goes through Stripe)', () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      initRevenueCat('user@example.com');
      expect(mockPurchases.configure).not.toHaveBeenCalled();
    });

    it('getOfferings returns null without calling Purchases', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      const result = await getOfferings();
      expect(result).toBeNull();
      expect(mockPurchases.getOfferings).not.toHaveBeenCalled();
    });

    it('getActiveEntitlements returns an empty array without calling Purchases', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      const result = await getActiveEntitlements();
      expect(result).toEqual([]);
      expect(mockPurchases.getCustomerInfo).not.toHaveBeenCalled();
    });
  });
});
