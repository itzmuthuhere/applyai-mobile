import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';

const TEST_KEY = 'test_uCObpUtEmbfTmNyvPiknMOltvND';
const PROD_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY || '';

const PUBLIC_SDK_KEY = __DEV__ ? TEST_KEY : PROD_KEY;

// RevenueCat has no real web billing SDK — web subscriptions go through Stripe
// instead (see billing/ once that lands). No-op here rather than trust its
// "Browser Mode" fallback, which isn't wired to any actual payment flow.
export function initRevenueCat(userEmail: string) {
  if (Platform.OS === 'web') return;
  if (!__DEV__ && !PROD_KEY) return;
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: PUBLIC_SDK_KEY });
  Purchases.logIn(userEmail);
}

export async function getOfferings() {
  if (Platform.OS === 'web') return null;
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
  if (Platform.OS === 'web') return [];
  const customerInfo = await Purchases.getCustomerInfo();
  return Object.keys(customerInfo.entitlements.active);
}
