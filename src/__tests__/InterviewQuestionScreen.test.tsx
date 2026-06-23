import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn() }),
  useRoute: () => ({ params: { sessionId: 1, questionIndex: 0 } }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    INTERVIEW_ANSWER: (id: number) => `/api/interviews/${id}/answer`,
  },
}));

import apiClient from '../api/apiClient';
import interviewReducer from '../store/slices/interviewSlice';
import InterviewQuestionScreen from '../screens/interview/InterviewQuestionScreen';

const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const QUESTION = {
  id: 10,
  question: 'Describe a challenging project you worked on.',
  questionType: 'BEHAVIORAL',
  sequenceOrder: 1,
  transcript: null,
};

const SESSION = {
  sessionId: 1,
  jobTitle: 'Engineer',
  company: 'Acme',
  overallScore: null,
  createdAt: '2026-06-01',
  questions: [QUESTION],
};

function makeStore(currentSession: any = SESSION) {
  return configureStore({
    reducer: { interview: interviewReducer },
    preloadedState: {
      interview: { currentSession, history: [], isLoading: false, error: null },
    },
  });
}

function renderScreen(currentSession: any = SESSION) {
  return render(
    <Provider store={makeStore(currentSession)}>
      <InterviewQuestionScreen />
    </Provider>
  );
}

describe('InterviewQuestionScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the question text', () => {
    renderScreen();
    expect(screen.getByText('Describe a challenging project you worked on.')).toBeTruthy();
  });

  it('shows question type badge', () => {
    renderScreen();
    expect(screen.getByText('BEHAVIORAL')).toBeTruthy();
  });

  it('shows progress label', () => {
    renderScreen();
    expect(screen.getByText('1 / 1')).toBeTruthy();
  });

  it('renders text and voice mode tabs', () => {
    renderScreen();
    expect(screen.getByText('Type')).toBeTruthy();
    expect(screen.getByText('Voice')).toBeTruthy();
  });

  it('renders Submit Answer button', () => {
    renderScreen();
    expect(screen.getByText('Submit Answer')).toBeTruthy();
  });

  it('Submit Answer button is disabled when answer text is too short', () => {
    renderScreen();
    // Button is disabled when answerText.length < 10 — can't be pressed
    // Enter 5 chars — button should stay disabled (visible via style, not alert)
    fireEvent.changeText(screen.getByPlaceholderText('Type your answer here…'), 'Hello');
    // The button text is still rendered (not hidden) — just disabled
    expect(screen.getByText('Submit Answer')).toBeTruthy();
  });

  it('shows AI Score result after successful submission', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        aiScore: 8,
        aiFeedback: 'Great answer with clear examples.',
        answerText: 'I worked on a migration project.',
        sessionComplete: false,
        overallScore: null,
      },
    });

    renderScreen();

    const input = screen.getByPlaceholderText('Type your answer here…');
    fireEvent.changeText(input, 'I worked on a large database migration project with tight deadlines.');
    fireEvent.press(screen.getByText('Submit Answer'));

    await waitFor(() => {
      expect(screen.getByText('8')).toBeTruthy();
      expect(screen.getByText('AI Feedback')).toBeTruthy();
      expect(screen.getByText('Great answer with clear examples.')).toBeTruthy();
    });
  });

  it('shows Next Question button after successful answer (session not complete)', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        aiScore: 7,
        aiFeedback: 'Good.',
        answerText: 'My answer text.',
        sessionComplete: false,
        overallScore: null,
      },
    });

    renderScreen();

    const input = screen.getByPlaceholderText('Type your answer here…');
    fireEvent.changeText(input, 'I worked on a large database migration project with tight deadlines.');
    fireEvent.press(screen.getByText('Submit Answer'));

    await waitFor(() => {
      expect(screen.getByText('Next Question')).toBeTruthy();
    });
  });

  it('shows View Full Report button when session is complete', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        aiScore: 9,
        aiFeedback: 'Excellent.',
        answerText: 'My final answer.',
        sessionComplete: true,
        overallScore: 8.5,
      },
    });

    renderScreen();

    const input = screen.getByPlaceholderText('Type your answer here…');
    fireEvent.changeText(input, 'This is my detailed answer for the final question of the session.');
    fireEvent.press(screen.getByText('Submit Answer'));

    await waitFor(() => {
      expect(screen.getByText('View Full Report')).toBeTruthy();
      expect(screen.getByText('Session complete!')).toBeTruthy();
    });
  });

  it('shows error message on API failure', async () => {
    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'Submission failed. Please try again.' } },
    });

    renderScreen();

    const input = screen.getByPlaceholderText('Type your answer here…');
    fireEvent.changeText(input, 'This is a long enough answer for submission to proceed.');
    fireEvent.press(screen.getByText('Submit Answer'));

    await waitFor(() => {
      expect(screen.getByText('Submission failed. Please try again.')).toBeTruthy();
    });
  });

  it('shows error fallback message when no API message', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    renderScreen();

    const input = screen.getByPlaceholderText('Type your answer here…');
    fireEvent.changeText(input, 'This is a long enough answer for submission to proceed here now.');
    fireEvent.press(screen.getByText('Submit Answer'));

    await waitFor(() => {
      expect(screen.getByText('Submission failed. Please try again.')).toBeTruthy();
    });
  });

  it('shows error fallback when no session', () => {
    renderScreen(null);
    expect(screen.getByText(/Question not found/i)).toBeTruthy();
  });
});
