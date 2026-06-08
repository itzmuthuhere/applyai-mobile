import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useDispatch } from 'react-redux';
import { COLORS, API_ENDPOINTS } from '../../constants';
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

export default function ResumeUploadScreen() {
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
      setError('File must be under 5 MB.');
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
        createdAt: new Date().toISOString(),
      };
      dispatch(addResume(newResume));
      navigation.goBack();
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

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Upload Resume</Text>
      <Text style={styles.subtitle}>PDF or DOCX · Max 5 MB</Text>

      <TouchableOpacity
        style={[styles.dropZone, selectedFile && styles.dropZoneSelected]}
        activeOpacity={0.7}
        onPress={pickFile}
        disabled={isUploading}
      >
        {selectedFile ? (
          <View style={styles.filePreview}>
            <View style={styles.fileIconWrap}>
              <Ionicons name="document-text" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={2}>{selectedFile.name}</Text>
              {selectedFile.size !== undefined && (
                <Text style={styles.fileSize}>{formatSize(selectedFile.size)}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={pickFile}
              disabled={isUploading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="swap-horizontal" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.dropPrompt}>
            <View style={styles.uploadIconWrap}>
              <Ionicons name="cloud-upload-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.dropTitle}>Tap to select a file</Text>
            <Text style={styles.dropHint}>PDF or DOCX, max 5 MB</Text>
          </View>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isUploading && (
        <View style={styles.uploadingBox}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isUploading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, (!selectedFile || isUploading) && styles.uploadButtonDisabled]}
          onPress={upload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, flexGrow: 1 },

  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 28 },

  dropZone: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginBottom: 20,
  },
  dropZoneSelected: {
    borderColor: COLORS.primary,
    borderStyle: 'solid',
    backgroundColor: COLORS.primaryLight,
  },

  dropPrompt: { alignItems: 'center', gap: 8 },
  uploadIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dropTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  dropHint: { fontSize: 13, color: COLORS.textSecondary },

  filePreview: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12 },
  fileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  fileSize: { fontSize: 12, color: COLORS.textSecondary },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.error },

  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadingText: { fontSize: 14, color: COLORS.textSecondary },

  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },

  uploadButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  uploadButtonDisabled: { backgroundColor: COLORS.textMuted },
  uploadButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
