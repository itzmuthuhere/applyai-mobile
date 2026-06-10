import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchSalaryIntel, clearSalary } from '../../store/intelligenceSlice';
import { COLORS } from '../../constants';

export default function SalaryIntelScreen() {
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Salary Intelligence</Text>
          <Text style={styles.subtitle}>Get real market data for any role in India</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Job Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Senior Java Engineer"
              value={role}
              onChangeText={setRole}
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bangalore"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.label}>Experience (years)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3"
              value={expYears}
              onChangeText={setExpYears}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity
              style={[styles.btn, (!role.trim() || loading) && styles.btnDisabled]}
              onPress={handleSearch}
              disabled={!role.trim() || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Get Salary Data</Text>}
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {salaryResult && (
            <View style={styles.card}>
              <Text style={styles.rangeText}>{salaryResult.salaryRange}</Text>
              <View style={styles.row}>
                <SalaryItem label="Min" value={formatLPA(salaryResult.minSalary)} />
                <SalaryItem label="Median" value={formatLPA(salaryResult.medianSalary)} color={COLORS.secondary} />
                <SalaryItem label="Max" value={formatLPA(salaryResult.maxSalary)} />
              </View>

              {salaryResult.insights?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Market Insights</Text>
                  {salaryResult.insights.map((ins: string, i: number) => (
                    <Text key={i} style={styles.bulletItem}>• {ins}</Text>
                  ))}
                </View>
              )}

              {salaryResult.topPayingCompanies?.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Top Paying Companies</Text>
                  <Text style={styles.chipRow}>{salaryResult.topPayingCompanies.join(' · ')}</Text>
                </View>
              )}

              <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SalaryItem({ label, value, color = COLORS.primary }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[{ fontSize: 20, fontWeight: '700', color }]}>{value}</Text>
      <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{label}</Text>
    </View>
  );
}

function formatLPA(n: number) {
  return `₹${(n / 100000).toFixed(1)}L`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: 12, fontSize: 15, color: COLORS.textPrimary,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 10, padding: 14,
    alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  rangeText: { fontSize: 22, fontWeight: '700', color: COLORS.primary, textAlign: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 12 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  bulletItem: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 3 },
  chipRow: { fontSize: 13, color: COLORS.textSecondary },
  clearBtn: { marginTop: 12, alignItems: 'center' },
  clearText: { color: COLORS.error, fontSize: 14 },
  errorText: { color: COLORS.error, fontSize: 14, marginBottom: 8 },
});
