import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
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

const SECTION_ICONS: Record<string, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string }> = {
  basic: { icon: 'briefcase-outline', color: '#2563EB', bg: '#DBEAFE' },
  desc: { icon: 'document-text-outline', color: '#7C3AED', bg: '#F3E8FF' },
  category: { icon: 'grid-outline', color: '#059669', bg: '#D1FAE5' },
  salary: { icon: 'cash-outline', color: '#D97706', bg: '#FEF3C7' },
  mode: { icon: 'settings-outline', color: '#0891B2', bg: '#E0F2FE' },
  tags: { icon: 'pricetag-outline', color: '#C026D3', bg: '#FAE8FF' },
};

export default function HrPostJobScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
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
        'Job Posted!',
        'Your job is now live and visible to candidates on ApplyAI.',
        [{ text: 'View My Jobs', onPress: () => navigation.navigate('HrMyJobs') }],
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to post job. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  const isReady = title.trim().length > 0 && company.trim().length > 0 && description.trim().length >= 50;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Sticky header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <TouchableOpacity
          style={[styles.headerPostBtn, (!isReady || posting) && styles.headerPostBtnDisabled]}
          onPress={handlePost}
          disabled={!isReady || posting}
        >
          {posting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.headerPostBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Hero tip */}
      <View style={styles.heroBanner}>
        <View style={styles.heroBannerIcon}>
          <Ionicons name="megaphone" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroBannerTitle}>Reach thousands of job seekers</Text>
          <Text style={styles.heroBannerSub}>Fill in the details below to go live instantly</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Basic Info */}
        <SectionCard icon="briefcase-outline" color={colors.primary} bg={colors.primaryLight} title="Basic Information">
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
        </SectionCard>

        {/* Description */}
        <SectionCard icon="document-text-outline" color="#7C3AED" bg="#F3E8FF" title="Job Description *">
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the role, responsibilities, requirements, and benefits. Be specific to attract the right candidates."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <View style={styles.descFooter}>
            <Text style={[
              styles.charCount,
              description.length >= 50 ? styles.charCountOk : styles.charCountWarn,
            ]}>
              {description.length} characters {description.length < 50 ? `(${50 - description.length} more needed)` : '✓'}
            </Text>
          </View>
        </SectionCard>

        {/* Category */}
        <SectionCard icon="grid-outline" color="#059669" bg="#D1FAE5" title="Category">
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(category === cat ? '' : cat)}
              >
                {category === cat && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
                <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SectionCard>

        {/* Compensation */}
        <SectionCard icon="cash-outline" color="#D97706" bg="#FEF3C7" title="Compensation">
          <Text style={styles.subLabel}>Minimum Salary</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.salaryScroll}>
            <View style={styles.salaryRow}>
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
            </View>
          </ScrollView>

          <Text style={[styles.subLabel, { marginTop: 12 }]}>Maximum Salary</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.salaryScroll}>
            <View style={styles.salaryRow}>
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
            </View>
          </ScrollView>

          {salaryMin && salaryMax && (
            <View style={styles.salaryPreview}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.salaryPreviewText}>
                {fmt(salaryMin)} – {fmt(salaryMax)} per year
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Work Mode & Deadline */}
        <SectionCard icon="settings-outline" color="#0891B2" bg="#E0F2FE" title="Work Mode & Deadline">
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, isRemote ? styles.toggleIconActive : styles.toggleIconInactive]}>
                <Ionicons name="wifi-outline" size={18} color={isRemote ? '#059669' : colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Remote Position</Text>
                <Text style={styles.toggleSub}>Candidates can work from anywhere</Text>
              </View>
            </View>
            <Switch
              value={isRemote}
              onValueChange={setIsRemote}
              trackColor={{ false: colors.border, true: '#059669' }}
              thumbColor="#fff"
            />
          </View>

          <LabeledInput
            label="Application Deadline (YYYY-MM-DD)"
            placeholder="e.g. 2026-07-31"
            value={deadline}
            onChangeText={setDeadline}
          />
        </SectionCard>

        {/* Tags */}
        <SectionCard icon="pricetag-outline" color="#C026D3" bg="#FAE8FF" title="Tags (optional)">
          <LabeledInput
            label="Keywords"
            placeholder="e.g. java, spring-boot, microservices"
            value={tags}
            onChangeText={setTags}
          />
          <View style={styles.tagsHintRow}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.tagsHint}>Separate with commas. Helps candidates find your job.</Text>
          </View>
        </SectionCard>

        {/* Big post button */}
        <TouchableOpacity
          style={[styles.bigPostBtn, (!isReady || posting) && styles.bigPostBtnDisabled]}
          onPress={handlePost}
          disabled={!isReady || posting}
        >
          {posting
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.bigPostBtnText}>Post Job Now</Text>
              </>
          }
        </TouchableOpacity>

        {!isReady && (
          <Text style={styles.postHint}>
            Fill in Title, Company, and Description (min 50 chars) to post.
          </Text>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({
  icon, color, bg, title, children,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string; bg: string; title: string;
  children: React.ReactNode;
}) {
  const colors = useTheme();
  const sectionStyles = makeSectionStyles(colors);
  return (
    <View style={sectionStyles.card}>
      <View style={sectionStyles.head}>
        <View style={[sectionStyles.iconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

function makeSectionStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    head: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: '#FAFBFC',
    },
    iconBox: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    body: { padding: 16, gap: 0 },
  });
}

function LabeledInput({ label, placeholder, value, onChangeText }: {
  label: string; placeholder: string; value: string; onChangeText: (t: string) => void;
}) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerPostBtn: {
    backgroundColor: colors.success, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 8, minWidth: 60, alignItems: 'center',
  },
  headerPostBtnDisabled: { opacity: 0.45 },
  headerPostBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Hero tip
  heroBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primaryLight, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.primary + '20',
  },
  heroBannerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
  },
  heroBannerTitle: { fontSize: 13, fontWeight: '700', color: colors.primary },
  heroBannerSub: { fontSize: 12, color: colors.primary + 'BB', marginTop: 1 },

  scroll: { padding: 16, gap: 14, paddingBottom: 40 },

  // Inputs
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.background, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },

  descInput: {
    backgroundColor: colors.background, borderRadius: 11, padding: 14,
    fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
    minHeight: 160,
  },
  descFooter: { alignItems: 'flex-end', marginTop: 6 },
  charCount: { fontSize: 11, fontWeight: '500' },
  charCountOk: { color: colors.success },
  charCountWarn: { color: colors.textMuted },

  subLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  catChipTextActive: { color: '#fff', fontWeight: '600' },

  salaryScroll: { marginHorizontal: -4 },
  salaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingBottom: 4 },
  salaryChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  salaryChipActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  salaryChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  salaryChipTextActive: { color: '#fff', fontWeight: '600' },
  salaryPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10,
    backgroundColor: '#D1FAE5', borderRadius: 10, padding: 12,
  },
  salaryPreviewText: { fontSize: 13, fontWeight: '700', color: '#065F46' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.background, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleIconActive: { backgroundColor: '#D1FAE5' },
  toggleIconInactive: { backgroundColor: '#F1F5F9' },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 1 },
  toggleSub: { fontSize: 12, color: colors.textSecondary },

  tagsHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  tagsHint: { fontSize: 11, color: colors.textMuted, flex: 1 },

  bigPostBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.success, borderRadius: 16, paddingVertical: 17,
    shadowColor: colors.success, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  bigPostBtnDisabled: { opacity: 0.5 },
  bigPostBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  postHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: -6 },
  });
}