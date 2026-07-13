import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView,
  Alert, TextInput, ActivityIndicator, Image, Switch, Modal, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { setAuth, signOut } from '../../store/slices/authSlice';
import { toggleMode, setAccent } from '../../store/slices/themeSlice';
import { API_ENDPOINTS } from '../../constants';
import { FullProfile, Experience, Education, Certification, ProfileHint } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import { useTheme, useThemeSettings } from '../../theme/ThemeContext';
import { AppColors, AccentColor, ACCENT_PRESETS } from '../../theme/themes';
import WebPageContainer from '../../components/common/WebPageContainer';

// ─── Remote / Role options ────────────────────────────────────────────────────
const REMOTE_OPTIONS = [
  { label: 'Remote', value: 'REMOTE', icon: 'wifi-outline' },
  { label: 'Hybrid', value: 'HYBRID', icon: 'git-branch-outline' },
  { label: 'Onsite', value: 'ONSITE', icon: 'business-outline' },
  { label: 'Any',    value: 'ANY',    icon: 'globe-outline' },
] as const;

const SALARY_PRESETS = [
  { label: '₹5L',  value: 500_000 },  { label: '₹8L',  value: 800_000 },
  { label: '₹12L', value: 1_200_000 }, { label: '₹15L', value: 1_500_000 },
  { label: '₹20L', value: 2_000_000 }, { label: '₹30L', value: 3_000_000 },
  { label: '₹50L', value: 5_000_000 },
];

function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${Math.round(n / 100_000)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ─── Shared small components ──────────────────────────────────────────────────
function FieldInput({ label, value, onChange, placeholder, multiline, keyboardType, colors }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any; colors: AppColors;
}) {
  return (
    <View style={{ gap: 5 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>{label}</Text>
      <TextInput
        style={[{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.background }, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={colors.textMuted} multiline={multiline} keyboardType={keyboardType}
      />
    </View>
  );
}

function SectionCard({ title, icon, children, colors, completionStatus }: {
  title: string; icon: any; children: React.ReactNode; colors: AppColors;
  completionStatus?: 'done' | 'pending';
}) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Ionicons name={icon} size={17} color={colors.primary} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>{title}</Text>
        {completionStatus === 'done'    && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
        {completionStatus === 'pending' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F97316' }} />}
      </View>
      <View style={{ padding: 16, gap: 14 }}>{children}</View>
    </View>
  );
}

// ─── Experience modal ─────────────────────────────────────────────────────────
interface ExpForm { company: string; title: string; location: string; startMonth: string; startYear: string; endMonth: string; endYear: string; current: boolean; description: string; }
const emptyExp: ExpForm = { company: '', title: '', location: '', startMonth: '', startYear: '', endMonth: '', endYear: '', current: false, description: '' };

function ExperienceModal({ visible, initial, onClose, onSave, colors }: {
  visible: boolean; initial: ExpForm | null; onClose: () => void; onSave: (f: ExpForm) => void; colors: AppColors;
}) {
  const [f, setF] = useState<ExpForm>(initial ?? emptyExp);
  useEffect(() => { setF(initial ?? emptyExp); }, [initial]);
  const set = (k: keyof ExpForm) => (v: any) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 15, color: colors.textSecondary }}>Cancel</Text></TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Experience</Text>
          <TouchableOpacity onPress={() => onSave(f)}><Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary }}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
          <FieldInput label="Company *" value={f.company} onChange={set('company')} placeholder="Bank of America" colors={colors} />
          <FieldInput label="Title *" value={f.title} onChange={set('title')} placeholder="Senior Java Developer" colors={colors} />
          <FieldInput label="Location" value={f.location} onChange={set('location')} placeholder="Chennai, India" colors={colors} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><FieldInput label="Start Month" value={f.startMonth} onChange={set('startMonth')} placeholder="1" keyboardType="number-pad" colors={colors} /></View>
            <View style={{ flex: 1 }}><FieldInput label="Start Year *" value={f.startYear} onChange={set('startYear')} placeholder="2020" keyboardType="number-pad" colors={colors} /></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>I currently work here</Text>
            <Switch value={f.current} onValueChange={set('current')} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
          </View>
          {!f.current && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><FieldInput label="End Month" value={f.endMonth} onChange={set('endMonth')} placeholder="12" keyboardType="number-pad" colors={colors} /></View>
              <View style={{ flex: 1 }}><FieldInput label="End Year" value={f.endYear} onChange={set('endYear')} placeholder="2024" keyboardType="number-pad" colors={colors} /></View>
            </View>
          )}
          <FieldInput label="Description" value={f.description} onChange={set('description')} placeholder="Describe your role and achievements..." multiline colors={colors} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Education modal ──────────────────────────────────────────────────────────
