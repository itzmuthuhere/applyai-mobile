import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants';

// Day 2: wire up @react-native-google-signin/google-signin + POST /api/auth/google
export default function GoogleSignInScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in to ApplyAI</Text>
      <Text style={styles.subtitle}>Google Sign-In coming in Day 2</Text>
      <TouchableOpacity style={styles.button} disabled>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 48,
  },
  button: {
    backgroundColor: COLORS.textMuted,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
