import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { JobsStackParamList } from '../../navigation/types';
import { CompanyProfile } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<JobsStackParamList, 'CompanyProfiles'>;

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

function fmtSalary(n: number) {
  if (n >= 100000) return `₹${Math.round(n / 100000)}L`;
  return `₹${Math.round(n / 1000)}K`;
}

function SkeletonCard() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={[styles.card, { opacity, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
      <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: colors.border }} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 14, width: '55%', backgroundColor: colors.border, borderRadius: 6 }} />
        <View style={{ height: 11, width: '35%', backgroundColor: colors.border, borderRadius: 6 }} />
      </View>
      <View style={{ width: 60, height: 28, borderRadius: 10, backgroundColor: colors.border }} />
    </Animated.View>
  );
}

function CompanyCard({ item, onIntel }: { item: CompanyProfile; onIntel: () => void }) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const color = companyColor(item.company);
  const initial = item.company.charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={[styles.logo, { backgroundColor: color + '18', borderColor: color + '30' }]}>
        <Text style={[styles.logoText, { color }]}>{initial}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.companyName} numberOfLines={1}>{item.company}</Text>
        <View style={styles.metaRow}>
          <View style={styles.jobsBadge}>
            <Ionicons name="briefcase-outline" size={11} color={colors.primary} />
            <Text style={styles.jobsBadgeText}>
              {item.jobCount} {item.jobCount === 1 ? 'job' : 'jobs'}
            </Text>
          </View>
          {item.avgSalary != null && (
            <View style={styles.salaryBadge}>
              <Ionicons name="cash-outline" size={11} color="#059669" />
              <Text style={styles.salaryText}>{fmtSalary(item.avgSalary)} avg</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.intelBtn} onPress={onIntel} activeOpacity={0.8}>
        <Ionicons name="analytics-outline" size={14} color={colors.primary} />
        <Text style={styles.intelBtnText}>Intel</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CompanyProfilesScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get<CompanyProfile[]>(API_ENDPOINTS.JOB_COMPANIES)
      .then(r => setCompanies(r.data))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? companies.filter(c => c.company.toLowerCase().includes(search.toLowerCase()))
    : companies;

  const renderItem = useCallback(({ item }: { item: CompanyProfile }) => (
    <CompanyCard
      item={item}
      onIntel={() => navigation.navigate('CompanyIntel', { companyName: item.company })}
    />
  ), [navigation]);

  const keyExtractor = useCallback((c: CompanyProfile) => c.company, []);

  const ListHeader = (
    <>
      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={17} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search companies..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Stats bar */}
      {!loading && companies.length > 0 && (
        <View style={styles.statsBar}>
          <Ionicons name="business-outline" size={14} color={colors.primary} />
          <Text style={styles.statsText}>
            {filtered.length === companies.length
              ? `${companies.length} companies hiring`
              : `${filtered.length} of ${companies.length} companies`}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.screen}>
      {loading ? (
        <>
          <View style={{ padding: 14 }}>{ListHeader}</View>
          <View style={{ padding: 14, gap: 10 }}>
            {[1, 2, 3, 4, 5].map(k => <SkeletonCard key={k} />)}
          </View>
        </>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, filtered.length === 0 && { flex: 1 }]}
          ListHeaderComponent={ListHeader}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          removeClippedSubviews
          initialNumToRender={15}
          maxToRenderPerBatch={12}
          windowSize={8}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="business-outline" size={40} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {search ? 'No companies match' : 'No companies yet'}
              </Text>
              <Text style={styles.emptySub}>
                {search
                  ? `No results for "${search}". Try a different name.`
                  : 'Companies will appear here once jobs are listed.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 14, paddingBottom: 40 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },

  statsBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  statsText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  logo: {
    width: 52, height: 52, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { fontSize: 22, fontWeight: '900' },

  info: { flex: 1 },
  companyName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primaryLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  jobsBadgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  salaryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#D1FAE5', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  salaryText: { fontSize: 11, fontWeight: '600', color: '#065F46' },

  intelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  intelBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, marginTop: 20 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  });
}