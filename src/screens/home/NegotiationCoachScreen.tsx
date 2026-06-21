import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchNegotiationCoach, clearNegotiation } from '../../store/intelligenceSlice';
import { COLORS } from '../../constants';

const EXP_PRESETS = [
  { label: '0–2 yrs', value: '1' },
  { label: '3–5 yrs', value: '4' },
  { label: '6–9 yrs', value: '7' },
  { label: '10+ yrs', value: '12' },
];

function fmtINR(n: number) {
  if (!n) return '';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  return `₹${Math.round(n / 1000)}K`;
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function InputBox({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.inputBox}>
      <Ionicons name={icon} size={16} color={COLORS.textMuted} />
      {children}
    </View>
  );
}

export default function NegotiationCoachScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { negotiationResult: r, loading, error } = useSelector((s: RootState) => s.intelligence);

  const [offer, setOffer] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('Bangalore');
  const [expYears, setExpYears] = useState('');
  const [skills, setSkills] = useState('');

  const canSubmit = offer.trim() && role.trim() && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    dispatch(fetchNegotiationCoach({
      currentOffer: parseInt(offer),
      role: role.trim(),
      location: location.trim() || 'India',
      experienceYears: expYears ? parseInt(expYears) : undefined,
      skills: skills.trim() || undefined,
    }));
  };

  const offerNum = parseInt(offer) || 0;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="trending-up" size={26} color="#fff" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Negotiation Coach</Text>
              <Text style={styles.heroSub}>AI-powered counter-offer intelligence</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <FieldLabel label="Current Offer (₹/year) *" />
            <InputBox icon="cash-outline">
              <TextInput
                style={styles.input}
                placeholder="e.g. 1200000"
                value={offer}
                onChangeText={setOffer}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="next"
              />
              {offerNum > 0 && (
                <Text style={styles.offerFmt}>{fmtINR(offerNum)}</Text>
              )}
            </InputBox>

            <FieldLabel label="Job Role *" />
            <InputBox icon="briefcase-outline">
              <TextInput
                style={styles.input}
                placeholder="e.g. Senior Java Engineer"
                value={role}
                onChangeText={setRole}
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="next"
              />
            </InputBox>

            <FieldLabel label="Location" />
            <InputBox icon="location-outline">
              <TextInput
                style={styles.input}
                placeholder="e.g. Bangalore"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="next"
              />
            </InputBox>

            <FieldLabel label="Experience" />
            <View style={styles.expRow}>
              {EXP_PRESETS.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.expChip, expYears === p.value && styles.expChipActive]}
                  onPress={() => setExpYears(expYears === p.value ? '' : p.value)}
                >
                  <Text style={[styles.expText, expYears === p.value && styles.expTextActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <FieldLabel label="Key Skills (optional)" />
            <InputBox icon="code-slash-outline">
              <TextInput
                style={styles.input}
                placeholder="e.g. Java, Spring Boot, Kafka"
                value={skills}
                onChangeText={setSkills}
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="done"
              />
            </InputBox>

            <TouchableOpacity
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="trending-up-outline" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Get Negotiation Advice</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {r && !loading && (
            <>
              {/* Verdict + Counter Card */}
              <View style={styles.verdictCard}>
                <View style={styles.verdictHeader}>
                  <View style={styles.verdictIconBox}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verdictLabel}>AI Verdict</Text>
                    <Text style={styles.verdictText}>{r.verdict}</Text>
                  </View>
                  <TouchableOpacity onPress={() => dispatch(clearNegotiation())} style={styles.clearBtn}>
                    <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>

                <View style={styles.counterRow}>
                  <View style={styles.counterBox}>
                    <Text style={styles.counterMiniLabel}>Your Offer</Text>
                    <Text style={styles.counterCurrent}>{fmtINR(parseInt(offer) || 0)}</Text>
                  </View>
                  <View style={styles.arrowBox}>
                    <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <View style={styles.counterBox}>
                    <Text style={styles.counterMiniLabel}>Counter Range</Text>
                    <Text style={styles.counterAmount}>{r.counterOfferRange}</Text>
                  </View>
                </View>

                <View style={styles.marketPosRow}>
                  <Ionicons name="analytics-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.marketPosition}>{r.marketPosition}</Text>
                </View>
              </View>

              {/* Negotiation Script */}
              <View style={styles.card}>
                <View style={styles.sectionHead}>
                  <Ionicons name="chatbubble-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Negotiation Script</Text>
                </View>
                <View style={styles.scriptBox}>
                  <Text style={styles.scriptText}>{r.negotiationScript}</Text>
                </View>
              </View>

              {/* Talking Points */}
              {r.talkingPoints?.length > 0 && (
                <View style={styles.card}>
                  <View style={styles.sectionHead}>
                    <Ionicons name="list-outline" size={15} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Talking Points</Text>
                  </View>
                  {r.talkingPoints.map((p: string, i: number) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>{p}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Red Flags */}
              {r.redFlags?.length > 0 && (
                <View style={[styles.card, styles.redCard]}>
                  <View style={styles.sectionHead}>
                    <Ionicons name="warning-outline" size={15} color={COLORS.error} />
                    <Text style={[styles.sectionTitle, { color: COLORS.error }]}>Watch Out</Text>
                  </View>
                  {r.redFlags.map((f: string, i: number) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bullet, { backgroundColor: COLORS.error }]} />
                      <Text style={[styles.bulletText, { color: COLORS.error }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 14, gap: 12 },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#10B981', borderRadius: 18, padding: 18,
  },
  heroIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 2 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 8,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.background, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  offerFmt: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  expRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  expChip: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#F8FAFC',
  },
  expChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  expText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  expTextActive: { color: COLORS.primary, fontWeight: '700' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, marginTop: 4,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error },

  verdictCard: {
    backgroundColor: '#10B981', borderRadius: 20, padding: 20, gap: 16,
  },
  verdictHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  verdictIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  verdictLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  verdictText: { fontSize: 14, fontWeight: '700', color: '#fff', lineHeight: 20 },
  clearBtn: { padding: 6 },

  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  arrowBox: { alignItems: 'center', justifyContent: 'center' },
  counterMiniLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
  counterCurrent: { fontSize: 16, fontWeight: '700', color: '#fff' },
  counterAmount: { fontSize: 18, fontWeight: '900', color: '#fff' },

  marketPosRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  marketPosition: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  scriptBox: {
    backgroundColor: COLORS.background, borderRadius: 10, padding: 14,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  scriptText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, fontStyle: 'italic' },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },

  redCard: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
});
