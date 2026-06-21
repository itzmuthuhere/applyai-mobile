import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PurchasesPackage } from 'react-native-purchases';
import { COLORS } from '../../constants';
import { getOfferings, purchasePackage, restorePurchases } from '../../services/revenueCat';

type BillingCycle = 'monthly' | 'annual';

interface PlanConfig {
  entitlement: string;
  name: string;
  monthlyId: string;
  annualId: string;
  monthlyPrice: string;
  annualPrice: string;
  annualSaving: string;
  features: string[];
  highlighted: boolean;
}

const PLANS: PlanConfig[] = [
  {
    entitlement: 'hunter',
    name: 'Hunter',
    monthlyId: 'hunter_monthly',
    annualId: 'hunter_annual',
    monthlyPrice: '₹99/month',
    annualPrice: '₹799/year',
    annualSaving: 'Save 33%',
    features: [
      '50 AI applications/month',
      'AI resume tailoring',
      'Cover letter generation',
      'Salary intelligence',
      'Negotiation coach',
    ],
    highlighted: false,
  },
  {
    entitlement: 'pro',
    name: 'Pro',
    monthlyId: 'pro_monthly',
    annualId: 'pro_annual',
    monthlyPrice: '₹199/month',
    annualPrice: '₹1,599/year',
    annualSaving: 'Save 33%',
    features: [
      'Unlimited AI applications',
      'Mock interviews (voice)',
      'Interview prep plans',
      'Company intelligence',
      'Career path AI',
    ],
    highlighted: true,
  },
];

export default function PaywallScreen() {
  const navigation = useNavigation<any>();
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [packages, setPackages] = useState<Record<string, PurchasesPackage>>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  async function loadOfferings() {
    try {
      const offering = await getOfferings();
      if (offering) {
        const map: Record<string, PurchasesPackage> = {};
        offering.availablePackages.forEach((pkg) => {
          map[pkg.identifier] = pkg;
        });
        setPackages(map);
      }
    } catch {
      // sandbox — packages not available until Play Console is set up
    } finally {
      setLoading(false);
    }
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
      Alert.alert('Success!', `You are now on the ${plan.name} plan.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Failed', e.message ?? 'Something went wrong. Try again.');
      }
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Unlock Full Access</Text>
        <Text style={styles.subtitle}>AI-powered job hunting — cancel anytime</Text>

        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, billing === 'monthly' && styles.toggleActive]}
            onPress={() => setBilling('monthly')}
          >
            <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, billing === 'annual' && styles.toggleActive]}
            onPress={() => setBilling('annual')}
          >
            <Text style={[styles.toggleText, billing === 'annual' && styles.toggleTextActive]}>Annual</Text>
            <View style={styles.savingBadge}><Text style={styles.savingText}>Save 33%</Text></View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          PLANS.map((plan) => (
            <View key={plan.name} style={[styles.card, plan.highlighted && styles.highlightedCard]}>
              {plan.highlighted && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
              )}
              <Text style={[styles.planName, plan.highlighted && styles.whiteText]}>{plan.name}</Text>
              <Text style={[styles.planPrice, plan.highlighted && styles.whiteText]}>
                {billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
              </Text>
              {billing === 'annual' && (
                <Text style={[styles.saving, plan.highlighted && styles.whiteText]}>{plan.annualSaving}</Text>
              )}
              <View style={styles.divider} />
              {plan.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={plan.highlighted ? '#fff' : COLORS.secondary} />
                  <Text style={[styles.featureText, plan.highlighted && styles.whiteText]}>{f}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.ctaBtn, plan.highlighted ? styles.ctaBtnWhite : styles.ctaBtnOutline]}
                onPress={() => handlePurchase(plan)}
                disabled={purchasing !== null}
              >
                {purchasing === plan.name ? (
                  <ActivityIndicator color={plan.highlighted ? COLORS.primary : COLORS.primary} />
                ) : (
                  <Text style={[styles.ctaText, plan.highlighted ? styles.ctaTextPrimary : styles.ctaTextOutline]}>
                    Upgrade to {plan.name}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text style={styles.restoreText}>Restore purchases</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>Secured by RevenueCat · Cancel anytime from Google Play</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24 },

  toggle: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 24, padding: 4,
  },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  toggleActive: { backgroundColor: COLORS.primary },
  toggleText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  toggleTextActive: { color: '#fff' },
  savingBadge: { backgroundColor: COLORS.success, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  savingText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  highlightedCard: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  popularBadge: {
    backgroundColor: COLORS.warning, borderRadius: 12, paddingHorizontal: 10,
    paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8,
  },
  popularText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  planName: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  planPrice: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4 },
  saving: { fontSize: 13, color: COLORS.success, marginTop: 2 },
  whiteText: { color: '#fff' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureText: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 8 },

  ctaBtn: { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  ctaBtnWhite: { backgroundColor: '#fff' },
  ctaBtnOutline: { borderWidth: 2, borderColor: COLORS.primary },
  ctaText: { fontSize: 15, fontWeight: '700' },
  ctaTextPrimary: { color: COLORS.primary },
  ctaTextOutline: { color: COLORS.primary },

  restoreBtn: { alignItems: 'center', marginTop: 8, padding: 8 },
  restoreText: { fontSize: 13, color: COLORS.textMuted, textDecorationLine: 'underline' },
  footer: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
});
