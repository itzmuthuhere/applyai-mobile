import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, Alert, Animated, Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { API_ENDPOINTS, ROUTES } from '../../constants';
import { useTheme } from '../../theme/ThemeContext';
import { AppColors } from '../../theme/themes';
import { JobsStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { setSelectedJob } from '../../store/slices/jobSlice';
import { Job, Resume } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<JobsStackParamList, 'JobDetail'>;
type Nav = NativeStackNavigationProp<JobsStackParamList, 'JobDetail'>;

interface AiPanel { open: boolean; loading: boolean; data: any; error: string | null }
const emptyPanel = (): AiPanel => ({ open: false, loading: false, data: null, error: null });

const COMPANY_COLORS = [
  '#2563EB', '#7C3AED', '#059669', '#DC2626',
  '#D97706', '#0891B2', '#C026D3', '#65A30D',
];

function companyColor(name: string) {
  if (!name) return COMPANY_COLORS[0];
  return COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length];
}

function fmt(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${Math.round(n / 100_000)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

function scoreColor(score: number): string {
  if (score >= 70) return '#D1FAE5';
  if (score >= 45) return '#FEF9C3';
  return '#FEE2E2';
}
function scoreTextColor(score: number): string {
  if (score >= 70) return '#065F46';
  if (score >= 45) return '#854D0E';
  return '#991B1B';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Highlight({ icon, label, value, color }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; color?: string;
}) {
  const colors = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4, backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 6, borderWidth: 1, borderColor: colors.border }}>
      <Ionicons name={icon} size={18} color={color ?? colors.primary} />
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }} numberOfLines={1}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

function AiTool({ icon, label, badge, onPress, loading }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; badge?: string; onPress: () => void; loading?: boolean;
}) {
  const colors = useTheme();
  return (
    <TouchableOpacity style={{ flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 4, borderWidth: 1, borderColor: '#BFDBFE', minWidth: 72 }} onPress={onPress} activeOpacity={0.75}>
      {loading
        ? <ActivityIndicator size="small" color={colors.primary} />
        : <Ionicons name={icon} size={20} color={colors.primary} />
      }
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary, textAlign: 'center' }}>{label}</Text>
      {badge && (
        <View style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function PillList({ title, items, bg, tc }: { title: string; items: string[]; bg: string; tc: string }) {
  const colors = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item, i) => (
          <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: bg }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: tc }}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
