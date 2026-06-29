import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
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
    DASHBOARD_SUMMARY: '/api/dashboard/summary',
    RESUMES: '/api/resumes',
    APPLICATIONS: '/api/applications',
    INTERVIEW_HISTORY: '/api/interviews/history',
  },
}));

import apiClient from '../api/apiClient';
import HomeScreen from '../screens/home/HomeScreen';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import resumeReducer from '../store/slices/resumeSlice';
import applicationReducer from '../store/slices/applicationSlice';
import interviewReducer from '../store/slices/interviewSlice';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

const DASHBOARD_DATA = {
  resumeCount: 2,
  applicationCount: 15,
  interviewCount: 3,
  avgMatchScore: 72.5,
  avgInterviewScore: 8.0,
  applicationsByStatus: { APPLIED: 10, INTERVIEW: 3, OFFER: 2 },
  recentApplications: [
    { id: 1, jobTitle: 'Senior Engineer', company: 'Acme Corp', status: 'INTERVIEW', appliedAt: '2026-06-01T10:00:00' },
    { id: 2, jobTitle: 'Java Dev', company: 'TechCo', status: 'APPLIED', appliedAt: '2026-06-02T10:00:00' },
  ],
};

// HomeScreen makes 4 parallel calls: summary, resumes, applications, interview history.
// Resumes + interview history are now paginated (return { content: [] }).
function mockDashboardCalls() {
  mockGet
    .mockResolvedValueOnce({ data: DASHBOARD_DATA })       // summary
    .mockResolvedValueOnce({ data: { content: [] } })      // resumes (paginated)
    .mockResolvedValueOnce({ data: { content: [], totalElements: 0 } }) // applications
    .mockResolvedValueOnce({ data: { content: [] } });     // interview history (paginated)
}

function makeStore(plan = 'FREE') {
  return configureStore({
    reducer: {
      auth: authReducer,
      resume: resumeReducer,
      application: applicationReducer,
      interview: interviewReducer,
    },
    preloadedState: {
      auth: {
        jwt: 'test-token',
        user: { id: 1, email: 'test@example.com', name: 'Muthu', role: 'JOBSEEKER', subscriptionPlan: plan, targetRole: null, targetLocation: null, minSalary: null, remotePreference: null, skills: null, headline: null, createdAt: '2026-01-01' },
        isLoading: false,
        error: null,
      },
    },
  });
}

function renderScreen(plan = 'FREE') {
  return render(
    <Provider store={makeStore(plan)}>
      <HomeScreen />
    </Provider>
  );
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    renderScreen();

    expect(screen.getByTestId('dashboard-loading')).toBeTruthy();
  });

  it('renders summary stats after load', async () => {
    mockDashboardCalls();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('15')).toBeTruthy();
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    });
  });

  it('shows avg match score', async () => {
    mockDashboardCalls();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('72.5%')).toBeTruthy();
    });
  });

  it('shows recent applications section', async () => {
    mockDashboardCalls();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
      expect(screen.getByText('Java Dev')).toBeTruthy();
    });
  });

  it('shows FREE plan badge for free users', async () => {
    mockDashboardCalls();
    renderScreen('FREE');

    await waitFor(() => {
      expect(screen.getByTestId('plan-badge-FREE')).toBeTruthy();
    });
  });

  it('shows PRO plan badge for pro users', async () => {
    mockDashboardCalls();
    renderScreen('PRO');

    await waitFor(() => {
      expect(screen.getByTestId('plan-badge-PRO')).toBeTruthy();
    });
  });

  it('shows error state on API failure', async () => {
    mockGet.mockRejectedValue(new Error('Server error'));
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-error')).toBeTruthy();
    });
  });

  it('shows application status breakdown', async () => {
    mockDashboardCalls();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('status-breakdown')).toBeTruthy();
    });
  });

  it('shows user greeting with name', async () => {
    mockDashboardCalls();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/Muthu/i)).toBeTruthy();
    });
  });

  it('renders all quick action chip labels', async () => {
    mockDashboardCalls();
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Upload Resume')).toBeTruthy();
      expect(screen.getByText('Browse Jobs')).toBeTruthy();
      expect(screen.getByText('Mock Interview')).toBeTruthy();
      expect(screen.getByText('Applications')).toBeTruthy();
    });
  });
});
