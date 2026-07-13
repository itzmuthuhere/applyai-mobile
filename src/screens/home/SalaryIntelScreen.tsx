import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchSalaryIntel, clearSalary } from '../../store/intelligenceSlice';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import WebPageContainer from '../../components/common/WebPageContainer';

const EXP_PRESETS = [
  { label: '0–2 yrs', value: '1' },
  { label: '3–5 yrs', value: '4' },
  { label: '6–9 yrs', value: '7' },
  { label: '10+ yrs', value: '12' },
];

const LOC_PRESETS = ['Bangalore', 'Hyderabad', 'Mumbai', 'Delhi', 'Pune', 'Chennai', 'Remote'];

function fmtLPA(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(n % 1_00_000 === 0 ? 0 : 1)}L`;
  return `₹${Math.round(n / 1000)}K`;
}

function SalaryBar({ min, median, max }: { min: number; median: number; max: number }) {
  const colors = useTheme();
  const barStyles = makeBarStyles(colors);
  const medianPct = ((median - min) / (max - min)) * 100;
  return (
    <View style={barStyles.wrap}>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: '100%' }]} />
        <View style={[barStyles.medianLine, { left: `${medianPct}%` as any }]} />
      </View>
      <View style={barStyles.labels}>
        <Text style={barStyles.label}>Min</Text>
        <Text style={barStyles.label}>Median</Text>
        <Text style={barStyles.label}>Max</Text>
      </View>
      <View style={barStyles.values}>
        <Text style={barStyles.valMin}>{fmtLPA(min)}</Text>
        <Text style={barStyles.valMedian}>{fmtLPA(median)}</Text>
        <Text style={barStyles.valMax}>{fmtLPA(max)}</Text>
      </View>
    </View>
  );
}

function makeBarStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { marginBottom: 4 },
    track: {
      height: 10, backgroundColor: '#DBEAFE', borderRadius: 5,
      overflow: 'hidden', marginBottom: 8, position: 'relative',
    },
    fill: { height: '100%', backgroundColor: colors.primary + '40', borderRadius: 5 },
    medianLine: {
      position: 'absolute', top: 0, bottom: 0,
      width: 3, backgroundColor: colors.primary, borderRadius: 2,
      transform: [{ translateX: -1.5 }],
    },
    labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    label: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
    values: { flexDirection: 'row', justifyContent: 'space-between' },
    valMin: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
    valMedian: { fontSize: 16, fontWeight: '900', color: colors.primary },
    valMax: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  });
}

export default function SalaryIntelScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const { salaryResult, loading, error } = useSelector((s: RootState) => s.intelligence);

  const [role, setRole] = useState('');
  const [location, setLocation] = useState('Bangalore');
  const [expYears, setExpYears] = useState('');

  const handleSearch = () => {
    if (!role.trim()) return;
    dispatch(fetchSalaryIntel({
      role: role.trim(),
      location: location.trim() || 'India',
      experienceYears: expYears ? parseInt(expYears) : undefined,
    }));
  };

  const handleClear = () => {
    dispatch(clearSalary());
    setRole('');
    setExpYears('');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <WebPageContainer maxWidth={720}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="cash" size={26} color="#fff" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Salary Intelligence</Text>
              <Text style={styles.heroSub}>AI-powered market data for any role in India</Text>
            </View>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.label}>Job Title *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="briefcase-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Senior Java Engineer"
                value={role}
                onChangeText={setRole}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
              />
            </View>

            <Text style={styles.label}>Location</Text>
            <View style={styles.inputBox}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Bangalore"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow} contentContainerStyle={{ gap: 6 }}>
              {LOC_PRESETS.map(loc => (
                <TouchableOpacity
                  key={loc}
                  style={[styles.presetChip, location === loc && styles.presetChipActive]}
                  onPress={() => setLocation(loc)}
                >
                  <Text style={[styles.presetText, location === loc && styles.presetTextActive]}>{loc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Experience</Text>
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

            <TouchableOpacity
              style={[styles.searchBtn, (!role.trim() || loading) && styles.searchBtnDisabled]}
              onPress={handleSearch}
              disabled={!role.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="analytics-outline" size={18} color="#fff" />
                  <Text style={styles.searchBtnText}>Get Salary Data</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {salaryResult && !loading && (
            <View style={styles.resultCard}>
              {/* Role header */}
              <View style={styles.resultHeader}>
                <View style={styles.resultIcon}>
                  <Ionicons name="cash-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>{salaryResult.role ?? role}</Text>
                  <Text style={styles.resultLoc}>{salaryResult.location ?? location}</Text>
                </View>
                <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Range text */}
              <Text style={styles.rangeText}>{salaryResult.salaryRange}</Text>

              {/* Salary bar */}
              <SalaryBar
                min={salaryResult.minSalary}
                median={salaryResult.medianSalary}
                max={salaryResult.maxSalary}
              />

              {/* Insights */}
              {salaryResult.insights?.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Market Insights</Text>
                  </View>
                  {salaryResult.insights.map((ins: string, i: number) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>{ins}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Top paying companies */}
              {salaryResult.topPayingCompanies?.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHead}>
                    <Ionicons name="trophy-outline" size={14} color='#D97706' />
                    <Text style={styles.sectionTitle}>Top Paying Companies</Text>
                  </View>
                  <View style={styles.companiesWrap}>
                    {salaryResult.topPayingCompanies.map((c: string, i: number) => (
                      <View key={i} style={styles.companyChip}>
                        <Text style={styles.companyChipText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 20 }} />
          </WebPageContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 14 },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F59E0B', borderRadius: 18, padding: 18, marginBottom: 14,
  },
  heroIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 2 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },

  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12, gap: 8,
  },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 15, color: colors.textPrimary },

  presetsRow: { marginTop: 2, marginBottom: 4 },
  presetChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#F8FAFC',
  },
  presetChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  presetTextActive: { color: '#fff', fontWeight: '700' },

  expRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  expChip: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#F8FAFC',
  },
  expChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  expText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  expTextActive: { color: colors.primary, fontWeight: '700' },

  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, marginTop: 4,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  searchBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  searchBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FECACA', marginBottom: 10,
  },
  errorText: { flex: 1, fontSize: 13, color: colors.error },

  resultCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 14,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  resultTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  resultLoc: { fontSize: 12, color: colors.textSecondary },
  clearBtn: { padding: 6 },
  rangeText: { fontSize: 17, fontWeight: '700', color: colors.primary, textAlign: 'center' },

  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },

  companiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  companyChip: {
    backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  companyChipText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  });
}