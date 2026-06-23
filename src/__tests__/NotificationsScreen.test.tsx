import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    JOB_ALERTS: '/api/alerts',
  },
}));

import apiClient from '../api/apiClient';
import NotificationsScreen from '../screens/common/NotificationsScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

const ALERTS = [
  {
    id: 1, keywords: 'Java Developer', remote: false, minSalary: 1200000,
    category: 'Technology', active: true, createdAt: '2026-06-01T10:00:00',
  },
  {
    id: 2, keywords: 'Product Manager', remote: true, minSalary: null,
    category: null, active: true, createdAt: '2026-06-03T10:00:00',
  },
];

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: ALERTS });
  });

  it('shows alert-derived notifications after load', async () => {
    render(<NotificationsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Job Alert: Java Developer/i)).toBeTruthy();
      expect(screen.getByText(/Job Alert: Product Manager/i)).toBeTruthy();
    });
  });

  it('shows static tip notifications', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<NotificationsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Complete your profile')).toBeTruthy();
    });
  });

  it('shows salary filter in notification body', async () => {
    render(<NotificationsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Min ₹12L/i)).toBeTruthy();
    });
  });

  it('shows Remote only label for remote alerts', async () => {
    render(<NotificationsScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Remote only/i)).toBeTruthy();
    });
  });

  it('renders empty state gracefully when no alerts and no tips shown', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<NotificationsScreen />);

    await waitFor(() => {
      // Tips are always shown even without alerts
      expect(screen.getByText('Complete your profile')).toBeTruthy();
    });
  });

  it('calls JOB_ALERTS endpoint on mount', async () => {
    render(<NotificationsScreen />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/api/alerts');
    });
  });

  it('renders gracefully on load error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    render(<NotificationsScreen />);

    await waitFor(() => {
      // Shows static tips even when API fails
      expect(screen.getByText('Complete your profile')).toBeTruthy();
    });
  });
});
