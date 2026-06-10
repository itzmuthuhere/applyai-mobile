import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchBlacklist, addToBlacklist, removeFromBlacklist } from '../../store/blacklistSlice';
import { COLORS } from '../../constants';

const REASONS = ['REJECTED_ME', 'BAD_CULTURE', 'BAD_WLB', 'LOW_SALARY', 'MASS_LAYOFFS', 'OTHER'];
const REASON_LABELS: Record<string, string> = {
  REJECTED_ME: 'Rejected me', BAD_CULTURE: 'Bad culture', BAD_WLB: 'Poor work-life balance',
  LOW_SALARY: 'Low salary', MASS_LAYOFFS: 'Mass layoffs', OTHER: 'Other',
};

export default function BlacklistScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((s: RootState) => s.blacklist);
  const [modalVisible, setModalVisible] = useState(false);
  const [company, setCompany] = useState('');
  const [reason, setReason] = useState('REJECTED_ME');
  const [notes, setNotes] = useState('');

  useEffect(() => { dispatch(fetchBlacklist()); }, [dispatch]);

  const handleAdd = () => {
    if (!company.trim()) return;
    dispatch(addToBlacklist({ companyName: company.trim(), reason, notes: notes.trim() || undefined }))
      .unwrap()
      .then(() => { setModalVisible(false); setCompany(''); setNotes(''); })
      .catch((e) => Alert.alert('Error', e));
  };

  const handleRemove = (id: number, name: string) => {
    Alert.alert('Remove from blacklist', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch(removeFromBlacklist(id)) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Company Blacklist</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>These companies are hidden from your job feed</Text>

      {loading && items.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No companies blacklisted</Text>
          <Text style={styles.emptySubtext}>Add companies you never want to see in your feed</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{item.companyName}</Text>
                <Text style={styles.reasonText}>{REASON_LABELS[item.reason] ?? item.reason}</Text>
                {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleRemove(item.id, item.companyName)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add to Blacklist</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Acme Corp" value={company}
              onChangeText={setCompany} placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Reason</Text>
            {REASONS.map((r) => (
              <TouchableOpacity key={r} style={[styles.reasonOption, reason === r && styles.reasonSelected]}
                onPress={() => setReason(r)}>
                <Text style={[styles.reasonOptionText, reason === r && styles.reasonSelectedText]}>
                  {REASON_LABELS[r]}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput style={[styles.input, { height: 80 }]} placeholder="Any additional notes…"
              value={notes} onChangeText={setNotes} multiline placeholderTextColor={COLORS.textMuted} />

            <TouchableOpacity
              style={[styles.btn, !company.trim() && styles.btnDisabled]}
              onPress={handleAdd} disabled={!company.trim()}>
              <Text style={styles.btnText}>Add to Blacklist</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 0 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, paddingHorizontal: 16, marginBottom: 8 },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 20, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  companyName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  reasonText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  notesText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  removeBtn: { padding: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12 },
  emptySubtext: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 6 },
  errorText: { color: COLORS.error, fontSize: 14, padding: 16 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 15, color: COLORS.textPrimary },
  reasonOption: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    padding: 12, marginBottom: 6,
  },
  reasonSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  reasonOptionText: { fontSize: 14, color: COLORS.textSecondary },
  reasonSelectedText: { color: COLORS.primary, fontWeight: '600' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 32 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
