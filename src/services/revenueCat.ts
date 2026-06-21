import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';

const PUBLIC_SDK_KEY = 'test_uCObpUtEmbfTmNyvPiknMOltvND';

export function initRevenueCat(userEmail: string) {
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: PUBLIC_SDK_KEY });
  Purchases.logIn(userEmail);
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo;
}

export async function getActiveEntitlements(): Promise<string[]> {
  const customerInfo = await Purchases.getCustomerInfo();
  return Object.keys(customerInfo.entitlements.active);
}
