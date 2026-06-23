import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), delete: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    HR_MY_JOBS: '/api/hr/my-jobs',
    HR_DELETE_JOB: (id: number) => `/api/hr/jobs/${id}`,
  },
}));

import apiClient from '../api/apiClient';
import HrMyJobsScreen from '../screens/jobs/HrMyJobsScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockDelete = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const JOBS = [
  {
    id: 1, title: 'Backend Developer', company: 'Acme Corp', location: 'Chennai',
    isRemote: false, category: 'Technology', salaryMin: 1200000, salaryMax: 1800000,
    postedAt: '2026-06-01T10:00:00', active: true, applicantCount: 12,
  },
  {
    id: 2, title: 'Frontend Engineer', company: 'Startup Ltd', location: 'Bangalore',
    isRemote: true, category: 'Technology', salaryMin: null, salaryMax: null,
    postedAt: '2026-06-05T10:00:00', active: true, applicantCount: 5,
  },
];

describe('HrMyJobsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: JOBS });
  });

  it('loads and displays jobs', async () => {
    render(<HrMyJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Backend Developer')).toBeTruthy();
      expect(screen.getByText('Frontend Engineer')).toBeTruthy();
    });
  });

  it('shows salary range for jobs with salary', async () => {
    render(<HrMyJobsScreen />);

    await waitFor(() => {
      // salaryMin: 1200000, salaryMax: 1800000 → "₹12L – ₹18L"
      expect(screen.getByText(/₹12L/)).toBeTruthy();
    });
  });

  it('shows empty state when no jobs', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<HrMyJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText('No job postings yet')).toBeTruthy();
    });
  });

  it('shows Post Your First Job button in empty state', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<HrMyJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Post Your First Job')).toBeTruthy();
    });
  });

  it('shows error alert on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    render(<HrMyJobsScreen />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Could not load your job postings.');
    });
  });

  it('calls DELETE endpoint when delete is confirmed', async () => {
    mockDelete.mockResolvedValueOnce({ data: {} });
    alertSpy.mockImplementationOnce((_, __, buttons: any[]) => {
      buttons?.find((b: any) => b.style === 'destructive')?.onPress?.();
    });

    render(<HrMyJobsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Backend Developer')).toBeTruthy();
    });

    fireEvent.press(screen.getAllByTestId('delete-job-btn')[0]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/api/hr/jobs/1');
    });
  });
});
