import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { CompanyProfile } from '../../types/api.types';
import apiClient from '../../api/apiClient';

export default function CompanyProfilesScreen() {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get<CompanyProfile[]>(API_ENDPOINTS.JOB_COMPANIES)
      .then(r => setCompanies(r.data))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter(c =>
    !search || c.company.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <FlatList
      data={filtered}
      keyExtractor={c => c.company}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search companies..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="business-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No companies found.</Text>
        </View>
      }
      renderItem={({ item: c }) => (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{c.company[0].toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.company}>{c.company}</Text>
            <Text style={styles.jobCount}>
              {c.jobCount} open job{c.jobCount !== 1 ? 's' : ''}
            </Text>
          </View>
          {c.avgSalary != null && (
            <Text style={styles.salary}>
              {c.avgSalary >= 100000
                ? `₹${Math.round(c.avgSalary / 100000)}L avg`
                : `₹${Math.round(c.avgSalary).toLocaleString('en-IN')} avg`}
            </Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  list: { padding: 14, gap: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  info: { flex: 1 },
  company: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  jobCount: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  salary: { fontSize: 13, fontWeight: '600', color: COLORS.secondary },
});
