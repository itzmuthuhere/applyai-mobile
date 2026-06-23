import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', secondary: '#10B981',
    background: '#F8FAFC', surface: '#FFFFFF', textPrimary: '#0F172A',
    textSecondary: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
    error: '#EF4444', warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    JOBS: '/api/jobs',
    RESUMES: '/api/resumes',
    AUTO_APPLY_QUEUE: '/api/auto-apply/queue',
  },
}));

import apiClient from '../api/apiClient';
import JobFeedScreen from '../screens/jobs/JobFeedScreen';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const JOB = {
  id: 10,
  title: 'Senior Engineer',
  company: 'Acme Corp',
  location: 'Bangalore',
  source: 'NAUKRI',
  isRemote: false,
  saved: false,
  salaryMin: 1000000,
  salaryMax: 2000000,
  scrapedAt: '2026-06-01',
  description: 'Build things',
  sourceUrl: null,
  category: null,
  deadline: null,
};

const JOB_2 = { ...JOB, id: 11, title: 'Backend Dev', company: 'TechCo' };

const RESUME = {
  id: 5,
  versionName: 'My Resume',
  fileUrl: 'https://cdn.com/r.pdf',
  aiScore: 80,
  isOriginal: true,
  isParsed: true,
  createdAt: '2026-01-01',
};

function makeStore(role = 'JOBSEEKER') {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        jwt: 'test-token',
        user: { id: 1, email: 't@t.com', name: 'Test', role, subscriptionPlan: 'FREE', targetRole: null, targetLocation: null, minSalary: null, remotePreference: null, skills: null, headline: null, createdAt: '2026-01-01' },
        isLoading: false,
        error: null,
      },
    },
  });
}

function renderScreen(role = 'JOBSEEKER') {
  return render(
    <Provider store={makeStore(role)}>
      <JobFeedScreen />
    </Provider>
  );
}

describe('JobFeedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    renderScreen();

    expect(screen.getByTestId('jobs-loading')).toBeTruthy();
  });

  it('renders job cards after load', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [JOB, JOB_2], totalElements: 2, number: 0, totalPages: 1 },
    });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
      expect(screen.getByText('Backend Dev')).toBeTruthy();
    });
  });

  it('shows Select button for JOBSEEKER users', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 },
    });
    renderScreen('JOBSEEKER');

    await waitFor(() => {
      expect(screen.getByTestId('select-btn')).toBeTruthy();
    });
  });

  it('does NOT show Select button for HR users', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 },
    });
    renderScreen('HR');

    await waitFor(() => {
      expect(screen.queryByTestId('select-btn')).toBeNull();
    });
  });

  it('enters select mode when Select is pressed', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB, JOB_2], totalElements: 2, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });

    renderScreen();

    await waitFor(() => screen.getByTestId('select-btn'));
    fireEvent.press(screen.getByTestId('select-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('select-all-btn')).toBeTruthy();
      expect(screen.getByTestId('cancel-select-btn')).toBeTruthy();
    });
  });

  it('shows Auto Apply bar when jobs are selected', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });

    renderScreen();

    await waitFor(() => screen.getByTestId('select-btn'));
    fireEvent.press(screen.getByTestId('select-btn'));

    await waitFor(() => screen.getByTestId(`job-card-10`));
    fireEvent.press(screen.getByTestId('job-card-10'));

    await waitFor(() => {
      expect(screen.getByTestId('auto-apply-bar')).toBeTruthy();
    });
  });

  it('selects all jobs when Select All is pressed', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB, JOB_2], totalElements: 2, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });

    renderScreen();

    await waitFor(() => screen.getByTestId('select-btn'));
    fireEvent.press(screen.getByTestId('select-btn'));

    await waitFor(() => screen.getByTestId('select-all-btn'));
    fireEvent.press(screen.getByTestId('select-all-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-count')).toBeTruthy();
      expect(screen.getByText(/2 selected/i)).toBeTruthy();
    });
  });

  it('exits select mode when Cancel is pressed', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });

    renderScreen();

    await waitFor(() => screen.getByTestId('select-btn'));
    fireEvent.press(screen.getByTestId('select-btn'));

    await waitFor(() => screen.getByTestId('cancel-select-btn'));
    fireEvent.press(screen.getByTestId('cancel-select-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('cancel-select-btn')).toBeNull();
      expect(screen.getByTestId('select-btn')).toBeTruthy();
    });
  });

  it('navigates to JobDetail in normal mode on card press', async () => {
    const navigate = jest.fn();
    jest.requireMock('@react-navigation/native').useNavigation.mockReturnValue({ navigate });
    mockGet.mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } });

    renderScreen();

    await waitFor(() => screen.getByTestId('job-card-10'));
    fireEvent.press(screen.getByTestId('job-card-10'));

    expect(navigate).toHaveBeenCalledWith('JobDetail', { jobId: 10 });
  });

  it('calls auto-apply API and navigates to queue on submit', async () => {
    const navigate = jest.fn();
    jest.requireMock('@react-navigation/native').useNavigation.mockReturnValue({ navigate });

    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });
    mockPost.mockResolvedValueOnce({ data: [{ id: 1, status: 'PENDING' }] });

    renderScreen();

    await waitFor(() => screen.getByTestId('select-btn'));
    fireEvent.press(screen.getByTestId('select-btn'));

    await waitFor(() => screen.getByTestId('job-card-10'));
    fireEvent.press(screen.getByTestId('job-card-10'));

    await waitFor(() => screen.getByTestId('auto-apply-submit-btn'));
    fireEvent.press(screen.getByTestId('auto-apply-submit-btn'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/auto-apply/queue', { jobIds: [10], resumeId: 5 });
      expect(navigate).toHaveBeenCalledWith('AutoApplyQueue');
    });
  });

  it('shows empty state when no jobs found', async () => {
    mockGet.mockResolvedValueOnce({ data: { content: [], totalElements: 0, number: 0, totalPages: 0 } });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('jobs-empty-state')).toBeTruthy();
    });
  });
});
