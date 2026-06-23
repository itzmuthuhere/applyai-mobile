import React from 'react';
import { Share } from 'react-native';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), goBack: jest.fn() })),
  useRoute: jest.fn(() => ({ params: { jobId: 10, resumeId: 5 } })),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', secondary: '#10B981',
    background: '#F8FAFC', surface: '#FFFFFF', textPrimary: '#0F172A',
    textSecondary: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
    error: '#EF4444', warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    RESUMES: '/api/resumes',
    COVER_LETTER: '/api/ai/cover-letter',
  },
}));

jest.mock('../components/common/ResumeDropdown', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ resumes, onSelect }: { resumes: any[]; onSelect: (id: number) => void }) => {
      React.useEffect(() => {
        if (resumes && resumes.length > 0) onSelect(resumes[0].id);
      }, [resumes.length]);
      return resumes && resumes.length > 0
        ? React.createElement(Text, null, resumes[0].versionName)
        : null;
    },
  };
});

import apiClient from '../api/apiClient';
import jobReducer from '../store/slices/jobSlice';
import resumeReducer from '../store/slices/resumeSlice';
import CoverLetterScreen from '../screens/resume/CoverLetterScreen';

const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const JOB = {
  id: 10, title: 'Senior Engineer', company: 'Acme Corp', location: 'Bangalore',
  source: 'NAUKRI', isRemote: false, saved: false, scrapedAt: '2026-06-01',
  salaryMin: null, salaryMax: null, sourceUrl: null, description: '', category: null, deadline: null,
};

const RESUMES = [
  { id: 5, versionName: 'My Resume', fileUrl: 'https://cdn.com/r.pdf', aiScore: 80, isOriginal: true, isParsed: true, createdAt: '2026-01-01' },
];

function makeStore() {
  return configureStore({
    reducer: { job: jobReducer, resume: resumeReducer },
    preloadedState: {
      job: { feed: [], selected: JOB, currentPage: 0, totalElements: 0, matchScores: {}, isLoading: false, error: null },
      resume: { list: RESUMES, isLoading: false, isUploading: false, error: null },
    },
  });
}

function renderScreen() {
  return render(
    <Provider store={makeStore()}>
      <CoverLetterScreen />
    </Provider>
  );
}

describe('CoverLetterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders generate button on mount', () => {
    renderScreen();

    expect(screen.getByTestId('generate-btn')).toBeTruthy();
  });

  it('shows loading state while generating', async () => {
    mockPost.mockImplementationOnce(() => new Promise(() => {}));
    renderScreen();

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cover-letter-loading')).toBeTruthy();
    });
  });

  it('shows warm-up message after 5s delay during generation', async () => {
    mockPost.mockImplementationOnce(() => new Promise(() => {}));
    renderScreen();

    fireEvent.press(screen.getByTestId('generate-btn'));

    act(() => { jest.advanceTimersByTime(5500); });

    await waitFor(() => {
      expect(screen.getByTestId('warmup-message')).toBeTruthy();
    });
  });

  it('shows generated cover letter on success', async () => {
    mockPost.mockResolvedValueOnce({ data: { coverLetter: 'Dear Hiring Manager, I am excited...' } });
    renderScreen();

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Dear Hiring Manager/)).toBeTruthy();
    });
  });

  it('shows copy button after generation', async () => {
    mockPost.mockResolvedValueOnce({ data: { coverLetter: 'Cover letter text' } });
    renderScreen();

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('copy-btn')).toBeTruthy();
    });
  });

  it('shares cover letter on copy button press', async () => {
    mockPost.mockResolvedValueOnce({ data: { coverLetter: 'Cover letter text' } });
    renderScreen();

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => screen.getByTestId('copy-btn'));
    fireEvent.press(screen.getByTestId('copy-btn'));

    expect(Share.share).toHaveBeenCalledWith({ message: 'Cover letter text' });
  });

  it('shows error message on generation failure', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Job has no description' } } });
    renderScreen();

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cover-letter-error')).toBeTruthy();
    });
  });

  it('allows regeneration after viewing result', async () => {
    mockPost
      .mockResolvedValueOnce({ data: { coverLetter: 'First version' } })
      .mockResolvedValueOnce({ data: { coverLetter: 'Second version' } });

    renderScreen();

    fireEvent.press(screen.getByTestId('generate-btn'));
    await waitFor(() => screen.getByTestId('regenerate-btn'));
    fireEvent.press(screen.getByTestId('regenerate-btn'));

    await waitFor(() => {
      expect(screen.getByText('Second version')).toBeTruthy();
    });
    expect(mockPost).toHaveBeenCalledTimes(2);
  });
});
