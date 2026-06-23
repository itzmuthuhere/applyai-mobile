import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), delete: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), push: jest.fn() }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    SAVED_JOBS: '/api/jobs/saved',
    SAVE_JOB: (id: number) => `/api/jobs/${id}/save`,
  },
}));

import apiClient from '../api/apiClient';
import SavedJobsScreen from '../screens/jobs/SavedJobsScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockDelete = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;

const SAVED_JOBS = [
  {
    id: 1, title: 'Backend Developer', company: 'Acme Corp', location: 'Chennai',
    isRemote: false, salaryMin: 1200000, salaryMax: 1800000,
    postedAt: '2026-06-01T10:00:00', description: 'Build APIs', category: 'Technology',
  },
  {
    id: 2, title: 'Frontend Engineer', company: 'TechCo', location: 'Bangalore',
    isRemote: true, salaryMin: null, salaryMax: null,
    postedAt: '2026-06-05T10:00:00', description: 'Build UIs', category: 'Technology',
  },
];

describe('SavedJobsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: SAVED_JOBS });
  });

  it('loads and shows saved jobs', async () => {
    render(<SavedJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Backend Developer')).toBeTruthy();
      expect(screen.getByText('Frontend Engineer')).toBeTruthy();
    });
  });

  it('shows company name for each job', async () => {
    render(<SavedJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeTruthy();
      expect(screen.getByText('TechCo')).toBeTruthy();
    });
  });

  it('shows salary when available', async () => {
    render(<SavedJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/₹12L/i)).toBeTruthy();
    });
  });

  it('shows Remote badge for remote jobs', async () => {
    render(<SavedJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Remote')).toBeTruthy();
    });
  });

  it('shows empty state when no saved jobs', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<SavedJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/No saved jobs/i)).toBeTruthy();
    });
  });

  it('shows empty state on load failure (silently degrades)', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    render(<SavedJobsScreen />);

    await waitFor(() => {
      // Component silently catches and sets jobs=[] → shows empty state
      expect(screen.getByText(/No saved jobs/i)).toBeTruthy();
    });
  });

  it('calls unsave endpoint when bookmark tapped', async () => {
    mockDelete.mockResolvedValueOnce({ data: {} });
    render(<SavedJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Backend Developer')).toBeTruthy();
    });

    fireEvent.press(screen.getAllByTestId('unsave-btn')[0]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/api/jobs/1/save');
    });
  });
});
