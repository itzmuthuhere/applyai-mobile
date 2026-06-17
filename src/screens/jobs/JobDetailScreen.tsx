import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { COLORS, API_ENDPOINTS, ROUTES } from '../../constants';
import { JobsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setSelectedJob } from '../../store/slices/jobSlice';
import { Job, Resume } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<JobsStackParamList, 'JobDetail'>;
type Nav = NativeStackNavigationProp<JobsStackParamList, 'JobDetail'>;

interface AiPanel { open: boolean; loading: boolean; data: any; error: string | null }
const emptyPanel = (): AiPanel => ({ open: false, loading: false, data: null, error: null });

function formatSalary(min: number | null, max: number | null): string | null {
  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr/yr`;
    if (n >= 100000) return `₹${Math.round(n / 100000)}L/yr`;
    return `₹${n.toLocaleString('en-IN')}/yr`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

export default function JobDetailScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [primaryResumeId, setPrimaryResumeId] = useState<number | null>(null);
  const [atsPanel, setAtsPanel] = useState<AiPanel>(emptyPanel());
  const [gapPanel, setGapPanel] = useState<AiPanel>(emptyPanel());
  const [analyserPanel, setAnalyserPanel] = useState<AiPanel>(emptyPanel());
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);

  const job = useSelector((s: RootState) => s.job.selected);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<Job>(API_ENDPOINTS.JOB_BY_ID(params.jobId));
        dispatch(setSelectedJob(res.data));
      } catch {
        setError('Failed to load job details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
    return () => { dispatch(setSelectedJob(null)); };
  }, [params.jobId]);

  useEffect(() => {
    if (!job) return;
    setSaved(job.saved ?? false);
    loadSideData(job.id);
  }, [job?.id]);

  async function loadSideData(jobId: number) {
    // Load primary resume for AI calls
    apiClient.get<Resume[]>(API_ENDPOINTS.RESUMES)
      .then(r => {
        const parsed = r.data.find(rv => rv.isParsed && rv.isOriginal) ?? r.data[0];
        if (parsed) setPrimaryResumeId(parsed.id);
      })
      .catch(() => {});

    // Load similar jobs
    apiClient.get<Job[]>(API_ENDPOINTS.JOB_SIMILAR(jobId))
      .then(r => setSimilarJobs(r.data.slice(0, 5)))
      .catch(() => {});
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleToggleSave}
          disabled={saving}
          style={{ marginRight: 4, padding: 8 }}
        >
          {saving
            ? <ActivityIndicator size="small" color={COLORS.primary} />
            : <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={COLORS.primary}
              />
          }
        </TouchableOpacity>
      ),
    });
  }, [saved, saving]);

  async function handleToggleSave() {
    if (!job) return;
    setSaving(true);
    try {
      if (saved) {
        await apiClient.delete(API_ENDPOINTS.SAVE_JOB(job.id));
        setSaved(false);
      } else {
        await apiClient.post(API_ENDPOINTS.SAVE_JOB(job.id));
        setSaved(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not update saved status.');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickApply() {
    if (!job) return;
    setApplying(true);
    try {
      await apiClient.post(API_ENDPOINTS.QUICK_APPLY(job.id));
      Alert.alert('Applied!', 'Your application has been submitted using your primary resume.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Quick apply failed.');
    } finally {
      setApplying(false);
    }
  }

  async function openAtsPanel() {
    if (!primaryResumeId) {
      Alert.alert('No resume found', 'Upload and parse a resume first.');
      return;
    }
    if (!job) return;
    if (atsPanel.data || atsPanel.loading) {
      setAtsPanel(p => ({ ...p, open: !p.open }));
      return;
    }
    setAtsPanel({ open: true, loading: true, data: null, error: null });
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.ATS_SCORE, {
        resumeId: primaryResumeId, jobId: job.id,
      });
      setAtsPanel({ open: true, loading: false, data, error: null });
    } catch (e: any) {
      setAtsPanel({ open: true, loading: false, data: null, error: e?.response?.data?.message ?? 'ATS score failed.' });
    }
  }

  async function openGapPanel() {
    if (!primaryResumeId) {
      Alert.alert('No resume found', 'Upload and parse a resume first.');
      return;
    }
    if (!job) return;
    if (gapPanel.data || gapPanel.loading) {
      setGapPanel(p => ({ ...p, open: !p.open }));
      return;
    }
    setGapPanel({ open: true, loading: true, data: null, error: null });
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.SKILLS_GAP, {
        resumeId: primaryResumeId, jobId: job.id,
      });
      setGapPanel({ open: true, loading: false, data, error: null });
    } catch (e: any) {
      setGapPanel({ open: true, loading: false, data: null, error: e?.response?.data?.message ?? 'Skills gap failed.' });
    }
  }

  async function openAnalyserPanel() {
    if (!job) return;
    if (analyserPanel.data || analyserPanel.loading) {
      setAnalyserPanel(p => ({ ...p, open: !p.open }));
      return;
    }
    setAnalyserPanel({ open: true, loading: true, data: null, error: null });
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.ANALYSE_JOB, {
        jobId: job.id,
      });
      setAnalyserPanel({ open: true, loading: false, data, error: null });
    } catch (e: any) {
      setAnalyserPanel({ open: true, loading: false, data: null, error: e?.response?.data?.message ?? 'Job analysis failed.' });
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error ?? 'Job not found.'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.companyIcon}>
          <Text style={styles.companyInitial}>
            {job.company ? job.company[0].toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.companyName}>{job.company}</Text>
        </View>
        {job.matchScore != null && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{job.matchScore}%</Text>
          </View>
        )}
      </View>

      {/* Meta chips */}
      <View style={styles.metaCard}>
        {job.location && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
        )}
        {job.isRemote && (
          <View style={styles.metaRow}>
            <Ionicons name="wifi-outline" size={16} color={COLORS.success} />
            <Text style={[styles.metaText, { color: COLORS.success }]}>Remote OK</Text>
          </View>
        )}
        {salary && (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{salary}</Text>
          </View>
        )}
        {job.category && (
          <View style={styles.metaRow}>
            <Ionicons name="pricetag-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{job.category}</Text>
          </View>
        )}
        {job.postedDate && (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>Posted {dayjs(job.postedDate).format('MMM D, YYYY')}</Text>
          </View>
        )}
        {job.deadline && (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.error} />
            <Text style={[styles.metaText, { color: COLORS.error }]}>
              Apply by {dayjs(job.deadline).format('MMM D, YYYY')}
            </Text>
          </View>
        )}
        {job.source && (
          <View style={styles.metaRow}>
            <Ionicons name="link-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{job.source}</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsCard}>
        <ActionRow
          icon="analytics-outline"
          label="Match Score"
          onPress={() => navigation.navigate(ROUTES.MATCH_SCORE as 'MatchScore', { jobId: job.id })}
        />
        <ActionRow
          icon="checkmark-circle-outline"
          label="ATS Score"
          onPress={openAtsPanel}
          badge={atsPanel.data ? `${atsPanel.data.atsScore}` : undefined}
        />
        <ActionRow
          icon="git-merge-outline"
          label="Skills Gap"
          onPress={openGapPanel}
          badge={gapPanel.data ? `${gapPanel.data.readinessScore}%` : undefined}
        />
        <ActionRow
          icon="color-wand-outline"
          label="Tailor Resume"
          onPress={() => navigation.navigate('TailorResume', { jobId: job.id })}
        />
        <ActionRow
          icon="document-text-outline"
          label="Cover Letter"
          onPress={() => navigation.navigate('CoverLetter', { jobId: job.id })}
        />
        <ActionRow
          icon="flash-outline"
          label="Quick Apply"
          color={COLORS.secondary}
          onPress={handleQuickApply}
          loading={applying}
        />
        <ActionRow
          icon="send-outline"
          label="Apply (Full)"
          color={COLORS.secondary}
          onPress={() => navigation.navigate('ApplyJob', { jobId: job.id })}
        />
        <ActionRow
          icon="business-outline"
          label="Company Intel"
          onPress={() => navigation.navigate('CompanyIntel', { companyName: job.company ?? '', jobTitle: job.title })}
        />
        <ActionRow
          icon="search-outline"
          label="Analyse Job"
          onPress={openAnalyserPanel}
          last
        />
      </View>

      {/* ATS Score panel */}
      {atsPanel.open && (
        <AiResultPanel
          title="ATS Score"
          loading={atsPanel.loading}
          error={atsPanel.error}
          onClose={() => setAtsPanel(p => ({ ...p, open: false }))}
        >
          {atsPanel.data && (
            <View style={styles.panelContent}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreBig}>{atsPanel.data.atsScore}</Text>
                <Text style={styles.scoreLabel}>/100</Text>
                <View style={[styles.verdictBadge, { backgroundColor: scoreColor(atsPanel.data.atsScore) }]}>
                  <Text style={styles.verdictText}>{atsPanel.data.verdict}</Text>
                </View>
              </View>
              {atsPanel.data.matchedKeywords?.length > 0 && (
                <PillList title="Matched Keywords" items={atsPanel.data.matchedKeywords} color="success" />
              )}
              {atsPanel.data.missingKeywords?.length > 0 && (
                <PillList title="Missing Keywords" items={atsPanel.data.missingKeywords} color="error" />
              )}
              {atsPanel.data.suggestions?.length > 0 && (
                <BulletList title="Suggestions" items={atsPanel.data.suggestions} />
              )}
            </View>
          )}
        </AiResultPanel>
      )}

      {/* Skills Gap panel */}
      {gapPanel.open && (
        <AiResultPanel
          title="Skills Gap"
          loading={gapPanel.loading}
          error={gapPanel.error}
          onClose={() => setGapPanel(p => ({ ...p, open: false }))}
        >
          {gapPanel.data && (
            <View style={styles.panelContent}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreBig}>{gapPanel.data.readinessScore}</Text>
                <Text style={styles.scoreLabel}>% ready</Text>
                <View style={[styles.verdictBadge, { backgroundColor: scoreColor(gapPanel.data.readinessScore) }]}>
                  <Text style={styles.verdictText}>{gapPanel.data.verdict}</Text>
                </View>
              </View>
              {gapPanel.data.matchedSkills?.length > 0 && (
                <PillList title="You Have" items={gapPanel.data.matchedSkills} color="success" />
              )}
              {gapPanel.data.missingSkills?.length > 0 && (
                <View style={styles.gapSection}>
                  <Text style={styles.panelSub}>Skills to Add</Text>
                  {gapPanel.data.missingSkills.map((ms: any, i: number) => (
                    <View key={i} style={styles.gapRow}>
                      <Text style={styles.gapSkill}>{ms.skill}</Text>
                      <Text style={styles.gapMeta}>{ms.importance} · {ms.timeToLearn}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </AiResultPanel>
      )}

      {/* Job Analyser panel */}
      {analyserPanel.open && (
        <AiResultPanel
          title="Job Analysis"
          loading={analyserPanel.loading}
          error={analyserPanel.error}
          onClose={() => setAnalyserPanel(p => ({ ...p, open: false }))}
        >
          {analyserPanel.data && (
            <View style={styles.panelContent}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreBig}>{analyserPanel.data.overallScore}</Text>
                <Text style={styles.scoreLabel}>/100</Text>
                <View style={[styles.verdictBadge, { backgroundColor: scoreColor(analyserPanel.data.overallScore) }]}>
                  <Text style={styles.verdictText}>{analyserPanel.data.verdict}</Text>
                </View>
              </View>
              {analyserPanel.data.greenFlags?.length > 0 && (
                <BulletList title="Green Flags" items={analyserPanel.data.greenFlags} />
              )}
              {analyserPanel.data.redFlags?.length > 0 && (
                <BulletList title="Red Flags" items={analyserPanel.data.redFlags} />
              )}
              {analyserPanel.data.cultureSignals && (
                <View style={styles.metaItem}>
                  <Text style={styles.panelSub}>Culture</Text>
                  <Text style={styles.metaValue}>{analyserPanel.data.cultureSignals}</Text>
                </View>
              )}
            </View>
          )}
        </AiResultPanel>
      )}

      {/* View original posting */}
      {job.sourceUrl && (
        <TouchableOpacity
          style={styles.sourceUrlBtn}
          onPress={() => Linking.openURL(job.sourceUrl!)}
        >
          <Ionicons name="open-outline" size={15} color={COLORS.primary} />
          <Text style={styles.sourceUrlText}>View Original Posting</Text>
        </TouchableOpacity>
      )}

      {/* Description */}
      <View style={styles.descriptionCard}>
        <Text style={styles.sectionTitle}>Job Description</Text>
        <Text style={styles.descriptionText}>{job.description}</Text>
      </View>

      {/* Similar Jobs */}
      {similarJobs.length > 0 && (
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Similar Jobs</Text>
          {similarJobs.map((sj, i) => (
            <TouchableOpacity
              key={sj.id}
              style={[styles.similarRow, i > 0 && styles.similarDivider]}
              onPress={() => navigation.push('JobDetail', { jobId: sj.id })}
            >
              <View style={styles.similarAvatar}>
                <Text style={styles.similarAvatarText}>{sj.company?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.similarTitle} numberOfLines={1}>{sj.title}</Text>
                <Text style={styles.similarCompany} numberOfLines={1}>{sj.company}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

    </ScrollView>
  );
}

// ─── Small sub-components ────────────────────────────────────────

function ActionRow({
  icon, label, onPress, color, loading: actionLoading, badge, last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color?: string;
  loading?: boolean;
  badge?: string;
  last?: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={styles.actionBtn} onPress={onPress} disabled={actionLoading}>
        {actionLoading
          ? <ActivityIndicator size="small" color={color ?? COLORS.primary} />
          : <Ionicons name={icon} size={18} color={color ?? COLORS.primary} />
        }
        <Text style={[styles.actionBtnText, color ? { color } : {}]}>{label}</Text>
        {badge && (
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
      </TouchableOpacity>
      {!last && <View style={styles.actionDivider} />}
    </>
  );
}

function AiResultPanel({
  title, loading, error, onClose, children,
}: {
  title: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.aiPanel}>
      <View style={styles.aiPanelHeader}>
        <Text style={styles.aiPanelTitle}>{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 12 }} />}
      {error && <Text style={styles.aiPanelError}>{error}</Text>}
      {children}
    </View>
  );
}

function PillList({ title, items, color }: { title: string; items: string[]; color: 'success' | 'error' }) {
  const bg = color === 'success' ? '#D1FAE5' : '#FEE2E2';
  const tc = color === 'success' ? '#065F46' : '#991B1B';
  return (
    <View style={styles.pillSection}>
      <Text style={styles.panelSub}>{title}</Text>
      <View style={styles.pillRow}>
        {items.map((item, i) => (
          <View key={i} style={[styles.pill, { backgroundColor: bg }]}>
            <Text style={[styles.pillText, { color: tc }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.pillSection}>
      <Text style={styles.panelSub}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function scoreColor(score: number): string {
  if (score >= 70) return '#D1FAE5';
  if (score >= 45) return '#FEF9C3';
  return '#FEE2E2';
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },

  errorText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  retryButton: {
    borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  retryText: { fontSize: 14, color: COLORS.textSecondary },

  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  companyIcon: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  companyInitial: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  headerInfo: { flex: 1 },
  jobTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  companyName: { fontSize: 14, color: COLORS.textSecondary },
  matchBadge: {
    backgroundColor: COLORS.primaryLight, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  matchBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  metaCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, color: COLORS.textSecondary },

  actionsCard: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, minHeight: 52,
  },
  actionBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.primary },
  actionDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16 },
  badgePill: {
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgePillText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },

  aiPanel: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  aiPanelHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  aiPanelTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  aiPanelError: { fontSize: 13, color: COLORS.error, textAlign: 'center', padding: 8 },
  panelContent: { gap: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scoreBig: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary },
  scoreLabel: { fontSize: 14, color: COLORS.textSecondary, marginRight: 8 },
  verdictBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  verdictText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  pillSection: { gap: 6 },
  panelSub: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 12, fontWeight: '500' },
  bulletRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  bullet: { fontSize: 14, color: COLORS.textMuted, marginTop: 1 },
  bulletText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 19 },
  gapSection: { gap: 8 },
  gapRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  gapSkill: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  gapMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  metaItem: { gap: 4 },
  metaValue: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 19 },

  sourceUrlBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, borderRadius: 10, paddingVertical: 10,
  },
  sourceUrlText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  descriptionCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  descriptionText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },

  similarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
  },
  similarDivider: { borderTopWidth: 1, borderTopColor: COLORS.border },
  similarAvatar: {
    width: 36, height: 36, borderRadius: 9,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  similarAvatarText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  similarTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  similarCompany: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
});
