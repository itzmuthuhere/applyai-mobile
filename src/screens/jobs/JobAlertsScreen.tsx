import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
  TextInput, Modal, Alert, Switch, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { JobAlert } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import WebPageContainer from '../../components/common/WebPageContainer';

export default function JobAlertsScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [keywords, setKeywords] = useState('');
  const [remote, setRemote] = useState(false);
  const [minSalary, setMinSalary] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<JobAlert[]>(API_ENDPOINTS.JOB_ALERTS);
      setAlerts(data);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setKeywords(''); setRemote(false); setMinSalary(''); setCategory('');
  }

  async function handleCreate() {
    if (!keywords.trim() && !category.trim() && !minSalary && !remote) {
      Alert.alert('Add a filter', 'Set at least one — keywords, category, salary, or remote.');
      return;
    }
    setCreating(true);
    try {
      const { data } = await apiClient.post<JobAlert>(API_ENDPOINTS.JOB_ALERTS, {
        keywords: keywords.trim() || null,
        remote: remote || null,
        minSalary: minSalary ? parseInt(minSalary, 10) : null,
        category: category.trim() || null,
      });
      setAlerts(prev => [data, ...prev]);
      setShowForm(false);
      resetForm();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to create alert.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await apiClient.delete(API_ENDPOINTS.JOB_ALERT_BY_ID(id));
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {}
    setDeleting(null);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <>
      <WebPageContainer maxWidth={720}>
      <FlatList
        data={alerts}
        keyExtractor={a => String(a.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-outline" size={38} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyText}>Create an alert to get notified when matching jobs are posted.</Text>
          </View>
        }
        ListHeaderComponent={
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)} activeOpacity={0.85}>
              <Ionicons name="notifications-outline" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Create Job Alert</Text>
              <Ionicons name="add-circle" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
            {alerts.length > 0 && (
              <View style={styles.countBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={styles.countText}>{alerts.length} active alert{alerts.length !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item: alert }) => (
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons name="notifications" size={18} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              {alert.keywords ? (
                <Text style={styles.cardTitle}>"{alert.keywords}"</Text>
              ) : (
                <Text style={styles.cardTitle}>All matching jobs</Text>
              )}
              <View style={styles.chips}>
                {alert.remote && (
                  <View style={styles.chipGreen}><Text style={styles.chipGreenText}>Remote</Text></View>
                )}
                {alert.minSalary != null && (
                  <View style={styles.chipBlue}>
                    <Text style={styles.chipBlueText}>
                      {alert.minSalary >= 100000
                        ? `₹${Math.round(alert.minSalary / 100000)}L+`
                        : `₹${Math.round(alert.minSalary / 1000)}K+`}
                    </Text>
                  </View>
                )}
                {alert.category && (
                  <View style={styles.chipGray}><Text style={styles.chipGrayText}>{alert.category}</Text></View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(alert.id)}
              disabled={deleting === alert.id}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {deleting === alert.id
                ? <ActivityIndicator size="small" color={colors.error} />
                : <Ionicons name="trash-outline" size={17} color={colors.error} />
              }
            </TouchableOpacity>
          </View>
        )}
      />
      </WebPageContainer>

      <Modal visible={showForm} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Job Alert</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
              <Text style={styles.label}>Keywords</Text>
              <TextInput
                style={styles.input}
                placeholder="React Developer, Java, etc."
                value={keywords}
                onChangeText={setKeywords}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Engineering, Finance, etc."
                value={category}
                onChangeText={setCategory}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>Minimum Salary (₹/yr)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500000"
                value={minSalary}
                onChangeText={setMinSalary}
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Remote only</Text>
                <Switch
                  value={remote}
                  onValueChange={setRemote}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[styles.createBtn, creating && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={creating}
            >
              {creating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.createBtnText}>Save Alert</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  list: { padding: 14, gap: 10, backgroundColor: colors.background, flexGrow: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, marginBottom: 10,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 5,
  },
  addBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 10,
    alignSelf: 'flex-start',
  },
  countText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  empty: { alignItems: 'center', paddingTop: 50, gap: 12, paddingHorizontal: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipGreen: { backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipGreenText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  chipBlue: { backgroundColor: '#DBEAFE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipBlueText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  chipGray: { backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  chipGrayText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36, maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  formScroll: { maxHeight: 320 },
  formContent: { gap: 8, paddingBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 4 },
  input: {
    backgroundColor: colors.background, borderRadius: 10, padding: 12,
    fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  createBtn: {
    backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 12,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}