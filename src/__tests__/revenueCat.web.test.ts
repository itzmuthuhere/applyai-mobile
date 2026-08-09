import { Purchases, LogLevel } from '@revenuecat/purchases-js';

const mockInstance = {
  getOfferings: jest.fn(),
  purchase: jest.fn(),
  getCustomerInfo: jest.fn(),
};

jest.mock('@revenuecat/purchases-js', () => ({
  __esModule: true,
  Purchases: {
    setLogLevel: jest.fn(),
    configure: jest.fn(),
  },
  LogLevel: { Error: 'Error' },
}));

const mockPurchases = Purchases as jest.Mocked<typeof Purchases>;

describe('revenueCat.web service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPurchases.configure.mockReturnValue(mockInstance as any);
  });

  describe('before initRevenueCat has run', () => {
    // Each module gets a fresh, unconfigured instance so these don't depend
    // on test execution order relative to the "configured" tests below.
    it('getOfferings returns null', () => {
      jest.isolateModules(() => {
        const { getOfferings } = require('../services/revenueCat.web');
        return expect(getOfferings()).resolves.toBeNull();
      });
    });

    it('getActiveEntitlements returns an empty array', () => {
      jest.isolateModules(() => {
        const { getActiveEntitlements } = require('../services/revenueCat.web');
        return expect(getActiveEntitlements()).resolves.toEqual([]);
      });
    });

    it('purchasePackage throws', () => {
      jest.isolateModules(() => {
        const { purchasePackage } = require('../services/revenueCat.web');
        return expect(purchasePackage({} as any)).rejects.toThrow('Billing is not ready yet');
      });
    });
  });

  describe('once configured', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      initRevenueCat, getOfferings, purchasePackage, getActiveEntitlements,
    } = require('../services/revenueCat.web');

    beforeEach(() => {
      initRevenueCat('web-user@example.com');
    });

    it('configures the web SDK with the api key and user email as appUserId', () => {
      expect(mockPurchases.configure).toHaveBeenCalledWith(expect.any(String), 'web-user@example.com');
    });

    it('sets log level to Error', () => {
      expect(mockPurchases.setLogLevel).toHaveBeenCalledWith(LogLevel.Error);
    });

    it('getOfferings returns current offerings', async () => {
      const fakeOffering = { identifier: 'default', availablePackages: [] };
      mockInstance.getOfferings.mockResolvedValueOnce({ current: fakeOffering });

      const result = await getOfferings();
      expect(result).toBe(fakeOffering);
    });

    it('purchasePackage purchases and returns customerInfo', async () => {
      const customerInfo = { entitlements: { active: { hunter: {} } } };
      mockInstance.purchase.mockResolvedValueOnce({ customerInfo });

      const pkg = { identifier: 'hunter_monthly' } as any;
      const result = await purchasePackage(pkg);
      expect(mockInstance.purchase).toHaveBeenCalledWith({ rcPackage: pkg });
      expect(result).toBe(customerInfo);
    });

    it('getActiveEntitlements returns active entitlement keys', async () => {
      mockInstance.getCustomerInfo.mockResolvedValueOnce({
        entitlements: { active: { pro: {}, hunter: {} } },
      });

      const result = await getActiveEntitlements();
      expect(result).toEqual(expect.arrayContaining(['pro', 'hunter']));
      expect(result).toHaveLength(2);
    });
  });

  describe('restorePurchases', () => {
    it('always throws — restore is a device concept, web purchases are tied to the account', async () => {
      const { restorePurchases } = require('../services/revenueCat.web');
      await expect(restorePurchases()).rejects.toThrow("Restoring purchases isn't available on web");
    });
  });
});
