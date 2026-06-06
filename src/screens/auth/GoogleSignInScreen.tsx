import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { signInWithGoogle, clearError } from '../../store/slices/authSlice';
import { COLORS } from '../../constants';

export default function GoogleSignInScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (error && error !== 'Sign-in cancelled') {
      Alert.alert('Sign-in failed', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) },
      ]);
    }
  }, [error]);

  const handleSignIn = () => {
    dispatch(signInWithGoogle());
  };

  return (
    <LinearGradient
      colors={['#EFF6FF', '#DBEAFE', '#BFDBFE']}
      style={styles.container}
    >
      {/* Logo / Hero */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>AI</Text>
        </View>
        <Text style={styles.appName}>ApplyAI</Text>
        <Text style={styles.tagline}>Land your dream job faster</Text>
      </View>

      {/* Feature highlights */}
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Ionicons name={f.icon} size={20} color={COLORS.primary} />
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* Sign-in button */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.textPrimary} size="small" />
          ) : (
            <>
              <View style={styles.googleIcon}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </LinearGradient>
  );
}

const FEATURES: { icon: any; text: string }[] = [
  { icon: 'document-text-outline', text: 'AI resume analysis & scoring' },
  { icon: 'briefcase-outline',     text: 'Smart job matching' },
  { icon: 'create-outline',        text: 'Tailored resumes & cover letters' },
  { icon: 'mic-outline',           text: 'Mock interview coaching' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  features: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  bottom: {
    gap: 16,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
