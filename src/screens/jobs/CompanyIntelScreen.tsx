import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchCompanyIntel, clearCompanyIntel } from '../../store/intelligenceSlice';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { JobsStackParamList } from '../../navigation/types';
import WebPageContainer from '../../components/common/WebPageContainer';

type RouteProps = RouteProp<JobsStackParamList, 'CompanyIntel'>;

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: '#10B981',
  MEDIUM: '#F59E0B',
  HARD: '#EF4444',
};

export default function CompanyIntelScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { params } = useRoute<RouteProps>();
  const dispatch = useDispatch<AppDispatch>();
  const { companyIntelResult: data, loading, error } = useSelector((s: RootState) => s.intelligence);

  useEffect(() => {
    dispatch(fetchCompanyIntel({ companyName: params.companyName, jobTitle: params.jobTitle }));
    return () => { dispatch(clearCompanyIntel()); };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Researching {params.companyName}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!data) return null;

  const diffColor = DIFFICULTY_COLOR[data.interviewDifficulty] ?? colors.textSecondary;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WebPageContainer maxWidth={720} style={{ gap: 12 }}>
        {/* Header */}
        <View style={styles.headerCard}>
          {(() => {
            const color = companyColor(params.companyName);
            return (
              <View style={[styles.companyIcon, { backgroundColor: color + '18', borderColor: color + '30', borderWidth: 1 }]}>
                <Text style={[styles.companyInitial, { color }]}>
                  {params.companyName[0].toUpperCase()}
                </Text>
              </View>
            );
          })()}
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{data.companyName ?? params.companyName}</Text>
            <Text style={styles.overview}>{data.overview}</Text>
          </View>
        </View>

        {/* Rating + Salary row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <StarRating rating={data.glassdoorRating} />
            <Text style={styles.statLabel}>Glassdoor</Text>
          </View>
          <View style={[styles.statCard, { flex: 2 }]}>
            <Text style={styles.salaryRange}>{data.typicalSalaryRange}</Text>
            <Text style={styles.statLabel}>Typical salary</Text>
          </View>
        </View>

        {/* Tech Stack */}
        {data.techStack?.length > 0 && (
          <View style={styles.card}>
            <SectionTitle icon="code-slash-outline" title="Tech Stack" />
            <View style={styles.chips}>
              {data.techStack.map((tech: string, i: number) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{tech}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Interview */}
        <View style={styles.card}>
          <SectionTitle icon="mic-outline" title="Interview Process" />
          <View style={styles.difficultyRow}>
            <View style={[styles.difficultyBadge, { backgroundColor: diffColor + '20', borderColor: diffColor }]}>
              <Text style={[styles.difficultyText, { color: diffColor }]}>
                {data.interviewDifficulty}
              </Text>
            </View>
          </View>
          <Text style={styles.bodyText}>{data.interviewProcess}</Text>
        </View>

        {/* Work-Life Balance */}
        <View style={styles.card}>
          <SectionTitle icon="sunny-outline" title="Work-Life Balance" />
          <Text style={styles.bodyText}>{data.workLifeBalance}</Text>
        </View>

        {/* Recent News */}
        {data.recentNews?.length > 0 && (
          <View style={styles.card}>
            <SectionTitle icon="newspaper-outline" title="Recent News" />
            {data.recentNews.map((news: string, i: number) => (
              <Text key={i} style={styles.bulletItem}>• {news}</Text>
            ))}
          </View>
        )}

        {/* Red Flags */}
        {data.redFlags?.length > 0 && (
          <View style={[styles.card, styles.redCard]}>
            <SectionTitle icon="warning-outline" title="Red Flags" color={colors.error} />
            {data.redFlags.map((flag: string, i: number) => (
              <Text key={i} style={[styles.bulletItem, { color: colors.error }]}>• {flag}</Text>
            ))}
          </View>
        )}

        {/* Verdict */}
        <View style={[styles.card, styles.verdictCard]}>
          <SectionTitle icon="checkmark-circle-outline" title="Verdict" color={colors.success} />
          <Text style={[styles.bodyText, { color: colors.success, fontWeight: '600' }]}>{data.verdict}</Text>
        </View>
        </WebPageContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ icon, title, color = '#0F172A' }: { icon: keyof typeof Ionicons.glyphMap; title: string; color?: string }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= full ? 'star' : i === full + 1 && half ? 'star-half' : 'star-outline'}
          size={16}
          color={colors.warning}
        />
      ))}
      <Text style={styles.ratingNumber}>{rating?.toFixed(1)}</Text>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  errorText: { fontSize: 14, color: colors.error, textAlign: 'center' },

  headerCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
  },
  companyIcon: {
    width: 52, height: 52, borderRadius: 13,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  companyInitial: { fontSize: 22, fontWeight: '800', color: colors.primary },
  companyName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  overview: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 4,
  },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingNumber: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginLeft: 4 },
  salaryRange: { fontSize: 14, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  statLabel: { fontSize: 11, color: colors.textMuted },

  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  redCard: { borderColor: colors.error + '40' },
  verdictCard: { borderColor: colors.success + '40' },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  difficultyRow: { flexDirection: 'row' },
  difficultyBadge: {
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  difficultyText: { fontSize: 12, fontWeight: '700' },

  bodyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  bulletItem: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  });
}