interface EduForm { school: string; degree: string; fieldOfStudy: string; startYear: string; endYear: string; current: boolean; grade: string; description: string; }
const emptyEdu: EduForm = { school: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', current: false, grade: '', description: '' };

function EducationModal({ visible, initial, onClose, onSave, colors }: {
  visible: boolean; initial: EduForm | null; onClose: () => void; onSave: (f: EduForm) => void; colors: AppColors;
}) {
  const [f, setF] = useState<EduForm>(initial ?? emptyEdu);
  useEffect(() => { setF(initial ?? emptyEdu); }, [initial]);
  const set = (k: keyof EduForm) => (v: any) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 15, color: colors.textSecondary }}>Cancel</Text></TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Education</Text>
          <TouchableOpacity onPress={() => onSave(f)}><Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary }}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
          <FieldInput label="School *" value={f.school} onChange={set('school')} placeholder="Anna University" colors={colors} />
          <FieldInput label="Degree" value={f.degree} onChange={set('degree')} placeholder="B.E. / B.Tech / M.Tech" colors={colors} />
          <FieldInput label="Field of Study" value={f.fieldOfStudy} onChange={set('fieldOfStudy')} placeholder="Computer Science" colors={colors} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><FieldInput label="Start Year" value={f.startYear} onChange={set('startYear')} placeholder="2016" keyboardType="number-pad" colors={colors} /></View>
            <View style={{ flex: 1 }}><FieldInput label="End Year" value={f.endYear} onChange={set('endYear')} placeholder="2020" keyboardType="number-pad" colors={colors} /></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>Currently studying here</Text>
            <Switch value={f.current} onValueChange={set('current')} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
          </View>
          <FieldInput label="Grade / CGPA" value={f.grade} onChange={set('grade')} placeholder="8.5 / 10" colors={colors} />
          <FieldInput label="Description" value={f.description} onChange={set('description')} placeholder="Activities, achievements..." multiline colors={colors} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Certification modal ──────────────────────────────────────────────────────
