import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { API_ENDPOINTS } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { ApplicationsStackParamList } from '../../navigation/types';
import { decodeFileName } from '../../utils/decodeFileName';
import { RootState } from '../../store';
import {
  setSelectedApplication,
  updateApplication,
} from '../../store/slices/applicationSlice';
import { Application, ApplicationStatus } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<ApplicationsStackParamList, 'ApplicationDetail'>;
type Nav = NativeStackNavigationProp<ApplicationsStackParamList, 'ApplicationDetail'>;
// Cross-tab navigation (to InterviewTab) uses navigation as any
type AnyNav = any;

const STATUS_ORDER: ApplicationStatus[] = [
  'APPLIED',
  'VIEWED',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
];

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  VIEWED: 'Viewed',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string }> = {
  APPLIED: { bg: '#DBEAFE', text: '#1D4ED8' },
  VIEWED: { bg: '#F1F5F9', text: '#475569' },
  SHORTLISTED: { bg: '#FEF9C3', text: '#854D0E' },
  INTERVIEW: { bg: '#D1FAE5', text: '#065F46' },
  OFFER: { bg: '#D1FAE5', text: '#064E3B' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B' },
  WITHDRAWN: { bg: '#F1F5F9', text: '#94A3B8' },
};

const TERMINAL_STATUSES: ApplicationStatus[] = ['REJECTED', 'WITHDRAWN'];

const COMPANY_COLORS = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#C026D3', '#65A30D'];
const companyColor = (name: string) =>
  COMPANY_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COMPANY_COLORS.length];

const PROGRESS_STATUSES: ApplicationStatus[] = ['APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFER'];

