import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), dispatch: jest.fn() }),
  useRoute: () => ({ params: { resumeId: null, jobId: 10 } }),
  CommonActions: { navigate: jest.fn() },
}));

jest.mock('../components/common/ResumeDropdown', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ onSelect }: any) => (
    <TouchableOpacity testID="resume-dropdown" onPress={() => onSelect(5)}>
      <Text>Select Resume</Text>
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
    TAILOR: '/api/resumes/tailor',
  },
}));

import apiClient from '../api/apiClient';
import jobReducer from '../store/slices/jobSlice';
import resumeReducer from '../store/slices/resumeSlice';
import TailorResumeScreen from '../screens/resume/TailorResumeScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const JOB = {
  id: 10, title: 'Software Engineer', company: 'Acme Corp', location: 'Chennai',
  description: 'Build scalable APIs', isRemote: false, category: 'Technology',
  salaryMin: null, salaryMax: null, postedAt: '2026-06-01',
};

const RESUMES = [
  { id: 5, versionName: 'My CV', fileUrl: 'https://cdn.com/r.pdf', isParsed: true },
];

// Matches TailoredResumeResponse type exactly
const TAILOR_RESULT = {
  newResumeId: 99,
  versionName: 'Tailored — Acme Corp',
  tailoredText: 'Experienced Java developer specializing in Spring Boot and microservices architecture.',
  changes: ['Updated summary', 'Added Spring Boot keywords'],
};

function makeStore() {
  return configureStore({
    reducer: { job: jobReducer, resume: resumeReducer },
    preloadedState: {
      job: { list: [], selected: JOB, matchScores: {}, isLoading: false, error: null },
      resume: { list: RESUMES, selected: null, isLoading: false, error: null },
    },
  });
}

function renderScreen() {
  return render(
    <Provider store={makeStore()}>
      <TailorResumeScreen />
    </Provider>
  );
}

describe('TailorResumeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: RESUMES });
  });

  it('renders Tailor Resume heading', () => {
    renderScreen();
    expect(screen.getByText('Tailor Resume')).toBeTruthy();
  });

  it('renders job title from store', () => {
    renderScreen();
    expect(screen.getByText('Software Engineer')).toBeTruthy();
  });

  it('renders company from store', () => {
    renderScreen();
    expect(screen.getByText('Acme Corp')).toBeTruthy();
  });

  it('renders Tailor Resume with AI button', () => {
    renderScreen();
    expect(screen.getByText('Tailor Resume with AI')).toBeTruthy();
  });

  it('calls tailor API on button press after selecting resume', async () => {
    mockPost.mockResolvedValueOnce({ data: TAILOR_RESULT });

    renderScreen();

    fireEvent.press(screen.getByTestId('resume-dropdown'));
    fireEvent.press(screen.getByText('Tailor Resume with AI'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/resumes/tailor', { jobId: 10, resumeId: 5 });
    });
  });

  it('shows tailored content after success', async () => {
    mockPost.mockResolvedValueOnce({ data: TAILOR_RESULT });

    renderScreen();

    fireEvent.press(screen.getByTestId('resume-dropdown'));
    fireEvent.press(screen.getByText('Tailor Resume with AI'));

    await waitFor(() => {
      expect(screen.getByText(/Experienced Java developer/i)).toBeTruthy();
    });
  });

  it('shows error message on API failure', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Resume not parsed. Please parse it first.' } } });

    renderScreen();

    fireEvent.press(screen.getByTestId('resume-dropdown'));
    fireEvent.press(screen.getByText('Tailor Resume with AI'));

    await waitFor(() => {
      expect(screen.getByText('Resume not parsed. Please parse it first.')).toBeTruthy();
    });
  });

  it('shows fallback error when no message from API', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    renderScreen();

    fireEvent.press(screen.getByTestId('resume-dropdown'));
    fireEvent.press(screen.getByText('Tailor Resume with AI'));

    await waitFor(() => {
      expect(screen.getByText(/Tailoring failed/i)).toBeTruthy();
    });
  });
});
