import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), dispatch: jest.fn() })),
  useRoute: jest.fn(() => ({ params: { jobId: 10 } })),
  CommonActions: { navigate: jest.fn((x) => x) },
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
    APPLICATIONS_APPLY: '/api/applications/apply',
    APPLICATIONS: '/api/applications',
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
import applicationReducer from '../store/slices/applicationSlice';
import ApplyJobScreen from '../screens/jobs/ApplyJobScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const JOB = {
  id: 10,
  title: 'Senior Engineer',
  company: 'Acme Corp',
  description: 'Build amazing Java apps',
  location: 'Bangalore',
  isRemote: false,
  salaryMin: 1000000,
  salaryMax: 2000000,
  source: 'NAUKRI',
  sourceUrl: null,
  saved: false,
  scrapedAt: '2026-06-01',
  category: null,
  deadline: null,
};

const RESUMES = [
  { id: 5, versionName: 'My Resume', fileUrl: 'https://cdn.com/r.pdf', aiScore: 80, isOriginal: true, isParsed: true, createdAt: '2026-01-01' },
];

const BASE_JOB_STATE = {
  feed: [], selected: null, currentPage: 0, totalElements: 0,
  matchScores: {}, isLoading: false, error: null,
};
const BASE_RESUME_STATE = {
  list: [], isLoading: false, isUploading: false, error: null,
};
const BASE_APP_STATE = {
  list: [], isLoading: false, error: null,
};

function makeStore(withResumes = false) {
  return configureStore({
    reducer: {
      job: jobReducer,
      resume: resumeReducer,
      application: applicationReducer,
    },
    preloadedState: {
      job: { ...BASE_JOB_STATE, selected: JOB },
      resume: withResumes
        ? { ...BASE_RESUME_STATE, list: RESUMES }
        : BASE_RESUME_STATE,
      application: BASE_APP_STATE,
    },
  });
}

function renderScreen(withResumes = false) {
  return render(
    <Provider store={makeStore(withResumes)}>
      <ApplyJobScreen />
    </Provider>
  );
}

describe('ApplyJobScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows loading state initially when resumes are not yet loaded', () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    renderScreen(false);

    expect(screen.getByTestId('apply-loading')).toBeTruthy();
  });

  it('renders job title and company from Redux store', async () => {
    renderScreen(true);

    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });
  });

  it('shows resume name when resumes are loaded', async () => {
    renderScreen(true);

    await waitFor(() => {
      expect(screen.getByText('My Resume')).toBeTruthy();
    });
  });

  it('shows submit button enabled after resume auto-selected', async () => {
    renderScreen(true);

    await waitFor(() => {
      expect(screen.getByTestId('apply-submit-btn')).toBeTruthy();
    });
    expect(screen.getByTestId('apply-submit-btn')).not.toBeDisabled();
  });

  it('shows warm-up message when server is cold (delay > 5s)', async () => {
    mockPost.mockImplementation(() => new Promise(() => {}));
    renderScreen(true);

    await waitFor(() => screen.getByTestId('apply-submit-btn'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('apply-submit-btn'));
    });

    act(() => { jest.advanceTimersByTime(6000); });

    await waitFor(() => {
      expect(screen.getByTestId('warmup-message')).toBeTruthy();
    });
  });

  it('shows success state after successful apply', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 100, status: 'APPLIED' } });
    renderScreen(true);

    await waitFor(() => screen.getByTestId('apply-submit-btn'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('apply-submit-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('apply-success')).toBeTruthy();
    });
  });

  it('shows error when apply fails', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 400, data: { message: 'Already applied' } } });
    renderScreen(true);

    await waitFor(() => screen.getByTestId('apply-submit-btn'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('apply-submit-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('apply-error')).toBeTruthy();
    });
  });

  it('disables submit button when no resume is selected', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    renderScreen(false);

    await waitFor(() => screen.getByTestId('apply-submit-btn'));

    expect(screen.getByTestId('apply-submit-btn')).toBeDisabled();
  });

  it('shows cover letter input field', async () => {
    renderScreen(true);

    await waitFor(() => {
      expect(screen.getByTestId('cover-letter-input')).toBeTruthy();
    });
  });
});
