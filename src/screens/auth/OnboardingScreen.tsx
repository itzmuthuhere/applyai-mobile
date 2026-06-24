import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ScrollView, SafeAreaView, Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    icon: 'briefcase' as const,
    iconColor: '#2563EB',
    iconBg: '#DBEAFE',
    title: 'Smart Job Matching',
    subtitle: 'AI finds jobs that match your resume with a precision match score — no more guessing.',
    stat: '3×',
    statLabel: 'more interviews',
  },
  {
    icon: 'document-text' as const,
    iconColor: '#7C3AED',
    iconBg: '#F3E8FF',
    title: 'AI Resume Scoring',
    subtitle: 'Get an instant ATS score, skill breakdown, and personalized tips to beat the competition.',
    stat: '89%',
    statLabel: 'ATS pass rate',
  },
  {
    icon: 'mic' as const,
    iconColor: '#059669',
    iconBg: '#D1FAE5',
    title: 'Mock Interview Coach',
    subtitle: 'Practice real questions, get AI feedback on every answer, and ace your interviews.',
    stat: '12K+',
    statLabel: 'users hired',
  },
];

const FEATURES = [
  { icon: 'sparkles-outline' as const, text: 'AI cover letters in 10 seconds' },
  { icon: 'analytics-outline' as const, text: 'Salary intelligence & negotiation' },
  { icon: 'color-wand-outline' as const, text: 'Auto-tailor resume for each job' },
  { icon: 'shield-checkmark-outline' as const, text: 'ATS optimization built-in' },
];

export default function OnboardingScreen({ navigation }: Props) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function goNext() {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setActiveIndex(next);
    } else {
      navigation.navigate('GoogleSignIn');
    }
  }

  function handleScroll(e: any) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  }

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip */}
      <View style={styles.topBar}>
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>ApplyAI</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('GoogleSignIn')} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.slider}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <View style={[styles.slideIconBox, { backgroundColor: slide.iconBg }]}>
              <Ionicons name={slide.icon} size={44} color={slide.iconColor} />
            </View>
            <View style={[styles.statPill, { backgroundColor: slide.iconBg }]}>
              <Text style={[styles.statNum, { color: slide.iconColor }]}>{slide.stat}</Text>
              <Text style={[styles.statLabel, { color: slide.iconColor }]}>{slide.statLabel}</Text>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      {/* Features strip */}
      <View style={styles.featuresCard}>
        <View style={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Ionicons name={f.icon} size={16} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity style={styles.ctaBtn} onPress={goNext} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>{isLast ? 'Get Started Free' : 'Next'}</Text>
          <Ionicons name={isLast ? 'arrow-forward-circle' : 'chevron-forward'} size={20} color="#FFF" />
        </TouchableOpacity>
        {isLast && (
          <Text style={styles.ctaDisclaimer}>No credit card required · Cancel anytime</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  topBadge: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  topBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  skipBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  skipBtnText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },

  slider: { flex: 1 },
  slide: {
    width,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  slideIconBox: {
    width: 110, height: 110, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statPill: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  statNum: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 14, fontWeight: '600' },
  slideTitle: {
    fontSize: 28, fontWeight: '900', color: colors.textPrimary, textAlign: 'center',
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 16, color: colors.textSecondary, textAlign: 'center',
    lineHeight: 24,
  },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 },
  dot: { height: 7, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: colors.primary },
  dotInactive: { width: 7, backgroundColor: colors.border },

  featuresCard: {
    marginHorizontal: 20, backgroundColor: colors.surface,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 14,
  },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureItem: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureIconBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: '500', lineHeight: 17 },

  ctaWrap: { paddingHorizontal: 20, paddingBottom: 24, gap: 10 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  ctaBtnText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  ctaDisclaimer: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  });
}