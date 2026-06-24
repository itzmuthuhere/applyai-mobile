import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useDispatch } from 'react-redux';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { ResumeStackParamList } from '../../navigation/types';
import { addResume } from '../../store/slices/resumeSlice';
import { Resume, ResumeUploadResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type Nav = NativeStackNavigationProp<ResumeStackParamList, 'ResumeUpload'>;

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const TIPS = [
  { icon: 'checkmark-circle-outline' as const, text: 'Use clear section headings (Experience, Skills, Education)' },
  { icon: 'checkmark-circle-outline' as const, text: 'Include measurable achievements with numbers' },
  { icon: 'checkmark-circle-outline' as const, text: 'Tailor keywords to match job descriptions' },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeUploadScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ALLOWED_TYPES,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_SIZE_BYTES) {
      setError('File must be under 5 MB. Please compress or reduce the file size.');
      return;
    }
    setSelectedFile(asset);
  };

  const upload = async () => {
    if (!selectedFile) return;
    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', {
      uri: selectedFile.uri,
      name: selectedFile.name,
      type: selectedFile.mimeType || 'application/pdf',
    } as any);

    try {
      const res = await apiClient.post<ResumeUploadResponse>(
        API_ENDPOINTS.RESUME_UPLOAD,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const newResume: Resume = {
        id: res.data.resumeId,
        versionName: res.data.versionName,
        fileUrl: res.data.fileUrl,
        aiScore: null,
        isOriginal: true,
        isParsed: false,
        createdAt: new Date().toISOString(),
      };
      dispatch(addResume(newResume));
      navigation.navigate('ResumeList');
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const isPdf = selectedFile?.name?.toLowerCase().endsWith('.pdf');

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconBox}>
            <Ionicons name="cloud-upload" size={30} color="#fff" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Upload Resume</Text>
            <Text style={styles.heroSub}>PDF or DOCX · Max 5 MB · AI-powered analysis</Text>
          </View>
        </View>

        {/* Drop zone */}
        <TouchableOpacity
          style={[styles.dropZone, selectedFile ? styles.dropZoneActive : styles.dropZoneEmpty]}
          activeOpacity={0.75}
          onPress={pickFile}
          disabled={isUploading}
        >
          {selectedFile ? (
            <View style={styles.selectedFile}>
              <View style={[styles.fileTypeIcon, { backgroundColor: isPdf ? '#FEE2E2' : '#DBEAFE' }]}>
                <Ionicons
                  name="document-text"
                  size={28}
                  color={isPdf ? '#DC2626' : '#2563EB'}
                />
              </View>
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={2}>{selectedFile.name}</Text>
                <View style={styles.fileMeta}>
                  {selectedFile.size !== undefined && (
                    <Text style={styles.fileSize}>{formatSize(selectedFile.size)}</Text>
                  )}
                  <View style={styles.formatBadge}>
                    <Text style={styles.formatBadgeText}>
                      {isPdf ? 'PDF' : 'DOCX'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={pickFile}
                disabled={isUploading}
                style={styles.swapBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dropPrompt}>
              <View style={styles.uploadIconCircle}>
                <Ionicons name="cloud-upload-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.dropTitle}>Tap to select a file</Text>
              <Text style={styles.dropFormats}>PDF or DOCX • max 5 MB</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Tips */}
        {!selectedFile && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHead}>
              <Ionicons name="bulb-outline" size={14} color='#D97706' />
              <Text style={styles.tipsTitle}>Tips for a better resume score</Text>
            </View>
            {TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name={tip.icon} size={14} color={colors.primary} />
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI info */}
        {selectedFile && (
          <View style={styles.aiInfoCard}>
            <Ionicons name="sparkles-outline" size={16} color='#7C3AED' />
            <View style={{ flex: 1 }}>
              <Text style={styles.aiInfoTitle}>What happens after upload?</Text>
              <Text style={styles.aiInfoText}>
                AI parses your resume, scores it (0–100), and extracts skills + experience to match jobs automatically.
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={isUploading}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.uploadBtn, (!selectedFile || isUploading) && styles.uploadBtnDisabled]}
            onPress={upload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.uploadBtnText}>Uploading…</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.uploadBtnText}>Upload & Analyse</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 14, gap: 14 },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.primary, borderRadius: 18, padding: 18,
  },
  heroIconBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 3 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },

  dropZone: {
    borderRadius: 18, padding: 28, alignItems: 'center',
    borderWidth: 2, borderStyle: 'dashed',
  },
  dropZoneEmpty: {
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  dropZoneActive: {
    borderColor: colors.primary, borderStyle: 'solid',
    backgroundColor: colors.primaryLight,
  },

  dropPrompt: { alignItems: 'center', gap: 10 },
  uploadIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  dropTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  dropFormats: { fontSize: 13, color: colors.textMuted },

  selectedFile: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 14 },
  fileTypeIcon: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fileDetails: { flex: 1, gap: 6 },
  fileName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  fileMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileSize: { fontSize: 12, color: colors.textMuted },
  formatBadge: {
    backgroundColor: colors.primaryLight, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  formatBadgeText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  swapBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, color: colors.error },

  tipsCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 10,
  },
  tipsHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },

  aiInfoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#F5F3FF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#EDE9FE',
  },
  aiInfoTitle: { fontSize: 13, fontWeight: '700', color: '#5B21B6', marginBottom: 3 },
  aiInfoText: { fontSize: 13, color: '#6D28D9', lineHeight: 19 },

  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  uploadBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14, backgroundColor: colors.primary,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  uploadBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  uploadBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  });
}