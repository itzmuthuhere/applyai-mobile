import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { jobId: 10 } }),
}));

jest.mock('../components/common/ResumeDropdown', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ onSelect }: any) => (
    <TouchableOpacity testID="resume-dropdown" onPress={() => onSelect(5)}>
      <Text>My CV</Text>
    </TouchableOpacity>
  );
});

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    RESUMES: '/api/resumes',
    MATCH_SCORE: '/api/ai/match',
  },
}));

import apiClient from '../api/apiClient';
import jobReducer from '../store/slices/jobSlice';
import resumeReducer from '../store/slices/resumeSlice';
import MatchScoreScreen from '../screens/jobs/MatchScoreScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const JOB = {
  id: 10, title: 'Software Engineer', company: 'Acme Corp', location: 'Chennai',
  description: 'Build scalable APIs', isRemote: false, category: 'Technology',
  salaryMin: 1200000, salaryMax: 1800000, postedAt: '2026-06-01',
};

const RESUMES = [
  { id: 5, versionName: 'My CV', fileUrl: 'https://cdn.com/r.pdf', isParsed: true },
];

// Must match MatchScore type: strengths/gaps/recommendation (not matchedKeywords/missingKeywords)
const MATCH_SCORE = {
  matchId: 1,
  resumeId: 5,
  jobId: 10,
  jobTitle: 'Software Engineer',
  company: 'Acme Corp',
  matchScore: 78,
  strengths: ['Java expertise', 'Spring Boot experience'],
  gaps: ['Docker knowledge', 'Kubernetes experience'],
  recommendation: 'Highlight your microservices experience.',
  createdAt: '2026-06-01T10:00:00',
  cached: false,
};

function makeStore() {
  return configureStore({
    reducer: { job: jobReducer, resume: resumeReducer },
    preloadedState: {
      job: { list: [], selected: JOB, matchScores: {}, isLoading: false, error: null },
      resume: { list: [], selected: null, isLoading: false, error: null },
    },
  });
}

function renderScreen() {
  return render(
    <Provider store={makeStore()}>
      <MatchScoreScreen />
    </Provider>
  );
}

describe('MatchScoreScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: RESUMES });
  });

  it('renders job title from store after loading', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeTruthy();
    });
  });

  it('renders company name from store after loading', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });
  });

  it('renders resume dropdown after loading', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('My CV')).toBeTruthy();
    });
  });

  it('renders Analyze Match button after loading', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Analyze Match')).toBeTruthy();
    });
  });

  it('calls match API and shows score after resume selected and button pressed', async () => {
    mockPost.mockResolvedValueOnce({ data: MATCH_SCORE });

    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('resume-dropdown')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('resume-dropdown'));
    fireEvent.press(screen.getByText('Analyze Match'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/ai/match', { jobId: 10, resumeId: 5 });
      expect(screen.getByText('78')).toBeTruthy();
    });
  });

  it('shows strengths after scoring', async () => {
    mockPost.mockResolvedValueOnce({ data: MATCH_SCORE });

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('resume-dropdown')).toBeTruthy());

    fireEvent.press(screen.getByTestId('resume-dropdown'));
    fireEvent.press(screen.getByText('Analyze Match'));

    await waitFor(() => {
      expect(screen.getByText('Java expertise')).toBeTruthy();
      expect(screen.getByText('Spring Boot experience')).toBeTruthy();
    });
  });

  it('shows gaps after scoring', async () => {
    mockPost.mockResolvedValueOnce({ data: MATCH_SCORE });

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('resume-dropdown')).toBeTruthy());

    fireEvent.press(screen.getByTestId('resume-dropdown'));
    fireEvent.press(screen.getByText('Analyze Match'));

    await waitFor(() => {
      expect(screen.getByText('Docker knowledge')).toBeTruthy();
    });
  });

  it('shows error message on API failure', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { error: 'Resume not parsed yet' } } });

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('resume-dropdown')).toBeTruthy());

    fireEvent.press(screen.getByTestId('resume-dropdown'));
    fireEvent.press(screen.getByText('Analyze Match'));

    await waitFor(() => {
      expect(screen.getByText('Resume not parsed yet')).toBeTruthy();
    });
  });

  it('shows fallback error when no API message', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('resume-dropdown')).toBeTruthy());

    fireEvent.press(screen.getByTestId('resume-dropdown'));
    fireEvent.press(screen.getByText('Analyze Match'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to analyze match/i)).toBeTruthy();
    });
  });
});
