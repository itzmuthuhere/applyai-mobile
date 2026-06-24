import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { signInWithGoogle, clearError } from '../../store/slices/authSlice';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';

const STATS = [
  { value: '12K+', label: 'Users hired' },
  { value: '3×', label: 'More interviews' },
  { value: '89%', label: 'ATS pass rate' },
];

const FEATURES = [
  { icon: 'analytics-outline' as const, color: '#2563EB', bg: '#DBEAFE', text: 'AI resume scoring & ATS optimization' },
  { icon: 'briefcase-outline' as const, color: '#059669', bg: '#D1FAE5', text: 'Smart job matching with match score' },
  { icon: 'color-wand-outline' as const, color: '#7C3AED', bg: '#EDE9FE', text: 'Tailored resumes & cover letters in 10s' },
  { icon: 'mic-outline' as const, color: '#D97706', bg: '#FEF3C7', text: 'AI mock interview coach with feedback' },
];

export default function GoogleSignInScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(contentTranslate, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (error && error !== 'Sign-in cancelled') {
      Alert.alert('Sign-in failed', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error]);

  return (
    <LinearGradient colors={['#EFF6FF', '#DBEAFE', '#BFDBFE']} style={styles.container}>

      {/* Logo */}
      <Animated.View style={[styles.logoSection, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.logoRingOuter}>
          <View style={styles.logoRingInner}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>AI</Text>
            </View>
          </View>
        </View>
        <Text style={styles.appName}>ApplyAI</Text>
        <Text style={styles.tagline}>Your AI-Powered Job Search Co-Pilot</Text>
      </Animated.View>

      <Animated.View style={[styles.body, { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] }]}>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Feature list */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIconBox, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={17} color={f.color} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Sign-in button */}
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={() => dispatch(signInWithGoogle())}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <>
              <View style={styles.googleIconBox}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Trust footer */}
        <View style={styles.trustRow}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.textMuted} />
          <Text style={styles.trustText}>Secured by Google · No spam · Cancel anytime</Text>
        </View>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },

  logoSection: { alignItems: 'center', gap: 12 },
  logoRingOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(37,99,235,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  logoRingInner: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: 'rgba(37,99,235,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoCircle: {
    width: 70, height: 70, borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  logoText: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  appName: {
    fontSize: 34, fontWeight: '900', color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14, color: colors.textSecondary, textAlign: 'center',
    fontWeight: '500', lineHeight: 20,
  },

  body: { gap: 14 },

  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },

  featuresCard: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureText: { flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '500', lineHeight: 18 },

  googleButton: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
  },
  googleButtonDisabled: { opacity: 0.7 },
  googleIconBox: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center',
  },
  googleG: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  googleButtonText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },

  trustRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  trustText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  disclaimer: {
    fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 17,
  },
  });
}