function StatusTimeline({ current }: { current: ApplicationStatus }) {
  const colors = useTheme();
  const tlStyles = makeTlStyles(colors);
  const isTerminal = TERMINAL_STATUSES.includes(current);
  const currentIdx = PROGRESS_STATUSES.indexOf(current);
  return (
    <View style={tlStyles.wrap}>
      {PROGRESS_STATUSES.map((s, i) => {
        const done = !isTerminal && i <= currentIdx;
        const active = !isTerminal && i === currentIdx;
        const sc = STATUS_COLORS[s];
        return (
          <React.Fragment key={s}>
            <View style={tlStyles.step}>
              <View style={[
                tlStyles.dot,
                done && { backgroundColor: sc.bg, borderColor: sc.text },
                active && { borderWidth: 2.5 },
              ]}>
                {done && <View style={[tlStyles.inner, { backgroundColor: sc.text }]} />}
              </View>
              <Text style={[tlStyles.label, active && { color: sc.text, fontWeight: '700' }]}>
                {STATUS_LABELS[s]}
              </Text>
            </View>
            {i < PROGRESS_STATUSES.length - 1 && (
              <View style={[tlStyles.line, done && i < currentIdx && { backgroundColor: sc.text }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function makeTlStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 4 },
    step: { alignItems: 'center', gap: 5, flex: 0 },
    dot: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 1.5, borderColor: colors.border,
      backgroundColor: '#F1F5F9',
      alignItems: 'center', justifyContent: 'center',
    },
    inner: { width: 10, height: 10, borderRadius: 5 },
    label: { fontSize: 9, fontWeight: '500', color: colors.textMuted, textAlign: 'center', maxWidth: 52 },
    line: { flex: 1, height: 1.5, backgroundColor: colors.border, marginTop: 11, marginHorizontal: 2 },
  });
}

export default function ApplicationDetailScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const anyNav = useNavigation<AnyNav>();
  const dispatch = useDispatch();

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interview scheduling
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [savingInterview, setSavingInterview] = useState(false);

  // Offer tracking
  const [offerSalary, setOfferSalary] = useState('');
  const [offerDeadline, setOfferDeadline] = useState('');
  const [offerDetails, setOfferDetails] = useState('');
  const [savingOffer, setSavingOffer] = useState(false);

  useEffect(() => {
    loadApplication();
  }, []);

  async function loadApplication() {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Application>(
        API_ENDPOINTS.APPLICATION_BY_ID(params.applicationId)
      );
      setApplication(data);
      dispatch(setSelectedApplication(data));
      if (data.interviewDate) setInterviewDate(dayjs(data.interviewDate).format('YYYY-MM-DDTHH:mm'));
      if (data.interviewNotes) setInterviewNotes(data.interviewNotes);
      if (data.offerSalary) setOfferSalary(String(data.offerSalary));
      if (data.offerDeadline) setOfferDeadline(data.offerDeadline.split('T')[0]);
      if (data.offerDetails) setOfferDetails(data.offerDetails);
    } catch (e: any) {
      setError('Could not load application.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveInterview() {
    if (!application) return;
    if (!interviewDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      Alert.alert('Invalid date', 'Use format: YYYY-MM-DDTHH:mm (e.g. 2026-07-15T10:00)');
      return;
    }
    setSavingInterview(true);
    try {
      const { data } = await apiClient.patch<Application>(
        API_ENDPOINTS.APPLICATION_INTERVIEW(application.id),
        { interviewDate, notes: interviewNotes || null }
      );
      setApplication(data);
      dispatch(updateApplication(data));
      Alert.alert('Saved', 'Interview details updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save.');
    } finally {
      setSavingInterview(false);
    }
  }

  async function handleSaveOffer() {
    if (!application) return;
    setSavingOffer(true);
    try {
      const { data } = await apiClient.patch<Application>(
        API_ENDPOINTS.APPLICATION_OFFER(application.id),
        {
          offerSalary: offerSalary ? parseInt(offerSalary, 10) : null,
          offerDeadline: offerDeadline || null,
          offerDetails: offerDetails || null,
        }
      );
      setApplication(data);
      dispatch(updateApplication(data));
      Alert.alert('Saved', 'Offer details updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save.');
    } finally {
      setSavingOffer(false);
    }
  }

  async function handleStatusUpdate(newStatus: ApplicationStatus) {
    if (!application) return;
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const { data } = await apiClient.put<Application>(
        API_ENDPOINTS.APPLICATION_STATUS(application.id),
        { status: newStatus }
      );
      setApplication(data);
      dispatch(updateApplication(data));
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Status update failed.';
      Alert.alert('Error', msg);
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>{error ?? 'Application not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadApplication}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTerminal = TERMINAL_STATUSES.includes(application.status);

  const color = companyColor(application.job.company ?? 'A');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero banner */}
      <View style={[styles.heroBanner, { backgroundColor: color }]}>
        <View style={styles.heroBannerRow}>
          <View style={styles.heroIconBox}>
            <Text style={styles.heroInitial}>
              {application.job.company.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle} numberOfLines={2}>{application.job.title}</Text>
            <Text style={styles.heroCompany}>{application.job.company}</Text>
            {application.job.location ? (
              <View style={styles.heroLocationRow}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.75)" />
                <Text style={styles.heroLocation}>{application.job.location}</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.heroBadge, { backgroundColor: STATUS_COLORS[application.status].bg }]}>
            <Text style={[styles.heroBadgeText, { color: STATUS_COLORS[application.status].text }]}>
              {STATUS_LABELS[application.status]}
            </Text>
          </View>
        </View>
        {application.appliedAt && (
          <View style={styles.heroDateRow}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroDate}>Applied {dayjs(application.appliedAt).format('MMM D, YYYY')}</Text>
          </View>
        )}
      </View>

      {/* Status timeline card */}
      {!TERMINAL_STATUSES.includes(application.status) && (
        <View style={styles.timelineCard}>
          <StatusTimeline current={application.status} />
        </View>
      )}
      {TERMINAL_STATUSES.includes(application.status) && (
        <View style={[styles.terminalBanner, {
          backgroundColor: application.status === 'REJECTED' ? '#FEE2E2' : '#F1F5F9',
        }]}>
          <Ionicons
            name={application.status === 'REJECTED' ? 'close-circle-outline' : 'remove-circle-outline'}
            size={16}
            color={application.status === 'REJECTED' ? '#EF4444' : '#94A3B8'}
          />
          <Text style={[styles.terminalBannerText, {
            color: application.status === 'REJECTED' ? '#991B1B' : '#64748B',
          }]}>
            Application {STATUS_LABELS[application.status]}
          </Text>
        </View>
      )}

      {/* Status + dates */}
      <View style={styles.metaCard}>
        {application.lastUpdated && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Last updated</Text>
            <Text style={styles.metaValue}>
              {dayjs(application.lastUpdated).format('MMM D, YYYY')}
            </Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Resume sent</Text>
          <Text style={styles.metaValue}>{decodeFileName(application.resume.versionName)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Current status</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[application.status].bg }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLORS[application.status].text }]}>
              {STATUS_LABELS[application.status]}
            </Text>
          </View>
        </View>
      </View>

      {/* Cover letter */}
      {application.coverLetter && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionToggle}
            onPress={() => setShowCoverLetter((v) => !v)}
          >
            <Text style={styles.sectionTitle}>Cover Letter</Text>
            <Ionicons
              name={showCoverLetter ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {showCoverLetter && (
            <Text style={styles.coverLetterText} selectable>
              {application.coverLetter}
            </Text>
          )}
        </View>
      )}

      {/* Status picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        {isTerminal ? (
          <View style={styles.terminalNote}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
            <Text style={styles.terminalNoteText}>
              Status is {STATUS_LABELS[application.status]} — cannot be changed.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statusGrid}>
              {STATUS_ORDER.filter((s) => !TERMINAL_STATUSES.includes(s)).map((s) => {
                const active = s === application.status;
                const c = STATUS_COLORS[s];
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusChip,
                      active && { backgroundColor: c.bg, borderColor: c.text },
                    ]}
                    onPress={() => !active && handleStatusUpdate(s)}
                    disabled={active || isUpdating}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        active && { color: c.text, fontWeight: '700' },
                      ]}
                    >
                      {STATUS_LABELS[s]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() =>
                Alert.alert('Withdraw Application', 'This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Withdraw', style: 'destructive', onPress: () => handleStatusUpdate('WITHDRAWN') },
                ])
              }
              disabled={isUpdating}
            >
              <Text style={styles.withdrawBtnText}>Withdraw Application</Text>
            </TouchableOpacity>
          </>
        )}
        {isUpdating && (
          <ActivityIndicator color={colors.primary} size="small" style={{ marginTop: 8 }} />
        )}
      </View>

      {/* Interview CTAs */}
      {application.status === 'INTERVIEW' && (
        <>
          <TouchableOpacity
            style={styles.prepBtn}
            onPress={() => navigation.navigate('InterviewPrepPlan', { applicationId: application.id })}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <View style={styles.interviewBtnText}>
              <Text style={styles.interviewBtnTitle}>Get Prep Plan</Text>
              <Text style={styles.interviewBtnSub}>AI day-by-day plan tailored to this role</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interviewBtn}
            onPress={() =>
              anyNav.navigate('InterviewTab', {
                screen: 'InterviewStart',
                params: { applicationId: application.id },
              })
            }
          >
            <Ionicons name="mic-outline" size={20} color="#fff" />
            <View style={styles.interviewBtnText}>
              <Text style={styles.interviewBtnTitle}>Practice Mock Interview</Text>
              <Text style={styles.interviewBtnSub}>7 AI-generated questions for this role</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Interview scheduling */}
      {!isTerminal && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interview Details</Text>
          <Text style={styles.inputLabel}>Interview Date &amp; Time</Text>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DDTHH:mm  (e.g. 2026-07-15T10:00)"
            value={interviewDate}
            onChangeText={setInterviewDate}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Interviewer name, format, topics…"
            value={interviewNotes}
            onChangeText={setInterviewNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.saveBtn, savingInterview && styles.saveBtnDisabled]}
            onPress={handleSaveInterview}
            disabled={savingInterview}
          >
            {savingInterview
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Save Interview Details</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Offer tracking */}
      {application.status === 'OFFER' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offer Details</Text>
          <Text style={styles.inputLabel}>Offered Salary (₹/yr)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 1500000"
            value={offerSalary}
            onChangeText={setOfferSalary}
            keyboardType="numeric"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Deadline to Accept</Text>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD  (e.g. 2026-07-30)"
            value={offerDeadline}
            onChangeText={setOfferDeadline}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Other Details</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Signing bonus, stock, location, etc."
            value={offerDetails}
            onChangeText={setOfferDetails}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.saveBtn, savingOffer && styles.saveBtnDisabled]}
            onPress={handleSaveOffer}
            disabled={savingOffer}
          >
            {savingOffer
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Save Offer Details</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Follow-up sent badge */}
      {(application as any).followUpSent && (
        <View style={styles.followUpBadge}>
          <Ionicons name="mail-open-outline" size={14} color={colors.secondary} />
          <Text style={styles.followUpText}>Follow-up email sent automatically</Text>
        </View>
      )}

      {/* Notes */}
      {application.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{application.notes}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  heroBanner: {
    borderRadius: 18, padding: 18, marginBottom: 10, gap: 10,
  },
  heroBannerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  heroIconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroInitial: { fontSize: 22, fontWeight: '900', color: '#fff' },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 17, fontWeight: '800', color: '#fff', lineHeight: 22, marginBottom: 3 },
  heroCompany: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginBottom: 4 },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroLocation: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  heroBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  heroBadgeText: { fontSize: 11, fontWeight: '800' },
  heroDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },

  timelineCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10,
  },
  terminalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, padding: 12, marginBottom: 10,
  },
  terminalBannerText: { fontSize: 13, fontWeight: '700' },

  metaCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaLabel: { fontSize: 13, color: colors.textSecondary },
  metaValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '500', flexShrink: 1, textAlign: 'right', maxWidth: '60%' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coverLetterText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 21,
    marginTop: 8,
  },

  terminalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  terminalNoteText: { fontSize: 13, color: colors.textSecondary },

  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  statusChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  withdrawBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  withdrawBtnText: { fontSize: 13, color: colors.error, fontWeight: '600' },

  interviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  interviewBtnText: { flex: 1 },
  interviewBtnTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  interviewBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  notesText: { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
  prepBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primary, borderRadius: 14, padding: 16, marginBottom: 10,
  },
  followUpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#D1FAE5', borderRadius: 8, padding: 10, marginBottom: 12,
  },
  followUpText: { fontSize: 13, color: colors.secondary },

  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  textInput: {
    backgroundColor: colors.background, borderRadius: 10, padding: 12,
    fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', marginTop: 14,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  });
}