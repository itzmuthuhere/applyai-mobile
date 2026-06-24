import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { getOfferings, purchasePackage, restorePurchases } from '../../services/revenueCat';

type BillingCycle = 'monthly' | 'annual';

interface PlanConfig {
  entitlement: string;
  name: string;
  monthlyId: string;
  annualId: string;
  monthlyPrice: string;
  annualPrice: string;
  annualMonthly: string;
  annualSaving: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tagline: string;
  features: Array<{ text: string; icon: React.ComponentProps<typeof Ionicons>['name'] }>;
  highlighted: boolean;
}

const PLANS: PlanConfig[] = [
  {
    entitlement: 'hunter',
    name: 'Hunter',
    monthlyId: 'hunter_monthly',
    annualId: 'hunter_annual',
    monthlyPrice: '₹99',
    annualPrice: '₹799',
    annualMonthly: '₹66',
    annualSaving: 'Save 33%',
    color: '#2563EB',
    icon: 'flash',
    tagline: 'For serious job seekers',
    features: [
      { text: '50 AI applications/month', icon: 'send-outline' },
      { text: 'AI resume tailoring', icon: 'color-wand-outline' },
      { text: 'Cover letter generation', icon: 'document-text-outline' },
      { text: 'Salary intelligence', icon: 'cash-outline' },
      { text: 'Negotiation coach', icon: 'trending-up-outline' },
    ],
    highlighted: false,
  },
  {
    entitlement: 'pro',
    name: 'Pro',
    monthlyId: 'pro_monthly',
    annualId: 'pro_annual',
    monthlyPrice: '₹199',
    annualPrice: '₹1,599',
    annualMonthly: '₹133',
    annualSaving: 'Save 33%',
    color: '#7C3AED',
    icon: 'rocket',
    tagline: 'For maximum success',
    features: [
      { text: 'Unlimited AI applications', icon: 'infinite-outline' },
      { text: 'AI mock interviews (voice)', icon: 'mic-outline' },
      { text: 'Interview prep plans', icon: 'calendar-outline' },
      { text: 'Company intelligence', icon: 'business-outline' },
      { text: 'Career path AI', icon: 'map-outline' },
    ],
    highlighted: true,
  },
];

const SOCIAL_PROOF = [
  { icon: 'people-outline' as const, text: '12,000+ active users' },
  { icon: 'star-outline' as const, text: '4.8★ on Play Store' },
  { icon: 'trophy-outline' as const, text: '3× more interviews' },
];

