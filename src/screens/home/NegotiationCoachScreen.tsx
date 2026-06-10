import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchNegotiationCoach, clearNegotiation } from '../../store/intelligenceSlice';
import { COLORS } from '../../constants';

export default function NegotiationCoachScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { negotiationResult, loading, error } = useSelector((s: RootState) => s.intelligence);

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

  const r = negotiationResult;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Negotiation Coach</Text>
          <Text style={styles.subtitle}>Know your counter-offer before saying yes</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Current Offer (₹/year) *</Text>
            <TextInput style={styles.input} placeholder="e.g. 1200000" value={offer}
              onChangeText={setOffer} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.label}>Role *</Text>
            <TextInput style={styles.input} placeholder="e.g. Senior Java Engineer" value={role}
              onChangeText={setRole} placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.label}>Location</Text>
            <TextInput style={styles.input} placeholder="e.g. Bangalore" value={location}
              onChangeText={setLocation} placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.label}>Experience (years)</Text>
            <TextInput style={styles.input} placeholder="e.g. 3" value={expYears}
              onChangeText={setExpYears} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
            <Text style={styles.label}>Key Skills</Text>
            <TextInput style={styles.input} placeholder="e.g. Java, Spring Boot, Kafka" value={skills}
              onChangeText={setSkills} placeholderTextColor={COLORS.textMuted} />

            <TouchableOpacity style={[styles.btn, !canSubmit && styles.btnDisabled]} onPress={handleSubmit} disabled={!canSubmit}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Get Negotiation Advice</Text>}
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {r && (
            <>
              <View style={[styles.card, styles.verdictCard]}>
                <Text style={styles.verdictText}>{r.verdict}</Text>
                <Text style={styles.counterAmount}>{r.counterOfferRange}</Text>
                <Text style={styles.marketPosition}>{r.marketPosition}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Negotiation Script</Text>
                <Text style={styles.script}>{r.negotiationScript}</Text>
              </View>

              {r.talkingPoints?.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Talking Points</Text>
                  {r.talkingPoints.map((p: string, i: number) => (
                    <Text key={i} style={styles.bullet}>• {p}</Text>
                  ))}
                </View>
              )}

              {r.redFlags?.length > 0 && (
                <View style={[styles.card, styles.redFlagCard]}>
                  <Text style={styles.sectionTitle}>Red Flags</Text>
                  {r.redFlags.map((f: string, i: number) => (
                    <Text key={i} style={styles.redFlagText}>⚠ {f}</Text>
                  ))}
                </View>
              )}

              <TouchableOpacity onPress={() => dispatch(clearNegotiation())} style={styles.clearBtn}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  verdictCard: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  verdictText: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  counterAmount: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 4 },
  marketPosition: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: 12, fontSize: 15, color: COLORS.textPrimary,
  },
  btn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
  script: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, fontStyle: 'italic' },
  bullet: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  redFlagCard: { backgroundColor: '#FEF2F2', borderColor: COLORS.error },
  redFlagText: { fontSize: 13, color: COLORS.error, marginBottom: 4 },
  clearBtn: { alignItems: 'center', marginBottom: 16 },
  clearText: { color: COLORS.error, fontSize: 14 },
  errorText: { color: COLORS.error, fontSize: 14, marginBottom: 8 },
});
