import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
  TextInput, Modal, Alert, Switch, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { JobAlert } from '../../types/api.types';
import apiClient from '../../api/apiClient';

export default function JobAlertsScreen() {
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
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <>
      <FlatList
        data={alerts}
        keyExtractor={a => String(a.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={52} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyText}>Get notified when matching jobs are posted.</Text>
          </View>
        }
        ListHeaderComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Create Alert</Text>
          </TouchableOpacity>
        }
        renderItem={({ item: alert }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Ionicons name="notifications" size={18} color={COLORS.primary} />
              <View style={styles.cardInfo}>
                {alert.keywords ? (
                  <Text style={styles.cardTitle}>"{alert.keywords}"</Text>
                ) : (
                  <Text style={styles.cardTitle}>All jobs</Text>
                )}
                <View style={styles.chips}>
                  {alert.remote && (
                    <View style={styles.chip}><Text style={styles.chipText}>Remote</Text></View>
                  )}
                  {alert.minSalary != null && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        {alert.minSalary >= 100000
                          ? `₹${Math.round(alert.minSalary / 100000)}L+`
                          : `₹${alert.minSalary.toLocaleString('en-IN')}+`}
                      </Text>
                    </View>
                  )}
                  {alert.category && (
                    <View style={styles.chip}><Text style={styles.chipText}>{alert.category}</Text></View>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(alert.id)}
              disabled={deleting === alert.id}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {deleting === alert.id
                ? <ActivityIndicator size="small" color={COLORS.error} />
                : <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              }
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showForm} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Job Alert</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
              <Text style={styles.label}>Keywords</Text>
              <TextInput
                style={styles.input}
                placeholder="React Developer, Java, etc."
                value={keywords}
                onChangeText={setKeywords}
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Engineering, Finance, etc."
                value={category}
                onChangeText={setCategory}
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.label}>Minimum Salary (₹/yr)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500000"
                value={minSalary}
                onChangeText={setMinSalary}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Remote only</Text>
                <Switch
                  value={remote}
                  onValueChange={setRemote}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  list: { padding: 14, gap: 10, backgroundColor: COLORS.background, flexGrow: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13, marginBottom: 6,
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardInfo: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: COLORS.background, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipText: { fontSize: 12, color: COLORS.textSecondary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 36, maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  formScroll: { maxHeight: 320 },
  formContent: { gap: 8, paddingBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4 },
  input: {
    backgroundColor: COLORS.background, borderRadius: 10, padding: 12,
    fontSize: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 12,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