export default function PaywallScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<any>();
  const [billing, setBilling] = useState<BillingCycle>('annual');
  const [packages, setPackages] = useState<Record<string, PurchasesPackage>>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => { loadOfferings(); }, []);

  async function loadOfferings() {
    try {
      const offering = await getOfferings();
      if (offering) {
        const map: Record<string, PurchasesPackage> = {};
        offering.availablePackages.forEach(pkg => { map[pkg.identifier] = pkg; });
        setPackages(map);
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function handlePurchase(plan: PlanConfig) {
    const pkgId = billing === 'monthly' ? plan.monthlyId : plan.annualId;
    const pkg = packages[pkgId];
    if (!pkg) {
      Alert.alert('Coming Soon', 'Payments will be live when the app launches on Google Play.');
      return;
    }
    setPurchasing(plan.name);
    try {
      await purchasePackage(pkg);
      Alert.alert('You\'re in! 🎉', `Welcome to ${plan.name}. Your AI career tools are now unlocked.`, [
        { text: 'Let\'s Go!', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase Failed', e.message ?? 'Something went wrong. Try again.');
    } finally {
      setPurchasing(null);
    }
  }

  async function handleRestore() {
    try {
      await restorePurchases();
      Alert.alert('Restored', 'Your purchases have been restored.');
    } catch {
      Alert.alert('Error', 'Could not restore purchases. Try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Plan</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconRow}>
            {['flash', 'color-wand', 'mic', 'briefcase', 'rocket'].map((name, i) => (
              <View key={i} style={[styles.heroIcon, { backgroundColor: ['#EFF6FF', '#EDE9FE', '#D1FAE5', '#FEF3C7', '#FEE2E2'][i] }]}>
                <Ionicons name={name as any} size={18} color={['#2563EB', '#7C3AED', '#10B981', '#D97706', '#EF4444'][i]} />
              </View>
            ))}
          </View>
          <Text style={styles.heroTitle}>Land Your Dream Job{'\n'}with AI</Text>
          <Text style={styles.heroSub}>Join 12,000+ professionals who get 3× more interviews</Text>
        </View>

        {/* Social proof */}
        <View style={styles.proofRow}>
          {SOCIAL_PROOF.map((p, i) => (
            <View key={i} style={styles.proofItem}>
              <Ionicons name={p.icon} size={16} color={colors.primary} />
              <Text style={styles.proofText}>{p.text}</Text>
            </View>
          ))}
        </View>

        {/* Billing toggle */}
        <View style={styles.toggleWrap}>
          <TouchableOpacity
            style={[styles.toggleBtn, billing === 'monthly' && styles.toggleBtnActive]}
            onPress={() => setBilling('monthly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, billing === 'annual' && styles.toggleBtnActive]}
            onPress={() => setBilling('annual')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, billing === 'annual' && styles.toggleTextActive]}>Annual</Text>
            <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>Save 33%</Text></View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          PLANS.map(plan => {
            const price = billing === 'monthly' ? plan.monthlyPrice : plan.annualMonthly;
            const totalLabel = billing === 'annual' ? `${plan.annualPrice}/year` : null;
            return (
              <View
                key={plan.name}
                style={[styles.planCard, plan.highlighted && styles.planCardHighlighted, { borderColor: plan.highlighted ? plan.color : colors.border }]}
              >
                {plan.highlighted && (
                  <View style={[styles.popularBanner, { backgroundColor: plan.color }]}>
                    <Ionicons name="star" size={11} color="#fff" />
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}

                {/* Plan header */}
                <View style={styles.planHeader}>
                  <View style={[styles.planIconBox, { backgroundColor: plan.color + '18' }]}>
                    <Ionicons name={plan.icon} size={22} color={plan.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, plan.highlighted && { color: plan.color }]}>{plan.name}</Text>
                    <Text style={styles.planTagline}>{plan.tagline}</Text>
                  </View>
                  <View style={styles.priceWrap}>
                    <Text style={[styles.price, { color: plan.highlighted ? plan.color : colors.textPrimary }]}>{price}</Text>
                    <Text style={styles.pricePer}>/mo</Text>
                  </View>
                </View>

                {totalLabel && (
                  <View style={[styles.totalRow, { backgroundColor: plan.color + '12' }]}>
                    <Text style={[styles.totalText, { color: plan.color }]}>{totalLabel} · {plan.annualSaving}</Text>
                  </View>
                )}

                {/* Features */}
                <View style={styles.featureList}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <View style={[styles.featureIconBox, { backgroundColor: plan.color + '14' }]}>
                        <Ionicons name={f.icon} size={13} color={plan.color} />
                      </View>
                      <Text style={styles.featureText}>{f.text}</Text>
                    </View>
                  ))}
                </View>

                {/* CTA */}
                <TouchableOpacity
                  style={[styles.cta, { backgroundColor: plan.highlighted ? plan.color : 'transparent', borderColor: plan.color, borderWidth: plan.highlighted ? 0 : 2 }]}
                  onPress={() => handlePurchase(plan)}
                  disabled={purchasing !== null}
                  activeOpacity={0.85}
                >
                  {purchasing === plan.name ? (
                    <ActivityIndicator color={plan.highlighted ? '#fff' : plan.color} size="small" />
                  ) : (
                    <>
                      <Ionicons name={plan.icon} size={16} color={plan.highlighted ? '#fff' : plan.color} />
                      <Text style={[styles.ctaText, { color: plan.highlighted ? '#fff' : plan.color }]}>
                        Get {plan.name}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Trust badges */}
        <View style={styles.trustRow}>
          {[
            { icon: 'shield-checkmark-outline' as const, text: 'Secure payment' },
            { icon: 'refresh-outline' as const, text: 'Cancel anytime' },
            { icon: 'lock-closed-outline' as const, text: 'No hidden fees' },
          ].map((t, i) => (
            <View key={i} style={styles.trustItem}>
              <Ionicons name={t.icon} size={15} color={colors.textMuted} />
              <Text style={styles.trustText}>{t.text}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
          <Text style={styles.restoreText}>Restore previous purchases</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Secured by RevenueCat · Payments via Google Play{'\n'}
          Subscription renews automatically. Cancel anytime.
        </Text>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  scroll: { padding: 16, gap: 16 },

  // Hero
  hero: { alignItems: 'center', paddingVertical: 10, gap: 12 },
  heroIconRow: { flexDirection: 'row', gap: 10 },
  heroIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', lineHeight: 32 },
  heroSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Social proof
  proofRow: {
    flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap',
    backgroundColor: colors.primaryLight, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8,
    borderWidth: 1, borderColor: '#BFDBFE', gap: 6,
  },
  proofItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  proofText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  // Toggle
  toggleWrap: {
    flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14,
    padding: 4, borderWidth: 1, borderColor: colors.border,
  },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 11 },
  toggleBtnActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  toggleTextActive: { color: colors.textPrimary },
  saveBadge: { backgroundColor: '#10B981', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  saveBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Plan card
  planCard: {
    backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, gap: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  planCardHighlighted: {
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  popularBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 8,
  },
  popularText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, paddingBottom: 14 },
  planIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  planName: { fontSize: 18, fontWeight: '900', color: colors.textPrimary, marginBottom: 2 },
  planTagline: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  priceWrap: { alignItems: 'flex-end' },
  price: { fontSize: 28, fontWeight: '900' },
  pricePer: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  totalRow: { marginHorizontal: 18, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12, marginBottom: 4 },
  totalText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  featureList: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIconBox: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featureText: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 18, marginTop: 12, borderRadius: 14, paddingVertical: 15,
  },
  ctaText: { fontSize: 16, fontWeight: '800' },

  // Trust
  trustRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },

  restoreBtn: { alignItems: 'center', paddingVertical: 8 },
  restoreText: { fontSize: 13, color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },

  footer: { textAlign: 'center', fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  });
}