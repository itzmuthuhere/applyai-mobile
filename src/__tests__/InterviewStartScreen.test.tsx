import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn() }),
  // useFocusEffect must defer via useEffect to avoid re-render loop during synchronous render
  useFocusEffect: (fn: any) => { require('react').useEffect(fn, []); },
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    INTERVIEW_HISTORY: '/api/interviews/history',
    APPLICATIONS: '/api/applications',
    INTERVIEW_START: '/api/interviews/start',
  },
}));

import apiClient from '../api/apiClient';
import interviewReducer from '../store/slices/interviewSlice';
import InterviewStartScreen from '../screens/interview/InterviewStartScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const SESSION = {
  sessionId: 1,
  jobTitle: 'Software Engineer',
  company: 'Acme Corp',
  overallScore: 8.5,
  createdAt: '2026-06-01T10:00:00',
  questions: [
    { id: 1, question: 'Tell me about yourself', questionType: 'BEHAVIORAL', sequenceOrder: 1, transcript: 'My answer' },
    { id: 2, question: 'React hooks?', questionType: 'TECHNICAL', sequenceOrder: 2, transcript: null },
  ],
};

function makeStore(history: any[] = []) {
  return configureStore({
    reducer: { interview: interviewReducer },
    preloadedState: { interview: { currentSession: null, history, isLoading: false, error: null } },
  });
}

function renderScreen(history: any[] = []) {
  return render(
    <Provider store={makeStore(history)}>
      <InterviewStartScreen />
    </Provider>
  );
}

describe('InterviewStartScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: [] });
  });

  it('renders hero section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('AI Mock Interviews')).toBeTruthy();
    });
  });

  it('renders Start Mock Interview button', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Start Mock Interview')).toBeTruthy();
    });
  });

  it('renders tips card', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/AI analyzes your answers/i)).toBeTruthy();
    });
  });

  it('shows empty state when no sessions', async () => {
    renderScreen([]);
    await waitFor(() => {
      expect(screen.getByText('No sessions yet')).toBeTruthy();
    });
  });

  it('loads history on mount and displays sessions', async () => {
    mockGet.mockResolvedValueOnce({ data: [SESSION] });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeTruthy();
      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });
  });

  it('shows session score when available', async () => {
    mockGet.mockResolvedValueOnce({ data: [SESSION] });

    renderScreen();

    await waitFor(() => {
      expect(screen.getAllByText('8.5').length).toBeGreaterThan(0);
    });
  });

  it('shows stat row when sessions exist', async () => {
    mockGet.mockResolvedValueOnce({ data: [SESSION] });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Sessions')).toBeTruthy();
      expect(screen.getByText('Avg Score')).toBeTruthy();
      expect(screen.getByText('Best')).toBeTruthy();
    });
  });

  it('shows answered/total progress', async () => {
    mockGet.mockResolvedValueOnce({ data: [SESSION] });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('1/2 answered')).toBeTruthy();
    });
  });

  it('shows View Report label on session cards', async () => {
    mockGet.mockResolvedValueOnce({ data: [SESSION] });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('View Report')).toBeTruthy();
    });
  });

  it('calls INTERVIEW_HISTORY endpoint on mount', async () => {
    renderScreen();

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/api/interviews/history');
    });
  });
});
