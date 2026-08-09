import { Purchases, LogLevel, type Package as WebPurchasesPackage } from '@revenuecat/purchases-js';

const WEB_BILLING_KEY = process.env.EXPO_PUBLIC_REVENUECAT_WEB_BILLING_KEY || '';

let purchases: Purchases | null = null;

// Web — RevenueCat Web Billing (Stripe under the hood), same RevenueCat
// project/entitlements/webhook as native. MUST configure with the user's email
// as appUserId, matching native's Purchases.logIn(userEmail) in revenueCat.ts,
// because the backend webhook (RevenueCatWebhookService.resolveUserId ->
// userRepository.findByEmail) resolves purchases by email — an anonymous or
// mismatched appUserId means a successful purchase silently never upgrades the
// user's plan.
export function initRevenueCat(userEmail: string) {
  if (!WEB_BILLING_KEY) return;
  Purchases.setLogLevel(LogLevel.Error);
  purchases = Purchases.configure(WEB_BILLING_KEY, userEmail);
}

export async function getOfferings() {
  if (!purchases) return null;
  const offerings = await purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: WebPurchasesPackage) {
  if (!purchases) throw new Error('Billing is not ready yet. Please try again.');
  const { customerInfo } = await purchases.purchase({ rcPackage: pkg });
  return customerInfo;
}

export async function restorePurchases(): Promise<never> {
  throw new Error("Restoring purchases isn't available on web — your plan is tied to your account, not a device.");
}

export async function getActiveEntitlements(): Promise<string[]> {
  if (!purchases) return [];
  const customerInfo = await purchases.getCustomerInfo();
  return Object.keys(customerInfo.entitlements.active);
}