function BulletList({ title, items }: { title: string; items: string[] }) {
  const colors = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 }}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6, flexShrink: 0 }} />
          <Text style={{ flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 20 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function JobDetailScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [primaryResumeId, setPrimaryResumeId] = useState<number | null>(null);
  const [atsPanel, setAtsPanel] = useState<AiPanel>(emptyPanel());
  const [gapPanel, setGapPanel] = useState<AiPanel>(emptyPanel());
  const [analyserPanel, setAnalyserPanel] = useState<AiPanel>(emptyPanel());
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const job = useSelector((s: RootState) => s.job.selected);

  useEffect(() => {
    (async () => {
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
    })();
    return () => { dispatch(setSelectedJob(null)); };
  }, [params.jobId]);

  useEffect(() => {
    if (!job) return;
    setSaved(job.saved ?? false);
    apiClient.get<{ content: Resume[] } | Resume[]>(API_ENDPOINTS.RESUMES).then(r => {
      const list = Array.isArray(r.data) ? r.data : (r.data.content ?? []);
      const p = list.find(rv => rv.isParsed && rv.isOriginal) ?? list[0];
      if (p) setPrimaryResumeId(p.id);
    }).catch(() => {});
    apiClient.get<Job[]>(API_ENDPOINTS.JOB_SIMILAR(job.id)).then(r => {
      setSimilarJobs(r.data.slice(0, 4));
    }).catch(() => {});
  }, [job?.id]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleToggleSave} disabled={saving} style={{ padding: 8 }}>
          {saving
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color={colors.primary} />
          }
        </TouchableOpacity>
      ),
    });
  }, [saved, saving]);

  async function handleToggleSave() {
    if (!job) return;
    setSaving(true);
    try {
      if (saved) { await apiClient.delete(API_ENDPOINTS.SAVE_JOB(job.id)); setSaved(false); }
      else { await apiClient.post(API_ENDPOINTS.SAVE_JOB(job.id)); setSaved(true); }
    } catch {
      Alert.alert('Error', 'Could not update saved status.');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickApply() {
    if (!job) return;
    setApplying(true);
    try {
      await apiClient.post(API_ENDPOINTS.QUICK_APPLY(job.id));
      Alert.alert('Applied! ⚡', 'Your primary resume has been submitted.', [
        { text: 'OK' },
        { text: 'View Applications', onPress: () => navigation.getParent()?.navigate('ApplicationsTab') },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? '';
      if (msg.includes('402') || e?.response?.status === 402) {
        navigation.navigate('CompanyIntel', { companyName: job.company ?? '', jobTitle: job.title });
      } else {
        navigation.navigate('ApplyJob', { jobId: job.id });
      }
    } finally {
      setApplying(false);
    }
  }

  function alertNoResume() {
    Alert.alert(
      'No resume',
      'Upload and parse a resume to use AI features.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upload Resume', onPress: () => navigation.getParent()?.navigate('ResumeTab') },
      ]
    );
  }

  async function openAtsPanel() {
    if (!primaryResumeId || !job) { alertNoResume(); return; }
    if (atsPanel.data || atsPanel.loading) { setAtsPanel(p => ({ ...p, open: !p.open })); return; }
    setAtsPanel({ open: true, loading: true, data: null, error: null });
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.ATS_SCORE, { resumeId: primaryResumeId, jobId: job.id });
      setAtsPanel({ open: true, loading: false, data, error: null });
    } catch (e: any) {
      setAtsPanel({ open: true, loading: false, data: null, error: e?.response?.data?.message ?? 'ATS score failed.' });
    }
  }

  async function openGapPanel() {
    if (!primaryResumeId || !job) { alertNoResume(); return; }
    if (gapPanel.data || gapPanel.loading) { setGapPanel(p => ({ ...p, open: !p.open })); return; }
    setGapPanel({ open: true, loading: true, data: null, error: null });
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.SKILLS_GAP, { resumeId: primaryResumeId, jobId: job.id });
      setGapPanel({ open: true, loading: false, data, error: null });
    } catch (e: any) {
      setGapPanel({ open: true, loading: false, data: null, error: e?.response?.data?.message ?? 'Skills gap failed.' });
    }
  }

  async function openAnalyserPanel() {
    if (!job) return;
    if (analyserPanel.data || analyserPanel.loading) { setAnalyserPanel(p => ({ ...p, open: !p.open })); return; }
    setAnalyserPanel({ open: true, loading: true, data: null, error: null });
    try {
      const { data } = await apiClient.post(API_ENDPOINTS.ANALYSE_JOB, { jobId: job.id });
      setAnalyserPanel({ open: true, loading: false, data, error: null });
    } catch (e: any) {
      setAnalyserPanel({ open: true, loading: false, data: null, error: e?.response?.data?.message ?? 'Analysis failed.' });
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>Loading job details…</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
        <Text style={styles.errorText}>{error ?? 'Job not found.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const bgColor = companyColor(job.company ?? '');
  const postedAgo = job.scrapedAt ? dayjs(job.scrapedAt).fromNow() : null;
  const descLines = job.description?.split('\n') ?? [];
  const descPreview = descLines.slice(0, 8).join('\n');
  const hasMoreDesc = descLines.length > 8;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={[styles.heroLogo, { backgroundColor: bgColor + '18' }]}>
            <Text style={[styles.heroInitial, { color: bgColor }]}>
              {job.company ? job.company[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>{job.title}</Text>
            <Text style={styles.heroCompany}>{job.company}</Text>
            <View style={styles.heroMeta}>
              {job.location && (
                <View style={styles.heroMetaItem}>
                  <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.heroMetaText}>{job.location}</Text>
                </View>
              )}
              {postedAgo && (
                <View style={styles.heroMetaItem}>
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text style={styles.heroMetaText}>{postedAgo}</Text>
                </View>
              )}
            </View>
          </View>
          {job.matchScore != null && (
            <View style={[styles.matchBubble, { backgroundColor: scoreColor(job.matchScore) }]}>
              <Text style={[styles.matchBubbleNum, { color: scoreTextColor(job.matchScore) }]}>{job.matchScore}%</Text>
              <Text style={[styles.matchBubbleSub, { color: scoreTextColor(job.matchScore) }]}>match</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {job.isRemote && <View style={styles.tagGreen}><Text style={styles.tagGreenText}>Remote</Text></View>}
          {job.category && <View style={styles.tagNeutral}><Text style={styles.tagNeutralText}>{job.category}</Text></View>}
          {job.source && <View style={styles.tagNeutral}><Text style={styles.tagNeutralText}>{job.source}</Text></View>}
          {job.deadline && (
            <View style={styles.tagRed}>
              <Ionicons name="alert-circle-outline" size={11} color={colors.error} />
              <Text style={styles.tagRedText}>Closes {dayjs(job.deadline).format('MMM D, YYYY')}</Text>
            </View>
          )}
        </View>

        {/* Key highlights */}
        {(salary || job.location || job.isRemote || job.category) && (
          <View style={styles.highlights}>
            {salary && <Highlight icon="cash-outline" label="Salary" value={salary} color="#059669" />}
            {job.location && <Highlight icon="location-outline" label="Location" value={job.location} />}
            <Highlight
              icon={job.isRemote ? 'wifi-outline' : 'business-outline'}
              label="Work Mode"
              value={job.isRemote ? 'Remote' : 'On-site'}
              color={job.isRemote ? '#059669' : colors.primary}
            />
            {job.category && <Highlight icon="pricetag-outline" label="Domain" value={job.category} />}
          </View>
        )}

        {/* AI Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Tools</Text>
          <View style={styles.aiToolsRow}>
            <AiTool
              icon="analytics-outline"
              label="Match Score"
              onPress={() => navigation.navigate(ROUTES.MATCH_SCORE as 'MatchScore', { jobId: job.id })}
            />
            <AiTool
              icon="shield-checkmark-outline"
              label="ATS Score"
              badge={atsPanel.data ? String(atsPanel.data.atsScore) : undefined}
              onPress={openAtsPanel}
              loading={atsPanel.loading}
            />
            <AiTool
              icon="git-branch-outline"
              label="Skills Gap"
              badge={gapPanel.data ? `${gapPanel.data.readinessScore}%` : undefined}
              onPress={openGapPanel}
              loading={gapPanel.loading}
            />
            <AiTool
              icon="color-wand-outline"
              label="Analyse"
              badge={analyserPanel.data ? String(analyserPanel.data.overallScore) : undefined}
              onPress={openAnalyserPanel}
              loading={analyserPanel.loading}
            />
          </View>
        </View>

        {/* ATS Panel */}
        {atsPanel.open && (
          <View style={styles.aiPanel}>
            <View style={styles.aiPanelHead}>
              <Text style={styles.aiPanelTitle}>ATS Score Analysis</Text>
              <TouchableOpacity onPress={() => setAtsPanel(p => ({ ...p, open: false }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {atsPanel.loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />}
            {atsPanel.error && <Text style={styles.panelErr}>{atsPanel.error}</Text>}
            {atsPanel.data && (
              <View style={{ gap: 16 }}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreBig}>{atsPanel.data.atsScore}</Text>
                  <Text style={styles.scoreOf}>/100</Text>
                  <View style={[styles.verdictPill, { backgroundColor: scoreColor(atsPanel.data.atsScore) }]}>
                    <Text style={[styles.verdictText, { color: scoreTextColor(atsPanel.data.atsScore) }]}>{atsPanel.data.verdict}</Text>
                  </View>
                </View>
                {atsPanel.data.matchedKeywords?.length > 0 && (
                  <PillList title="Matched Keywords" items={atsPanel.data.matchedKeywords} bg="#D1FAE5" tc="#065F46" />
                )}
                {atsPanel.data.missingKeywords?.length > 0 && (
                  <PillList title="Missing Keywords" items={atsPanel.data.missingKeywords} bg="#FEE2E2" tc="#991B1B" />
                )}
                {atsPanel.data.suggestions?.length > 0 && (
                  <BulletList title="How to Improve" items={atsPanel.data.suggestions} />
                )}
              </View>
            )}
          </View>
        )}

        {/* Skills Gap Panel */}
        {gapPanel.open && (
          <View style={styles.aiPanel}>
            <View style={styles.aiPanelHead}>
              <Text style={styles.aiPanelTitle}>Skills Gap Analysis</Text>
              <TouchableOpacity onPress={() => setGapPanel(p => ({ ...p, open: false }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {gapPanel.loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />}
            {gapPanel.error && <Text style={styles.panelErr}>{gapPanel.error}</Text>}
            {gapPanel.data && (
              <View style={{ gap: 16 }}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreBig}>{gapPanel.data.readinessScore}</Text>
                  <Text style={styles.scoreOf}>% ready</Text>
                  <View style={[styles.verdictPill, { backgroundColor: scoreColor(gapPanel.data.readinessScore) }]}>
                    <Text style={[styles.verdictText, { color: scoreTextColor(gapPanel.data.readinessScore) }]}>{gapPanel.data.verdict}</Text>
                  </View>
                </View>
                {gapPanel.data.matchedSkills?.length > 0 && (
                  <PillList title="Skills You Have" items={gapPanel.data.matchedSkills} bg="#D1FAE5" tc="#065F46" />
                )}
                {gapPanel.data.missingSkills?.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={styles.panelSub}>Skills to Add</Text>
                    {gapPanel.data.missingSkills.map((ms: any, i: number) => (
                      <View key={i} style={styles.gapRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.gapSkill}>{ms.skill}</Text>
                          <Text style={styles.gapMeta}>{ms.importance} · {ms.timeToLearn}</Text>
                        </View>
                        <View style={[styles.impBadge, { backgroundColor: ms.importance === 'High' ? '#FEE2E2' : '#FEF9C3' }]}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: ms.importance === 'High' ? '#991B1B' : '#854D0E' }}>
                            {ms.importance}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Job Analyser Panel */}
        {analyserPanel.open && (
          <View style={styles.aiPanel}>
            <View style={styles.aiPanelHead}>
              <Text style={styles.aiPanelTitle}>Job Analysis</Text>
              <TouchableOpacity onPress={() => setAnalyserPanel(p => ({ ...p, open: false }))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {analyserPanel.loading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />}
            {analyserPanel.error && <Text style={styles.panelErr}>{analyserPanel.error}</Text>}
            {analyserPanel.data && (
              <View style={{ gap: 16 }}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreBig}>{analyserPanel.data.overallScore}</Text>
                  <Text style={styles.scoreOf}>/100</Text>
                  <View style={[styles.verdictPill, { backgroundColor: scoreColor(analyserPanel.data.overallScore) }]}>
                    <Text style={[styles.verdictText, { color: scoreTextColor(analyserPanel.data.overallScore) }]}>{analyserPanel.data.verdict}</Text>
                  </View>
                </View>
                {analyserPanel.data.greenFlags?.length > 0 && <BulletList title="Green Flags ✅" items={analyserPanel.data.greenFlags} />}
                {analyserPanel.data.redFlags?.length > 0 && <BulletList title="Red Flags ⚠️" items={analyserPanel.data.redFlags} />}
                {analyserPanel.data.cultureSignals && (
                  <View style={{ gap: 4 }}>
                    <Text style={styles.panelSub}>Culture Signals</Text>
                    <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 20 }}>{analyserPanel.data.cultureSignals}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* More Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Tools</Text>
          <View style={styles.actionGrid}>
            {[
              { icon: 'color-wand-outline' as const, label: 'Tailor Resume', onPress: () => navigation.navigate('TailorResume', { jobId: job.id }) },
              { icon: 'document-text-outline' as const, label: 'Cover Letter', onPress: () => navigation.navigate('CoverLetter', { jobId: job.id }) },
              { icon: 'business-outline' as const, label: 'Company Intel', onPress: () => navigation.navigate('CompanyIntel', { companyName: job.company ?? '', jobTitle: job.title }) },
              { icon: 'send-outline' as const, label: 'Full Apply', onPress: () => navigation.navigate('ApplyJob', { jobId: job.id }) },
            ].map(({ icon, label, onPress }) => (
              <TouchableOpacity key={label} style={styles.actionTile} onPress={onPress} activeOpacity={0.75}>
                <Ionicons name={icon} size={20} color={colors.primary} />
                <Text style={styles.actionTileText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Job Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this Role</Text>
          <Text style={styles.descText}>
            {descExpanded ? job.description : descPreview}
          </Text>
          {hasMoreDesc && (
            <TouchableOpacity onPress={() => setDescExpanded(e => !e)} style={styles.showMoreBtn}>
              <Text style={styles.showMoreText}>{descExpanded ? 'Show less' : 'Show more'}</Text>
              <Ionicons
                name={descExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* View original */}
        {job.sourceUrl && (
          <TouchableOpacity style={styles.srcBtn} onPress={() => Linking.openURL(job.sourceUrl!)}>
            <Ionicons name="open-outline" size={15} color={colors.primary} />
            <Text style={styles.srcBtnText}>View Original Posting</Text>
          </TouchableOpacity>
        )}

        {/* Similar Jobs */}
        {similarJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Jobs</Text>
            <View style={styles.similarList}>
              {similarJobs.map((sj, i) => {
                const sjColor = companyColor(sj.company ?? '');
                return (
                  <TouchableOpacity
                    key={sj.id}
                    style={[styles.similarCard, i > 0 && { marginTop: 8 }]}
                    onPress={() => navigation.push('JobDetail', { jobId: sj.id })}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.simLogo, { backgroundColor: sjColor + '18' }]}>
                      <Text style={[styles.simLogoText, { color: sjColor }]}>{sj.company?.[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.simTitle} numberOfLines={1}>{sj.title}</Text>
                      <Text style={styles.simCompany} numberOfLines={1}>{sj.company}{sj.location ? ` · ${sj.location}` : ''}</Text>
                    </View>
                    {sj.matchScore != null && (
                      <View style={[styles.simMatch, { backgroundColor: scoreColor(sj.matchScore) }]}>
                        <Text style={[{ fontSize: 12, fontWeight: '700' }, { color: scoreTextColor(sj.matchScore) }]}>{sj.matchScore}%</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky bottom action bar */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.stickyQuickApply, applying && { opacity: 0.7 }]}
          onPress={handleQuickApply}
          disabled={applying}
          activeOpacity={0.85}
        >
          {applying
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="flash" size={18} color="#fff" />
          }
          <Text style={styles.stickyQuickText}>Easy Apply</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.stickyFullApply}
          onPress={() => navigation.navigate('ApplyJob', { jobId: job.id })}
          activeOpacity={0.85}
        >
          <Text style={styles.stickyFullText}>Full Apply</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(colors: AppColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700' },

  // Hero
  heroCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  heroLogo: {
    width: 60, height: 60, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroInitial: { fontSize: 26, fontWeight: '900' },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, lineHeight: 24, marginBottom: 4 },
  heroCompany: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroMetaText: { fontSize: 12, color: colors.textMuted },
  matchBubble: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, flexShrink: 0,
  },
  matchBubbleNum: { fontSize: 20, fontWeight: '900' },
  matchBubbleSub: { fontSize: 10, fontWeight: '700' },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagGreen: { backgroundColor: '#D1FAE5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagGreenText: { fontSize: 12, fontWeight: '700', color: '#065F46' },
  tagNeutral: { backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagNeutralText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  tagRed: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagRedText: { fontSize: 12, fontWeight: '600', color: colors.error },

  // Highlights
  highlights: { flexDirection: 'row', gap: 8 },

  // Section
  section: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },

  // AI Tools
  aiToolsRow: { flexDirection: 'row', gap: 8 },

  // AI Panel
  aiPanel: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: colors.primaryLight, gap: 12,
  },
  aiPanelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiPanelTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  panelErr: { fontSize: 13, color: colors.error, textAlign: 'center' },
  panelSub: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scoreBig: { fontSize: 36, fontWeight: '900', color: colors.textPrimary },
  scoreOf: { fontSize: 15, color: colors.textSecondary, marginRight: 10 },
  verdictPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  verdictText: { fontSize: 12, fontWeight: '700' },
  gapRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  gapSkill: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  gapMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  impBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },

  // Action grid
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionTile: {
    flex: 1, minWidth: '44%', alignItems: 'center', gap: 8,
    backgroundColor: '#F8FAFC', borderRadius: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  actionTileText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },

  // Description
  descText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  showMoreText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  // Source
  srcBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primaryLight, borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  srcBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },

  // Similar
  similarList: { gap: 0 },
  similarCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border,
  },
  simLogo: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  simLogoText: { fontSize: 16, fontWeight: '800' },
  simTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  simCompany: { fontSize: 12, color: colors.textSecondary },
  simMatch: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  // Sticky bar
  stickyBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  stickyQuickApply: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14,
  },
  stickyQuickText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  stickyFullApply: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primaryLight, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  stickyFullText: { fontSize: 15, fontWeight: '800', color: colors.primary },
  });
}