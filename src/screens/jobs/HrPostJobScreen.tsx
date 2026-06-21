import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, API_ENDPOINTS } from '../../constants';
import apiClient from '../../api/apiClient';

const CATEGORIES = [
  'Technology', 'Finance', 'Marketing', 'Sales', 'Design',
  'Operations', 'Human Resources', 'Legal', 'Healthcare', 'Education',
];

function fmt(n: number) {
  if (n >= 100_000) return `₹${Math.round(n / 100_000)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const SALARY_STEPS = [
  300_000, 500_000, 800_000, 1_000_000, 1_200_000, 1_500_000,
  2_000_000, 3_000_000, 5_000_000, 8_000_000, 10_000_000,
];

export default function HrPostJobScreen() {
  const navigation = useNavigation<any>();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [salaryMin, setSalaryMin] = useState<number | null>(null);
  const [salaryMax, setSalaryMax] = useState<number | null>(null);
  const [isRemote, setIsRemote] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState('');
  const [posting, setPosting] = useState(false);

  async function handlePost() {
    if (!title.trim()) { Alert.alert('Required', 'Job title is required.'); return; }
    if (!company.trim()) { Alert.alert('Required', 'Company name is required.'); return; }
    if (!description.trim()) { Alert.alert('Required', 'Job description is required.'); return; }
    if (description.trim().length < 50) {
      Alert.alert('Too short', 'Please provide a detailed job description (min 50 characters).'); return;
    }

    setPosting(true);
    try {
      await apiClient.post(API_ENDPOINTS.HR_POST_JOB, {
        title: title.trim(),
        company: company.trim(),
        location: location.trim() || undefined,
        description: description.trim(),
        category: category || undefined,
        salaryMin: salaryMin ?? undefined,
        salaryMax: salaryMax ?? undefined,
        isRemote,
        deadline: deadline.trim() || undefined,
        tags: tags.trim() || undefined,
      });
      Alert.alert(
        'Job Posted! 🎉',
        'Your job is now live and visible to candidates on ApplyAI.',
        [{ text: 'View My Jobs', onPress: () => navigation.navigate('HrMyJobs') }],
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to post job. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <TouchableOpacity
          style={[styles.postBtn, posting && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={posting}
        >
          {posting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.postBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <LabeledInput
            label="Job Title *"
            placeholder="e.g. Senior Java Developer"
            value={title}
            onChangeText={setTitle}
          />
          <LabeledInput
            label="Company *"
            placeholder="e.g. Tech Corp Pvt. Ltd."
            value={company}
            onChangeText={setCompany}
          />
          <LabeledInput
            label="Location"
            placeholder="e.g. Bengaluru, Karnataka"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description *</Text>
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the role, responsibilities, requirements, and benefits. Be specific to attract the right candidates."
            placeholderTextColor={COLORS.textMuted}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length} characters</Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(category === cat ? '' : cat)}
              >
                <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Compensation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compensation</Text>

          <Text style={styles.subLabel}>Minimum Salary</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.salaryRow}>
            {SALARY_STEPS.slice(0, 8).map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.salaryChip, salaryMin === v && styles.salaryChipActive]}
                onPress={() => setSalaryMin(salaryMin === v ? null : v)}
              >
                <Text style={[styles.salaryChipText, salaryMin === v && styles.salaryChipTextActive]}>
                  {fmt(v)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.subLabel, { marginTop: 10 }]}>Maximum Salary</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.salaryRow}>
            {SALARY_STEPS.slice(2).map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.salaryChip, salaryMax === v && styles.salaryChipActive]}
                onPress={() => setSalaryMax(salaryMax === v ? null : v)}
              >
                <Text style={[styles.salaryChipText, salaryMax === v && styles.salaryChipTextActive]}>
                  {fmt(v)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {salaryMin && salaryMax && (
            <View style={styles.salaryPreview}>
              <Ionicons name="cash-outline" size={14} color={COLORS.success} />
              <Text style={styles.salaryPreviewText}>
                {fmt(salaryMin)} – {fmt(salaryMax)} per year
              </Text>
            </View>
          )}
        </View>

        {/* Remote + Deadline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Mode & Deadline</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Ionicons name="wifi-outline" size={18} color={isRemote ? '#059669' : COLORS.textSecondary} />
              <View>
                <Text style={styles.toggleLabel}>Remote Position</Text>
                <Text style={styles.toggleSub}>Candidates can work from anywhere</Text>
              </View>
            </View>
            <Switch
              value={isRemote}
              onValueChange={setIsRemote}
              trackColor={{ false: COLORS.border, true: '#059669' }}
              thumbColor="#fff"
            />
          </View>

          <LabeledInput
            label="Application Deadline (YYYY-MM-DD)"
            placeholder="e.g. 2026-07-31"
            value={deadline}
            onChangeText={setDeadline}
          />
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <LabeledInput
            label="Tags (optional)"
            placeholder="e.g. java, spring-boot, microservices"
            value={tags}
            onChangeText={setTags}
          />
          <Text style={styles.tagsHint}>Separate with commas. Helps candidates find your job.</Text>
        </View>

        {/* Post button */}
        <TouchableOpacity
          style={[styles.bigPostBtn, posting && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={posting}
        >
          {posting
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.bigPostBtnText}>Post Job Now</Text>
              </>
          }
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LabeledInput({ label, placeholder, value, onChangeText }: {
  label: string; placeholder: string; value: string; onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  postBtn: {
    backgroundColor: '#059669', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 8, minWidth: 60, alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  scroll: { padding: 16, gap: 4 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  subLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },

  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },

  descInput: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 14,
    fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
    minHeight: 160,
  },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  catChipTextActive: { color: '#fff', fontWeight: '600' },

  salaryRow: { marginBottom: 4 },
  salaryChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  salaryChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  salaryChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  salaryChipTextActive: { color: '#fff', fontWeight: '600' },
  salaryPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#D1FAE5', borderRadius: 8,
  },
  salaryPreviewText: { fontSize: 13, fontWeight: '600', color: '#065F46' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  toggleSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  tagsHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  bigPostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#059669', borderRadius: 14, paddingVertical: 16, marginTop: 8,
  },
  bigPostBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