interface CertForm { name: string; issuer: string; issueDate: string; expiryDate: string; credentialId: string; credentialUrl: string; }
const emptyCert: CertForm = { name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' };

function CertificationModal({ visible, initial, onClose, onSave, colors }: {
  visible: boolean; initial: CertForm | null; onClose: () => void; onSave: (f: CertForm) => void; colors: AppColors;
}) {
  const [f, setF] = useState<CertForm>(initial ?? emptyCert);
  useEffect(() => { setF(initial ?? emptyCert); }, [initial]);
  const set = (k: keyof CertForm) => (v: string) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface }}>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 15, color: colors.textSecondary }}>Cancel</Text></TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Certification</Text>
          <TouchableOpacity onPress={() => onSave(f)}><Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary }}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
          <FieldInput label="Certification Name *" value={f.name} onChange={set('name')} placeholder="AWS Certified Solutions Architect" colors={colors} />
          <FieldInput label="Issuing Organisation *" value={f.issuer} onChange={set('issuer')} placeholder="Amazon Web Services" colors={colors} />
          <FieldInput label="Issue Date (YYYY-MM-DD)" value={f.issueDate} onChange={set('issueDate')} placeholder="2024-01-15" colors={colors} />
          <FieldInput label="Expiry Date (YYYY-MM-DD)" value={f.expiryDate} onChange={set('expiryDate')} placeholder="2027-01-15 (leave blank if no expiry)" colors={colors} />
          <FieldInput label="Credential ID" value={f.credentialId} onChange={set('credentialId')} placeholder="ABC123XYZ" colors={colors} />
          <FieldInput label="Credential URL" value={f.credentialUrl} onChange={set('credentialUrl')} placeholder="https://..." colors={colors} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileSettingsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const storeUser = useSelector((s: RootState) => s.auth.user);
  const storeJwt = useSelector((s: RootState) => s.auth.jwt);
  const colors = useTheme();
  const { isDark, accent } = useThemeSettings();
  const styles = makeStyles(colors);

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Basic info
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  // Job prefs
  const [targetRole, setTargetRole] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [minSalary, setMinSalary] = useState<number | null>(null);
  const [remotePref, setRemotePref] = useState('');
  const [skills, setSkills] = useState('');
  const [isHr, setIsHr] = useState(false);
  // Social
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  // Extension form-fill fields
  const [currentCompany, setCurrentCompany] = useState('');
  const [workAuthorization, setWorkAuthorization] = useState('');

  // Experience modal
  const [expModalVisible, setExpModalVisible] = useState(false);
  const [editingExp, setEditingExp] = useState<{ id: number; form: ExpForm } | null>(null);
  // Education modal
  const [eduModalVisible, setEduModalVisible] = useState(false);
  const [editingEdu, setEditingEdu] = useState<{ id: number; form: EduForm } | null>(null);
  // Cert modal
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [editingCert, setEditingCert] = useState<{ id: number; form: CertForm } | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await apiClient.get<FullProfile>(API_ENDPOINTS.PROFILE);
      setProfile(data);
      setName(data.name ?? '');
      setHeadline(data.headline ?? '');
      setPhone(data.phone ?? '');
      setBio(data.bio ?? '');
      setCity(data.city ?? '');
      setCountry(data.country ?? '');
      setYearsExp(data.yearsOfExperience?.toString() ?? '');
      setTargetRole(data.targetRole ?? '');
      setTargetLocation(data.targetLocation ?? '');
      setMinSalary(data.minSalary ?? null);
      setRemotePref(data.remotePreference ?? '');
      setSkills(data.skills ?? '');
      setIsHr(data.role === 'HR');
      setLinkedinUrl(data.linkedinUrl ?? '');
      setGithubUrl(data.githubUrl ?? '');
      setPortfolioUrl(data.portfolioUrl ?? '');
      setTwitterUrl(data.twitterUrl ?? '');
      setCurrentCompany((data as any).currentCompany ?? '');
      setWorkAuthorization((data as any).workAuthorization ?? '');
    } catch { /* keep form defaults */ }
  }, []);

  useEffect(() => { loadProfile(); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await apiClient.put<FullProfile>(API_ENDPOINTS.PROFILE, {
        name: name.trim() || undefined,
        headline: headline.trim() || undefined,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        yearsOfExperience: yearsExp ? parseInt(yearsExp, 10) : undefined,
        targetRole: targetRole.trim() || undefined,
        targetLocation: targetLocation.trim() || undefined,
        minSalary: minSalary ?? undefined,
        remotePreference: remotePref || undefined,
        skills: skills.trim() || undefined,
        role: isHr ? 'HR' : 'JOBSEEKER',
        linkedinUrl: linkedinUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        currentCompany: currentCompany.trim() || undefined,
        workAuthorization: workAuthorization.trim() || undefined,
      });
      setProfile(data);
      if (storeJwt) dispatch(setAuth({ jwt: storeJwt, user: data }));
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? e?.response?.data?.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhoto() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo access to upload a profile picture.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: asset.fileName ?? 'profile.jpg', type: asset.mimeType ?? 'image/jpeg' } as any);
      const { data } = await apiClient.post<any>(API_ENDPOINTS.PROFILE_PICTURE_UPLOAD, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(prev => prev ? { ...prev, profilePicture: data.profilePicture } : prev);
      if (storeJwt) dispatch(setAuth({ jwt: storeJwt, user: data }));
      Alert.alert('Updated', 'Profile picture updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'Could not upload photo.');
    } finally { setUploadingPic(false); }
  }

  // ── Experience CRUD ────────────────────────────────────────────────────────
  function openAddExp() { setEditingExp(null); setExpModalVisible(true); }
  function openEditExp(exp: Experience) {
    setEditingExp({ id: exp.id, form: { company: exp.company, title: exp.title, location: exp.location ?? '', startMonth: exp.startMonth?.toString() ?? '', startYear: exp.startYear.toString(), endMonth: exp.endMonth?.toString() ?? '', endYear: exp.endYear?.toString() ?? '', current: exp.current, description: exp.description ?? '' } });
    setExpModalVisible(true);
  }
  async function handleSaveExp(f: ExpForm) {
    if (!f.company.trim() || !f.title.trim() || !f.startYear) { Alert.alert('Error', 'Company, title, and start year are required.'); return; }
    const body = { company: f.company.trim(), title: f.title.trim(), location: f.location.trim() || undefined, startMonth: f.startMonth ? parseInt(f.startMonth, 10) : undefined, startYear: parseInt(f.startYear, 10), endMonth: !f.current && f.endMonth ? parseInt(f.endMonth, 10) : undefined, endYear: !f.current && f.endYear ? parseInt(f.endYear, 10) : undefined, current: f.current, description: f.description.trim() || undefined };
    try {
      if (editingExp) {
        await apiClient.put(API_ENDPOINTS.PROFILE_EXPERIENCE_BY_ID(editingExp.id), body);
      } else {
        await apiClient.post(API_ENDPOINTS.PROFILE_EXPERIENCE, body);
      }
      setExpModalVisible(false);
      await loadProfile();
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.error ?? 'Could not save experience.'); }
  }
  async function handleDeleteExp(id: number) {
    Alert.alert('Delete', 'Remove this experience?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await apiClient.delete(API_ENDPOINTS.PROFILE_EXPERIENCE_BY_ID(id)); await loadProfile(); } catch { Alert.alert('Error', 'Could not delete.'); }
      }},
    ]);
  }

  // ── Education CRUD ─────────────────────────────────────────────────────────
  function openAddEdu() { setEditingEdu(null); setEduModalVisible(true); }
  function openEditEdu(edu: Education) {
    setEditingEdu({ id: edu.id, form: { school: edu.school, degree: edu.degree ?? '', fieldOfStudy: edu.fieldOfStudy ?? '', startYear: edu.startYear?.toString() ?? '', endYear: edu.endYear?.toString() ?? '', current: edu.current, grade: edu.grade ?? '', description: edu.description ?? '' } });
    setEduModalVisible(true);
  }
  async function handleSaveEdu(f: EduForm) {
    if (!f.school.trim()) { Alert.alert('Error', 'School name is required.'); return; }
    const body = { school: f.school.trim(), degree: f.degree.trim() || undefined, fieldOfStudy: f.fieldOfStudy.trim() || undefined, startYear: f.startYear ? parseInt(f.startYear, 10) : undefined, endYear: !f.current && f.endYear ? parseInt(f.endYear, 10) : undefined, current: f.current, grade: f.grade.trim() || undefined, description: f.description.trim() || undefined };
    try {
      if (editingEdu) { await apiClient.put(API_ENDPOINTS.PROFILE_EDUCATION_BY_ID(editingEdu.id), body); } else { await apiClient.post(API_ENDPOINTS.PROFILE_EDUCATION, body); }
      setEduModalVisible(false);
      await loadProfile();
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.error ?? 'Could not save education.'); }
  }
  async function handleDeleteEdu(id: number) {
    Alert.alert('Delete', 'Remove this education?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await apiClient.delete(API_ENDPOINTS.PROFILE_EDUCATION_BY_ID(id)); await loadProfile(); } catch { Alert.alert('Error', 'Could not delete.'); }
      }},
    ]);
  }

  // ── Certification CRUD ─────────────────────────────────────────────────────
  function openAddCert() { setEditingCert(null); setCertModalVisible(true); }
  function openEditCert(cert: Certification) {
    setEditingCert({ id: cert.id, form: { name: cert.name, issuer: cert.issuer, issueDate: cert.issueDate ?? '', expiryDate: cert.expiryDate ?? '', credentialId: cert.credentialId ?? '', credentialUrl: cert.credentialUrl ?? '' } });
    setCertModalVisible(true);
  }
  async function handleSaveCert(f: CertForm) {
    if (!f.name.trim() || !f.issuer.trim()) { Alert.alert('Error', 'Name and issuer are required.'); return; }
    const body = { name: f.name.trim(), issuer: f.issuer.trim(), issueDate: f.issueDate.trim() || undefined, expiryDate: f.expiryDate.trim() || undefined, credentialId: f.credentialId.trim() || undefined, credentialUrl: f.credentialUrl.trim() || undefined };
    try {
      if (editingCert) { await apiClient.put(API_ENDPOINTS.PROFILE_CERTIFICATION_BY_ID(editingCert.id), body); } else { await apiClient.post(API_ENDPOINTS.PROFILE_CERTIFICATIONS, body); }
      setCertModalVisible(false);
      await loadProfile();
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.error ?? 'Could not save certification.'); }
  }
  async function handleDeleteCert(id: number) {
    Alert.alert('Delete', 'Remove this certification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await apiClient.delete(API_ENDPOINTS.PROFILE_CERTIFICATION_BY_ID(id)); await loadProfile(); } catch { Alert.alert('Error', 'Could not delete.'); }
      }},
    ]);
  }

  const displayUser = profile ?? storeUser;
  const score = displayUser?.completenessScore ?? 0;
  const hints = (displayUser?.completenessHints as ProfileHint[] | undefined) ?? [];

  function sectionStatus(section: string): 'done' | 'pending' {
    return hints.some(h => h.section === section) ? 'pending' : 'done';
  }

  return (
    <SafeAreaView style={styles.container} testID="profile-settings-screen">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} testID="save-btn">
          {saving ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.headerAction}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <WebPageContainer maxWidth={720}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85} disabled={uploadingPic} testID="avatar-btn">
            <View style={styles.avatarWrap}>
              {displayUser?.profilePicture ? (
                <Image source={{ uri: displayUser.profilePicture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitial}>{(displayUser?.name ?? 'U').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={[styles.cameraBtn, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                {uploadingPic ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
              </View>
            </View>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>Tap to change photo</Text>
            <Text style={{ fontSize: 12, color: score >= 80 ? colors.success : colors.primary, fontWeight: '700' }}>Profile {score}% complete</Text>
          </View>
        </View>

        {/* Basic Info */}
        <SectionCard title="Basic Info" icon="person-outline" colors={colors} completionStatus={sectionStatus('BASIC')}>
          <FieldInput label="Full Name" value={name} onChange={setName} placeholder="Muthu Raja" colors={colors} />
          <FieldInput label="Headline" value={headline} onChange={setHeadline} placeholder="Senior Java Developer at Bank of America" colors={colors} />
          <FieldInput label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" colors={colors} />
          <FieldInput label="Bio" value={bio} onChange={setBio} placeholder="Brief professional summary..." multiline colors={colors} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><FieldInput label="City" value={city} onChange={setCity} placeholder="Chennai" colors={colors} /></View>
            <View style={{ flex: 1 }}><FieldInput label="Country" value={country} onChange={setCountry} placeholder="India" colors={colors} /></View>
          </View>
          <FieldInput label="Years of Experience" value={yearsExp} onChange={setYearsExp} placeholder="5" keyboardType="number-pad" colors={colors} />
        </SectionCard>

        {/* Experience */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="briefcase-outline" size={17} color={colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Experience</Text>
              {sectionStatus('EXPERIENCE') === 'done'    && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
              {sectionStatus('EXPERIENCE') === 'pending' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F97316' }} />}
            </View>
            <TouchableOpacity onPress={openAddExp} activeOpacity={0.7} testID="add-exp-btn">
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {(profile?.experience?.length ?? 0) === 0 ? (
            <TouchableOpacity onPress={openAddExp} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>+ Add work experience</Text>
            </TouchableOpacity>
          ) : profile!.experience.map((exp, i) => (
            <View key={exp.id} style={[{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }, i < profile!.experience.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{exp.title}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>{exp.company}</Text>
              </View>
              <TouchableOpacity onPress={() => openEditExp(exp)} style={{ padding: 6 }}>
                <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteExp(exp.id)} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Education */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="school-outline" size={17} color={colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Education</Text>
              {sectionStatus('EDUCATION') === 'done'    && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
              {sectionStatus('EDUCATION') === 'pending' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F97316' }} />}
            </View>
            <TouchableOpacity onPress={openAddEdu} activeOpacity={0.7} testID="add-edu-btn">
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {(profile?.education?.length ?? 0) === 0 ? (
            <TouchableOpacity onPress={openAddEdu} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>+ Add education</Text>
            </TouchableOpacity>
          ) : profile!.education.map((edu, i) => (
            <View key={edu.id} style={[{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }, i < profile!.education.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{edu.school}</Text>
                {edu.degree && <Text style={{ fontSize: 13, color: colors.textSecondary }}>{edu.degree}</Text>}
              </View>
              <TouchableOpacity onPress={() => openEditEdu(edu)} style={{ padding: 6 }}>
                <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteEdu(edu.id)} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Certifications */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="ribbon-outline" size={17} color={colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Certifications</Text>
              {sectionStatus('CERTIFICATIONS') === 'done'    && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
              {sectionStatus('CERTIFICATIONS') === 'pending' && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F97316' }} />}
            </View>
            <TouchableOpacity onPress={openAddCert} activeOpacity={0.7} testID="add-cert-btn">
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {(profile?.certifications?.length ?? 0) === 0 ? (
            <TouchableOpacity onPress={openAddCert} style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>+ Add certification</Text>
            </TouchableOpacity>
          ) : profile!.certifications.map((cert, i) => (
            <View key={cert.id} style={[{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }, i < profile!.certifications.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{cert.name}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>{cert.issuer}</Text>
              </View>
              <TouchableOpacity onPress={() => openEditCert(cert)} style={{ padding: 6 }}>
                <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteCert(cert.id)} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Skills */}
        <SectionCard title="Skills" icon="code-slash-outline" colors={colors} completionStatus={sectionStatus('SKILLS')}>
          <TextInput
            style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
            value={skills} onChangeText={setSkills}
            placeholder="Java, Spring Boot, React Native, PostgreSQL, Docker…"
            placeholderTextColor={colors.textMuted} multiline numberOfLines={3}
            testID="skills-input"
          />
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Separate skills with commas</Text>
        </SectionCard>

        {/* Job Preferences */}
        <SectionCard title="Job Preferences" icon="search-outline" colors={colors} completionStatus={sectionStatus('PREFERENCES')}>
          <FieldInput label="Target Role" value={targetRole} onChange={setTargetRole} placeholder="Senior Java Developer" colors={colors} />
          <FieldInput label="Target Location" value={targetLocation} onChange={setTargetLocation} placeholder="Bengaluru, Remote" colors={colors} />
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>Min. Salary: {minSalary ? fmt(minSalary) : '—'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SALARY_PRESETS.map(p => (
                  <TouchableOpacity key={p.value}
                    style={[styles.chip, minSalary === p.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setMinSalary(minSalary === p.value ? null : p.value)}>
                    <Text style={[styles.chipText, { color: minSalary === p.value ? '#fff' : colors.textSecondary }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>Work Mode</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {REMOTE_OPTIONS.map(opt => (
                <TouchableOpacity key={opt.value}
                  style={[styles.chip, remotePref === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setRemotePref(remotePref === opt.value ? '' : opt.value)}>
                  <Ionicons name={opt.icon as any} size={13} color={remotePref === opt.value ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.chipText, { color: remotePref === opt.value ? '#fff' : colors.textSecondary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SectionCard>

        {/* Social Links */}
        <SectionCard title="Social Links" icon="share-social-outline" colors={colors} completionStatus={sectionStatus('SOCIAL')}>
          <FieldInput label="LinkedIn URL" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/in/yourname" colors={colors} />
          <FieldInput label="GitHub URL" value={githubUrl} onChange={setGithubUrl} placeholder="https://github.com/yourname" colors={colors} />
          <FieldInput label="Portfolio URL" value={portfolioUrl} onChange={setPortfolioUrl} placeholder="https://yoursite.com" colors={colors} />
          <FieldInput label="Twitter / X URL" value={twitterUrl} onChange={setTwitterUrl} placeholder="https://twitter.com/yourhandle" colors={colors} />
        </SectionCard>

        {/* Extension Form Fill */}
        {(() => {
          const filled = [name, phone, headline, currentCompany, workAuthorization].filter(Boolean).length;
          const total = 5;
          const pct = Math.round((filled / total) * 100);
          const allGood = filled === total;
          return (
            <SectionCard title="Extension Auto-Fill" icon="flash-outline" colors={colors}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: allGood ? '#D1FAE5' : '#FEF9C3', borderRadius: 10, padding: 12, marginBottom: 4 }}>
                <Ionicons name={allGood ? 'checkmark-circle' : 'warning-outline'} size={20} color={allGood ? '#059669' : '#D97706'} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: allGood ? '#065F46' : '#92400E' }}>
                    {allGood ? 'Ready for auto-fill!' : `${filled}/${total} required fields complete`}
                  </Text>
                  <Text style={{ fontSize: 12, color: allGood ? '#065F46' : '#92400E', marginTop: 2 }}>
                    {allGood ? 'Chrome extension can auto-fill job applications.' : 'Complete all fields so the extension can fill forms for you.'}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: allGood ? '#059669' : '#D97706' }}>{pct}%</Text>
              </View>
              {[
                { label: 'Full Name', ok: !!name, hint: 'Add in Basic Info above' },
                { label: 'Phone Number', ok: !!phone, hint: 'Add in Basic Info above' },
                { label: 'Headline / Job Title', ok: !!headline, hint: 'Add in Basic Info above' },
                { label: 'Current Company', ok: !!currentCompany, hint: 'Fill below' },
                { label: 'Work Authorization', ok: !!workAuthorization, hint: 'Fill below' },
              ].map(item => (
                <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                  <Ionicons name={item.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={item.ok ? '#059669' : colors.textMuted} />
                  <Text style={{ fontSize: 13, color: item.ok ? colors.textPrimary : colors.textMuted, flex: 1 }}>{item.label}</Text>
                  {!item.ok && <Text style={{ fontSize: 11, color: colors.primary }}>{item.hint}</Text>}
                </View>
              ))}
              <FieldInput label="Current Company" value={currentCompany} onChange={setCurrentCompany} placeholder="Bank of America" colors={colors} />
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>Work Authorization</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {['Authorized to work', 'Need sponsorship', 'Citizen', 'PR / Resident'].map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.chip, workAuthorization === opt && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => setWorkAuthorization(workAuthorization === opt ? '' : opt)}
                    >
                      <Text style={[styles.chipText, { color: workAuthorization === opt ? '#fff' : colors.textSecondary }]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </SectionCard>
          );
        })()}

        {/* Account Type */}
        <SectionCard title="Account Type" icon="person-circle-outline" colors={colors}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: isHr ? '#059669' : colors.primary }}>
                {isHr ? 'HR / Recruiter' : 'Job Seeker'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                {isHr ? 'Post and manage job openings' : 'Browse and apply to jobs'}
              </Text>
            </View>
            <Switch value={isHr} onValueChange={setIsHr} trackColor={{ false: colors.border, true: '#059669' }} thumbColor="#fff" />
          </View>
        </SectionCard>

        {/* Appearance */}
        <SectionCard title="Appearance" icon="color-palette-outline" colors={colors}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>Change how ApplyAI looks</Text>
            </View>
            <Switch value={isDark} onValueChange={() => dispatch(toggleMode())} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 12 }}>Accent Color</Text>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              {(Object.entries(ACCENT_PRESETS) as [AccentColor, { label: string; primary: string }][]).map(([key, val]) => (
                <TouchableOpacity key={key}
                  style={[{ width: 34, height: 34, borderRadius: 17, backgroundColor: val.primary, alignItems: 'center', justifyContent: 'center' }, accent === key && { borderWidth: 3, borderColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }]}
                  onPress={() => dispatch(setAccent(key))} activeOpacity={0.8}>
                  {accent === key && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SectionCard>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => Alert.alert('Log Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log Out', style: 'destructive', onPress: () => dispatch(signOut()) }])} testID="signout-btn">
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textMuted }}>ApplyAI v1.0.0</Text>
        <View style={{ height: 20 }} />
        </WebPageContainer>
      </ScrollView>

      {/* Modals */}
      <ExperienceModal visible={expModalVisible} initial={editingExp?.form ?? null} onClose={() => setExpModalVisible(false)} onSave={handleSaveExp} colors={colors} />
      <EducationModal visible={eduModalVisible} initial={editingEdu?.form ?? null} onClose={() => setEduModalVisible(false)} onSave={handleSaveEdu} colors={colors} />
      <CertificationModal visible={certModalVisible} initial={editingCert?.form ?? null} onClose={() => setCertModalVisible(false)} onSave={handleSaveCert} colors={colors} />
    </SafeAreaView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 16, gap: 14, paddingTop: 12 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    headerAction: { fontSize: 15, fontWeight: '700', color: colors.primary },
    avatarSection: { alignItems: 'center', gap: 10, paddingVertical: 8 },
    avatarWrap: { position: 'relative' },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.surface },
    avatarFallback: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface },
    avatarInitial: { color: '#fff', fontSize: 34, fontWeight: '800' },
    cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
    textArea: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 72, textAlignVertical: 'top' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
    chipText: { fontSize: 13, fontWeight: '500' },
    signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#FCA5A5' },
    signOutText: { fontSize: 15, fontWeight: '700' },
  });
}
