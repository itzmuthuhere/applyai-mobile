import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface Plan {
  name: string;
  price: string;
  features: string[];
  highlighted: boolean;
  cta: string;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '₹0/month',
    features: ['10 applications/month', '2 mock interviews', 'Basic job feed', 'Resume parse + score'],
    highlighted: false,
    cta: 'Current Plan',
  },
  {
    name: 'Hunter',
    price: '₹299/month',
    features: ['100 applications/month', '10 mock interviews', 'Salary intelligence', 'Negotiation coach', 'Email follow-up'],
    highlighted: true,
    cta: 'Upgrade to Hunter',
  },
  {
    name: 'Pro',
    price: '₹599/month',
    features: ['Unlimited everything', 'Interview prep plans', 'Company intelligence', 'Priority support', 'Daily digest email'],
    highlighted: false,
    cta: 'Upgrade to Pro',
  },
];

export default function PaywallScreen() {
  const navigation = useNavigation<any>();
  const route = (navigation as any).route;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Unlock Full Access</Text>
        <Text style={styles.subtitle}>Choose the plan that fits your job search</Text>

        {PLANS.map((plan) => (
          <View key={plan.name} style={[styles.card, plan.highlighted && styles.highlightedCard]}>
            {plan.highlighted && (
              <View style={styles.popularBadge}><Text style={styles.popularText}>Most Popular</Text></View>
            )}
            <Text style={[styles.planName, plan.highlighted && styles.highlightedText]}>{plan.name}</Text>
            <Text style={[styles.planPrice, plan.highlighted && styles.highlightedText]}>{plan.price}</Text>
            <View style={styles.divider} />
            {plan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={plan.highlighted ? '#fff' : COLORS.secondary} />
                <Text style={[styles.featureText, plan.highlighted && styles.highlightedText]}>{f}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.ctaBtn, plan.highlighted ? styles.ctaBtnHighlighted : styles.ctaBtnOutline]}
              onPress={() => {
                if (plan.name !== 'Free') {
                  // RevenueCat integration — Day 20, held until launch
                  console.log('RevenueCat purchase:', plan.name);
                }
              }}
              disabled={plan.name === 'Free'}
            >
              <Text style={[styles.ctaText, plan.highlighted ? styles.ctaTextHighlighted : styles.ctaTextOutline]}>
                {plan.cta}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.footer}>Payments secured by RevenueCat · Cancel anytime</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  backBtn: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: 24 },
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
  planPrice: { fontSize: 16, color: COLORS.textSecondary, marginTop: 2 },
  highlightedText: { color: '#fff' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureText: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 8 },
  ctaBtn: { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  ctaBtnHighlighted: { backgroundColor: '#fff' },
  ctaBtnOutline: { borderWidth: 2, borderColor: COLORS.primary },
  ctaText: { fontSize: 15, fontWeight: '700' },
  ctaTextHighlighted: { color: COLORS.primary },
  ctaTextOutline: { color: COLORS.primary },
  footer: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, marginTop: 8, marginBottom: 24 },
});
