import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0.6)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.4)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo pop in
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      // Rings expand
      Animated.parallel([
        Animated.timing(ring1Scale, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 0.6, duration: 300, useNativeDriver: true }),
        Animated.timing(ring2Scale, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ]),
      // Text fade in
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(textTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Outer decorative ring */}
      <Animated.View style={[styles.ring2, { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] }]} />
      <Animated.View style={[styles.ring1, { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoBox, { opacity, transform: [{ scale }] }]}>
        <Ionicons name="briefcase" size={38} color="#fff" />
      </Animated.View>

      {/* App name + tagline */}
      <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}>
        <Text style={styles.appName}>ApplyAI</Text>
        <Text style={styles.tagline}>Your AI Job Search Co-Pilot</Text>
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footer}>Powered by Claude AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },

  ring2: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  ring1: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
  },

  logoBox: {
    width: 88, height: 88, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },

  textBlock: { alignItems: 'center', gap: 6 },
  appName: {
    fontSize: 42, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 14, color: 'rgba(255,255,255,0.7)',
    fontWeight: '500', letterSpacing: 0.3,
  },

  footer: {
    position: 'absolute', bottom: 48,
    fontSize: 12, color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
});
