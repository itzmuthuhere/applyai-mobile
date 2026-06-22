import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../constants', () => ({
  API_ENDPOINTS: {
    AUTO_APPLY_QUEUE: '/api/auto-apply/queue',
    AUTO_APPLY_DELETE: (id: number) => `/api/auto-apply/${id}`,
  },
}));

import apiClient from '../api/apiClient';
import AutoApplyQueueScreen from '../screens/jobs/AutoApplyQueueScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockDelete = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;

const PENDING_ITEM = {
  id: 1,
  jobId: 10,
  jobTitle: 'Senior Engineer',
  company: 'Acme Corp',
  location: 'Bangalore',
  sourceUrl: 'https://example.com/job',
  status: 'PENDING',
  matchScore: 82,
  tailoredResumeText: 'Tailored content',
  queuedAt: '2026-06-20T10:00:00',
  appliedAt: null,
};

const APPLIED_ITEM = {
  ...PENDING_ITEM,
  id: 2,
  status: 'APPLIED',
  appliedAt: '2026-06-21T12:00:00',
};

function renderScreen() {
  return render(<AutoApplyQueueScreen />);
}

describe('AutoApplyQueueScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator on initial load', async () => {
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    renderScreen();

    expect(screen.getByTestId('queue-loading')).toBeTruthy();
  });

  it('renders queue items after load', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM, APPLIED_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });
  });

  it('shows PENDING status badge for pending items', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('PENDING')).toBeTruthy();
    });
  });

  it('shows APPLIED status badge for applied items', async () => {
    mockGet.mockResolvedValueOnce({ data: [APPLIED_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('APPLIED')).toBeTruthy();
    });
  });

  it('shows match score pill', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('82%')).toBeTruthy();
    });
  });

  it('shows "Tailored" badge when tailoredResumeText is present', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Tailored')).toBeTruthy();
    });
  });

  it('shows summary count bar', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM, APPLIED_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('queue-summary-bar')).toBeTruthy();
    });
  });

  it('shows empty state when queue is empty', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('queue-empty-state')).toBeTruthy();
    });
  });

  it('shows error message on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('queue-error')).toBeTruthy();
    });
  });

  it('confirms before removing item', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderScreen();

    await waitFor(() => screen.getByTestId('remove-btn-1'));
    fireEvent.press(screen.getByTestId('remove-btn-1'));

    expect(alertSpy).toHaveBeenCalled();
  });

  it('removes item from list after confirmed delete', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    mockDelete.mockResolvedValueOnce({ data: {} });
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const confirm = buttons?.find((b: any) => b.style !== 'cancel');
      confirm?.onPress?.();
    });

    renderScreen();

    await waitFor(() => screen.getByTestId('remove-btn-1'));
    fireEvent.press(screen.getByTestId('remove-btn-1'));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/api/auto-apply/1');
    });
  });

  it('shows extension hint banner', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('extension-hint-banner')).toBeTruthy();
    });
  });
});
