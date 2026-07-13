import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, TextInput, Modal, Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchBlacklist, addToBlacklist, removeFromBlacklist } from '../../store/blacklistSlice';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import WebPageContainer from '../../components/common/WebPageContainer';

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

const REASONS = ['REJECTED_ME', 'BAD_CULTURE', 'BAD_WLB', 'LOW_SALARY', 'MASS_LAYOFFS', 'OTHER'] as const;
const REASON_LABELS: Record<string, string> = {
  REJECTED_ME: 'Rejected me',
  BAD_CULTURE: 'Bad culture fit',
  BAD_WLB: 'Poor work-life balance',
  LOW_SALARY: 'Low salary',
  MASS_LAYOFFS: 'Mass layoffs',
  OTHER: 'Other reason',
};
const REASON_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  REJECTED_ME: 'close-circle-outline',
  BAD_CULTURE: 'people-outline',
  BAD_WLB: 'time-outline',
  LOW_SALARY: 'cash-outline',
  MASS_LAYOFFS: 'trending-down-outline',
  OTHER: 'ellipsis-horizontal-circle-outline',
};
const REASON_COLORS: Record<string, string> = {
  REJECTED_ME: '#EF4444',
  BAD_CULTURE: '#8B5CF6',
  BAD_WLB: '#F59E0B',
  LOW_SALARY: '#3B82F6',
  MASS_LAYOFFS: '#EF4444',
  OTHER: '#6B7280',
};

function SkeletonItem() {
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
    <Animated.View style={[styles.item, { opacity }]}>
      <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: colors.border }} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={{ height: 14, width: '55%', backgroundColor: colors.border, borderRadius: 6 }} />
        <View style={{ height: 11, width: '35%', backgroundColor: colors.border, borderRadius: 6 }} />
      </View>
    </Animated.View>
  );
}

export default function BlacklistScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((s: RootState) => s.blacklist);
  const [modalVisible, setModalVisible] = useState(false);
  const [company, setCompany] = useState('');
  const [reason, setReason] = useState<typeof REASONS[number]>('REJECTED_ME');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => { dispatch(fetchBlacklist()); }, [dispatch]);

  const handleAdd = async () => {
    if (!company.trim()) return;
    setAdding(true);
    try {
      await dispatch(addToBlacklist({ companyName: company.trim(), reason, notes: notes.trim() || undefined })).unwrap();
      setModalVisible(false);
      setCompany('');
      setNotes('');
      setReason('REJECTED_ME');
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (id: number, name: string) => {
    Alert.alert('Remove company?', `Remove ${name} from your blacklist?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch(removeFromBlacklist(id)) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.topBarIcon}>
            <Ionicons name="shield-half-outline" size={20} color={colors.error} />
          </View>
          <View>
            <Text style={styles.topTitle}>Blacklist</Text>
            <Text style={styles.topSub}>
              {items.length} compan{items.length !== 1 ? 'ies' : 'y'} blocked
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      {items.length === 0 && !loading ? null : (
        <View style={styles.infoBanner}>
          <Ionicons name="eye-off-outline" size={13} color={colors.textMuted} />
          <Text style={styles.infoText}>These companies are hidden from your job feed</Text>
        </View>
      )}

      {loading && items.length === 0 ? (
        <View style={{ padding: 14, gap: 10 }}>
          {[1, 2, 3].map(k => <SkeletonItem key={k} />)}
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="shield-checkmark-outline" size={40} color='#10B981' />
          </View>
          <Text style={styles.emptyTitle}>Clean slate</Text>
          <Text style={styles.emptySubtitle}>
            Add companies you never want to see in your job feed. They'll be hidden automatically.
          </Text>
          <TouchableOpacity style={styles.addBtnLarge} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.addBtnLargeText}>Add First Company</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <WebPageContainer maxWidth={720}>
          <View style={{ gap: 10 }}>
          {items.map((item) => {
            const color = companyColor(item.companyName);
            const rColor = REASON_COLORS[item.reason] ?? colors.textMuted;
            const rIcon = REASON_ICONS[item.reason] ?? 'ellipsis-horizontal-circle-outline';
            return (
              <View key={item.id} style={styles.item}>
                {/* Company icon */}
                <View style={[styles.companyIcon, { backgroundColor: color + '18', borderColor: color + '30' }]}>
                  <Text style={[styles.companyInitial, { color }]}>{item.companyName[0].toUpperCase()}</Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyName}>{item.companyName}</Text>
                  <View style={styles.reasonRow}>
                    <Ionicons name={rIcon} size={12} color={rColor} />
                    <Text style={[styles.reasonText, { color: rColor }]}>
                      {REASON_LABELS[item.reason] ?? item.reason}
                    </Text>
                  </View>
                  {item.notes ? (
                    <Text style={styles.notesText} numberOfLines={1}>{item.notes}</Text>
                  ) : null}
                </View>

                {/* Remove */}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(item.id, item.companyName)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            );
          })}
          </View>
          </WebPageContainer>
        </ScrollView>
      )}

      {/* Add modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Block a Company</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Company name */}
            <Text style={styles.fieldLabel}>Company Name *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="business-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Acme Corp"
                value={company}
                onChangeText={setCompany}
                placeholderTextColor={colors.textMuted}
                autoFocus
                returnKeyType="next"
              />
            </View>

            {/* Reason */}
            <Text style={styles.fieldLabel}>Reason</Text>
            <View style={styles.reasonGrid}>
              {REASONS.map((r) => {
                const active = reason === r;
                const rc = REASON_COLORS[r];
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonChip, active && { backgroundColor: rc + '15', borderColor: rc }]}
                    onPress={() => setReason(r)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={REASON_ICONS[r]} size={14} color={active ? rc : colors.textMuted} />
                    <Text style={[styles.reasonChipText, active && { color: rc, fontWeight: '700' }]}>
                      {REASON_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <View style={[styles.inputBox, { alignItems: 'flex-start', paddingTop: 12 }]}>
              <Ionicons name="create-outline" size={16} color={colors.textMuted} style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.modalInput, { height: 72 }]}
                placeholder="Any details you want to remember..."
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (!company.trim() || adding) && styles.submitBtnDisabled]}
              onPress={handleAdd}
              disabled={!company.trim() || adding}
            >
              {adding ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="shield-outline" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Block Company</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBarIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  topSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.error, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  infoText: { fontSize: 12, color: colors.textMuted },

  list: { padding: 14, gap: 10, paddingBottom: 40 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  companyIcon: {
    width: 46, height: 46, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  companyInitial: { fontSize: 19, fontWeight: '800' },
  companyName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reasonText: { fontSize: 12, fontWeight: '600' },
  notesText: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  removeBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
  addBtnLarge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.error, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
  },
  addBtnLargeText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  modalInput: { flex: 1, fontSize: 15, color: colors.textPrimary },

  reasonGrid: { gap: 8 },
  reasonChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: colors.border, borderRadius: 12,
    padding: 12, backgroundColor: colors.surface,
  },
  reasonChipText: { fontSize: 14, color: colors.textSecondary },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.error, borderRadius: 14, paddingVertical: 14, marginTop: 24,
    shadowColor: colors.error, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  });
}