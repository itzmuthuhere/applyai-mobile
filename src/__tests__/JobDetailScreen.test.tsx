import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import jobReducer from '../store/slices/jobSlice';
import applicationReducer from '../store/slices/applicationSlice';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn(), getParent: () => ({ navigate: jest.fn() }) }),
  useRoute: () => ({ params: { jobId: 10 } }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', secondary: '#10B981',
    background: '#F8FAFC', surface: '#FFFFFF', textPrimary: '#0F172A',
    textSecondary: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
    error: '#EF4444', warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    JOB_BY_ID: (id: number) => `/api/jobs/${id}`,
    RESUMES: '/api/resumes',
    JOB_SIMILAR: (id: number) => `/api/jobs/${id}/similar`,
    SAVE_JOB: (id: number) => `/api/jobs/${id}/save`,
    QUICK_APPLY: (id: number) => `/api/applications/quick-apply/${id}`,
    AUTO_APPLY_QUEUE: '/api/auto-apply/queue',
  },
  ROUTES: {},
}));

import apiClient from '../api/apiClient';
import JobDetailScreen from '../screens/jobs/JobDetailScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const JOB = {
  id: 10, title: 'Senior Engineer', company: 'Acme Corp', location: 'Bangalore',
  source: 'NAUKRI', isRemote: false, saved: false,
  salaryMin: 1000000, salaryMax: 2000000, scrapedAt: '2026-06-01',
  description: 'Build things', sourceUrl: null, category: null, deadline: null,
};

function makeStore() {
  return configureStore({ reducer: { job: jobReducer, application: applicationReducer } });
}

function renderScreen(store = makeStore()) {
  return { store, ...render(<Provider store={store}><JobDetailScreen /></Provider>) };
}

describe('JobDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation((url: string) => {
      if (url === '/api/jobs/10') return Promise.resolve({ data: JOB });
      if (url === '/api/resumes') return Promise.resolve({ data: [] });
      if (url === '/api/jobs/10/similar') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  });

  it('loads and shows job details', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });
  });

  // Regression test for BUG-MOB-011: Easy Apply from this screen never
  // dispatched the new application to Redux, so it went missing from the
  // Mock Interview job picker (which reads state.application.list) until
  // the next app restart repopulated it.
  it('dispatches the new application to Redux on Easy Apply', async () => {
    const newApplication = { id: 42, job: JOB, status: 'APPLIED', appliedAt: '2026-07-11T10:00:00.000Z' };
    mockPost.mockResolvedValueOnce({ data: newApplication });
    const { store } = renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Easy Apply'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/applications/quick-apply/10');
    });
    await waitFor(() => {
      expect(store.getState().application.list).toContainEqual(newApplication);
    });
  });
});
