import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { Audio } from 'expo-av';
import { COLORS, API_ENDPOINTS } from '../../constants';
import { InterviewStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { InterviewAnswerResponse, InterviewQuestion } from '../../types/api.types';
import apiClient from '../../api/apiClient';

type RouteProps = RouteProp<InterviewStackParamList, 'InterviewQuestion'>;
type Nav = NativeStackNavigationProp<InterviewStackParamList, 'InterviewQuestion'>;

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  TECHNICAL:   { bg: '#DBEAFE', text: '#1D4ED8' },
  BEHAVIORAL:  { bg: '#D1FAE5', text: '#065F46' },
  SITUATIONAL: { bg: '#FEF3C7', text: '#92400E' },
  HR:          { bg: '#EDE9FE', text: '#5B21B6' },
};

type AnswerMode = 'text' | 'voice';
type ScreenState = 'answering' | 'submitting' | 'result';

export default function InterviewQuestionScreen() {
  const { params } = useRoute<RouteProps>();
  const navigation = useNavigation<Nav>();
  const session = useSelector((s: RootState) => s.interview.currentSession);

  const { sessionId, questionIndex } = params;

  const questions = session?.questions
    ? [...session.questions].sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    : [];
  const total = questions.length;
  const question: InterviewQuestion | undefined = questions[questionIndex];

  const [mode, setMode] = useState<AnswerMode>('text');
  const [answerText, setAnswerText] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('answering');
  const [result, setResult] = useState<InterviewAnswerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Voice recording state
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      stopTimerAndRecording();
    };
  }, []);

  async function stopTimerAndRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
  }

  async function toggleRecording() {
    if (isRecording) {
      // Stop recording
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        await recordingRef.current?.stopAndUnloadAsync();
        const uri = recordingRef.current?.getURI() ?? null;
        setRecordingUri(uri);
      } catch {
        setError('Failed to stop recording. Please try again.');
      }
      recordingRef.current = null;
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const { granted } = await Audio.requestPermissionsAsync();
        if (!granted) {
          Alert.alert(
            'Microphone Access',
            'Please allow microphone access in Settings to use voice mode.',
          );
          return;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        setRecordingUri(null);
        setRecordSeconds(0);
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
        );
        recordingRef.current = recording;
        setIsRecording(true);
        timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      } catch {
        setError('Could not start recording. Check microphone permissions.');
      }
    }
  }

  async function handleSubmit() {
    if (!question) return;

    if (mode === 'text' && answerText.trim().length < 10) {
      setError('Please write at least a few sentences before submitting.');
      return;
    }
    if (mode === 'voice' && !recordingUri) {
      setError('Record your answer before submitting.');
      return;
    }

    setError(null);
    setScreenState('submitting');

    try {
      const formData = new FormData();
      formData.append('questionId', String(question.id));

      if (mode === 'text') {
        formData.append('answerText', answerText.trim());
      } else {
        formData.append('audioFile', {
          uri: recordingUri!,
          type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
          name: 'answer.m4a',
        } as any);
      }

      const { data } = await apiClient.post<InterviewAnswerResponse>(
        API_ENDPOINTS.INTERVIEW_ANSWER(sessionId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setResult(data);
      setScreenState('result');
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data?.error ??
        'Submission failed. Please try again.';
      setError(msg);
      setScreenState('answering');
    }
  }

  function handleNext() {
    if (result?.sessionComplete) {
      navigation.replace('InterviewReport', { sessionId });
    } else {
      navigation.replace('InterviewQuestion', {
        sessionId,
        questionIndex: questionIndex + 1,
      });
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  if (!question) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.error} />
        <Text style={styles.errorText}>Question not found. Please restart the session.</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => navigation.navigate('InterviewStart', undefined)}
        >
          <Text style={styles.retryBtnText}>Back to Interviews</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeStyle = TYPE_COLORS[question.questionType] ?? { bg: COLORS.border, text: COLORS.textSecondary };
  const scoreColor =
    result == null
      ? COLORS.textMuted
      : result.aiScore >= 8
      ? COLORS.success
      : result.aiScore >= 5
      ? COLORS.warning
      : COLORS.error;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((questionIndex + 1) / total) * 100}%` as any },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {questionIndex + 1} / {total}
        </Text>
      </View>

      {/* Question card */}
      <View style={styles.questionCard}>
        <View style={styles.questionCardTop}>
          <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
            <Text style={[styles.typeText, { color: typeStyle.text }]}>
              {question.questionType}
            </Text>
          </View>
          <Text style={styles.qNum}>Q{questionIndex + 1}</Text>
        </View>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>

      {/* Result view */}
      {screenState === 'result' && result && (
        <>
          <View style={[styles.scoreBanner, { borderColor: scoreColor }]}>
            <View style={styles.scoreLeft}>
              <Text style={[styles.scoreBig, { color: scoreColor }]}>
                {result.aiScore}
              </Text>
              <Text style={[styles.scoreMax, { color: scoreColor }]}>/10</Text>
            </View>
            <View style={styles.scoreRight}>
              <Text style={styles.scoreLabel}>AI Score</Text>
              <Text
                style={[
                  styles.scoreVerdict,
                  { color: scoreColor },
                ]}
              >
                {result.aiScore >= 8
                  ? 'Excellent answer'
                  : result.aiScore >= 6
                  ? 'Good answer'
                  : result.aiScore >= 4
                  ? 'Fair — room to improve'
                  : 'Needs work'}
              </Text>
            </View>
          </View>

          {result.answerText && (
            <>
              <Text style={styles.sectionLabel}>Your Answer</Text>
              <View style={styles.answerBox}>
                <Text style={styles.answerBoxText}>{result.answerText}</Text>
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>AI Feedback</Text>
          <View style={styles.feedbackBox}>
            <Ionicons name="bulb-outline" size={16} color={COLORS.warning} style={{ marginTop: 1 }} />
            <Text style={styles.feedbackText}>{result.aiFeedback}</Text>
          </View>

          {result.sessionComplete && result.overallScore != null && (
            <View style={styles.sessionCompleteBanner}>
              <Ionicons name="trophy-outline" size={18} color={COLORS.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionCompleteTitle}>Session complete!</Text>
                <Text style={styles.sessionCompleteSubtext}>
                  Overall score: {result.overallScore.toFixed(1)}/10
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {result.sessionComplete ? 'View Full Report' : 'Next Question'}
            </Text>
            <Ionicons
              name={result.sessionComplete ? 'bar-chart-outline' : 'arrow-forward'}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </>
      )}

      {/* Answer input — only shown while answering */}
      {screenState !== 'result' && (
        <>
          {/* Mode toggle */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'text' && styles.modeTabActive]}
              onPress={() => setMode('text')}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={mode === 'text' ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.modeTabText, mode === 'text' && styles.modeTabTextActive]}>
                Type
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'voice' && styles.modeTabActive]}
              onPress={() => setMode('voice')}
            >
              <Ionicons
                name="mic-outline"
                size={16}
                color={mode === 'voice' ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.modeTabText, mode === 'voice' && styles.modeTabTextActive]}>
                Voice
              </Text>
            </TouchableOpacity>
          </View>

          {/* Text input */}
          {mode === 'text' && (
            <TextInput
              style={styles.textInput}
              placeholder="Type your answer here…"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={8}
              value={answerText}
              onChangeText={setAnswerText}
              textAlignVertical="top"
              editable={screenState === 'answering'}
            />
          )}

          {/* Voice input */}
          {mode === 'voice' && (
            <View style={styles.voiceContainer}>
              <TouchableOpacity
                style={[styles.micBtn, isRecording && styles.micBtnRecording]}
                onPress={toggleRecording}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={36}
                  color="#fff"
                />
              </TouchableOpacity>

              {isRecording && (
                <View style={styles.recordingRow}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingTime}>{formatTime(recordSeconds)}</Text>
                  <Text style={styles.recordingHint}>Recording… tap to stop</Text>
                </View>
              )}

              {!isRecording && recordingUri && (
                <View style={styles.recordingReadyRow}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.recordingReadyText}>
                    Recording ready ({formatTime(recordSeconds)})
                  </Text>
                  <TouchableOpacity onPress={() => { setRecordingUri(null); setRecordSeconds(0); }}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              )}

              {!isRecording && !recordingUri && (
                <Text style={styles.voiceHint}>Tap the microphone to start recording</Text>
              )}
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (screenState === 'submitting' ||
                (mode === 'text' && answerText.trim().length < 10) ||
                (mode === 'voice' && !recordingUri && !isRecording)) &&
                styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={
              screenState === 'submitting' ||
              isRecording ||
              (mode === 'text' && answerText.trim().length < 10) ||
              (mode === 'voice' && !recordingUri)
            }
          >
            {screenState === 'submitting' ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitBtnText}>AI is evaluating…</Text>
              </>
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Answer</Text>
              </>
            )}
          </TouchableOpacity>

          {screenState === 'submitting' && (
            <Text style={styles.submittingHint}>
              {mode === 'voice'
                ? 'Transcribing audio then evaluating with AI… ~20 seconds'
                : 'Evaluating your answer with AI… ~10 seconds'}
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 48 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, minWidth: 36 },

  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  questionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  qNum: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  questionText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 24 },

  modeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.border,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabActive: { backgroundColor: COLORS.surface },
  modeTabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  modeTabTextActive: { color: COLORS.primary },

  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 160,
    lineHeight: 22,
    marginBottom: 16,
  },

  voiceContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  micBtnRecording: { backgroundColor: COLORS.error },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  recordingTime: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  recordingHint: { fontSize: 13, color: COLORS.textSecondary },
  recordingReadyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  recordingReadyText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.success },
  voiceHint: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorBoxText: { flex: 1, fontSize: 13, color: COLORS.error },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  submitBtnDisabled: { backgroundColor: COLORS.textMuted },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  submittingHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },

  // Result styles
  scoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
  },
  scoreLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  scoreBig: { fontSize: 40, fontWeight: '800', lineHeight: 46 },
  scoreMax: { fontSize: 16, fontWeight: '600' },
  scoreRight: { flex: 1 },
  scoreLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  scoreVerdict: { fontSize: 15, fontWeight: '700', marginTop: 2 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  answerBox: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 16,
  },
  answerBoxText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },

  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  feedbackText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },

  sessionCompleteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sessionCompleteTitle: { fontSize: 15, fontWeight: '700', color: COLORS.success },
  sessionCompleteSubtext: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
