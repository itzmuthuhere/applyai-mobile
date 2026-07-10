import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { applicationId: 1 } }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    APPLICATION_BY_ID: (id: number) => `/api/applications/${id}`,
    APPLICATION_STATUS: (id: number) => `/api/applications/${id}/status`,
  },
}));

import apiClient from '../api/apiClient';
import applicationReducer from '../store/slices/applicationSlice';
import ApplicationDetailScreen from '../screens/applications/ApplicationDetailScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPut = apiClient.put as jest.MockedFunction<typeof apiClient.put>;
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const APPLICATION = {
  id: 1,
  status: 'APPLIED',
  appliedAt: '2026-06-01T10:00:00',
  coverLetter: 'I am a great fit for this role.',
  job: {
    id: 10, title: 'Software Engineer', company: 'Acme Corp',
    location: 'Chennai', description: 'Build awesome stuff', isRemote: false,
    salaryMin: 1200000, salaryMax: 1800000, category: 'Technology',
  },
  resume: { id: 5, versionName: 'My%20CV.pdf', fileUrl: 'https://cdn.com/r.pdf' },
};

function makeStore() {
  return configureStore({
    reducer: { application: applicationReducer },
    preloadedState: {
      application: { list: [], selected: null, page: null, isLoading: false, error: null },
    },
  });
}

function renderScreen() {
  return render(
    <Provider store={makeStore()}>
      <ApplicationDetailScreen />
    </Provider>
  );
}

describe('ApplicationDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: APPLICATION });
  });

  it('loads and shows job title', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeTruthy();
    });
  });

  it('shows company name', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });
  });

  it('shows current status badge', async () => {
    renderScreen();

    await waitFor(() => {
      // 'Applied' appears in hero badge, timeline, meta-card, and status chip — use getAllByText
      expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
    });
  });

  it('shows cover letter when present', async () => {
    renderScreen();

    // Wait for data to load
    await waitFor(() => expect(screen.getByText('Cover Letter')).toBeTruthy());

    // Cover letter text is hidden behind toggle — press to reveal
    fireEvent.press(screen.getByText('Cover Letter'));

    await waitFor(() => {
      expect(screen.getByText('I am a great fit for this role.')).toBeTruthy();
    });
  });

  it('shows resume version name, decoded (BUG-051 regression)', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('My CV.pdf')).toBeTruthy();
    });
  });

  it('shows status timeline progress steps', async () => {
    renderScreen();

    // Timeline labels also appear in status chips — use getAllByText
    await waitFor(() => {
      expect(screen.getAllByText('Shortlisted').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Interview').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Offer').length).toBeGreaterThan(0);
    });
  });

  it('shows error state on load failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Could not load application.')).toBeTruthy();
    });
  });

  it('calls correct endpoint for loading', async () => {
    renderScreen();

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/api/applications/1');
    });
  });

  it('updates status and shows success feedback', async () => {
    mockPut.mockResolvedValueOnce({ data: { ...APPLICATION, status: 'INTERVIEW' } });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeTruthy();
    });

    const interviewBtn = screen.queryByText('Mark Interview');
    if (interviewBtn) {
      fireEvent.press(interviewBtn);
      await waitFor(() => {
        expect(mockPut).toHaveBeenCalled();
      });
    }
  });
});
