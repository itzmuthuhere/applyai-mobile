import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import { Resume } from '../../types/api.types';

interface Props {
  resumes: Resume[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading?: boolean;
  placeholder?: string;
}

export default function ResumeDropdown({
  resumes,
  selectedId,
  onSelect,
  loading = false,
  placeholder = 'Select a resume…',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = resumes.find((r) => r.id === selectedId);

  const decodeName = (name: string) => {
    try { return decodeURIComponent(name); } catch { return name; }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return resumes;
    const q = query.toLowerCase();
    return resumes.filter((r) => decodeName(r.versionName).toLowerCase().includes(q));
  }, [resumes, query]);

  const scoreColor = (score: number | null) => {
    if (score === null) return COLORS.textMuted;
    if (score >= 75) return COLORS.success;
    if (score >= 50) return COLORS.warning;
    return COLORS.error;
  };

  const scoreBg = (score: number | null) => {
    if (score === null) return '#F1F5F9';
    if (score >= 75) return '#D1FAE5';
    if (score >= 50) return '#FEF3C7';
    return '#FEE2E2';
  };

  if (loading) {
    return (
      <View style={styles.trigger}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.triggerPlaceholder}>Loading resumes…</Text>
      </View>
    );
  }

  if (resumes.length === 0) {
    return (
      <View style={[styles.trigger, styles.triggerEmpty]}>
        <Ionicons name="document-outline" size={18} color={COLORS.textMuted} />
        <Text style={styles.triggerPlaceholder}>No analyzed resumes found</Text>
      </View>
    );
  }

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
        <View style={styles.triggerContent}>
          {selected ? (
            <>
              <Text style={styles.triggerSelected} numberOfLines={1}>
                {decodeName(selected.versionName)}
              </Text>
              {selected.aiScore !== null && (
                <View style={[styles.scorePill, { backgroundColor: scoreBg(selected.aiScore) }]}>
                  <Text style={[styles.scorePillText, { color: scoreColor(selected.aiScore) }]}>
                    {selected.aiScore}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.triggerPlaceholder}>{placeholder}</Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      {/* Modal dropdown */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Resume</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search resumes…"
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(r) => String(r.id)}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => {
                    onSelect(item.id);
                    setQuery('');
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemIconWrap}>
                    <Ionicons
                      name={item.isOriginal ? 'document-text' : 'color-wand'}
                      size={18}
                      color={isSelected ? COLORS.primary : COLORS.textSecondary}
                    />
                  </View>
                  <View style={styles.itemContent}>
                    <Text
                      style={[styles.itemName, isSelected && styles.itemNameSelected]}
                      numberOfLines={2}
                    >
                      {decodeName(item.versionName)}
                    </Text>
                    <View style={styles.itemMeta}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>
                          {item.isOriginal ? 'Original' : 'Tailored'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {item.aiScore !== null && (
                    <View style={[styles.scoreBadge, { backgroundColor: scoreBg(item.aiScore) }]}>
                      <Text style={[styles.scoreBadgeText, { color: scoreColor(item.aiScore) }]}>
                        {item.aiScore}
                      </Text>
                    </View>
                  )}
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptySearch}>
                <Text style={styles.emptySearchText}>No resumes match "{query}"</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerEmpty: { borderStyle: 'dashed' },
  triggerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  triggerSelected: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  triggerPlaceholder: { flex: 1, fontSize: 14, color: COLORS.textMuted },
  scorePill: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  scorePillText: { fontSize: 12, fontWeight: '700' },

  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 14,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, padding: 0 },

  list: { flexGrow: 0 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemSelected: { backgroundColor: COLORS.primaryLight },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  itemNameSelected: { color: COLORS.primary },
  itemMeta: { flexDirection: 'row', gap: 6 },
  typeBadge: {
    backgroundColor: COLORS.background,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBadgeText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  scoreBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeText: { fontSize: 12, fontWeight: '700' },

  emptySearch: { padding: 24, alignItems: 'center' },
  emptySearchText: { fontSize: 14, color: COLORS.textMuted },
});
