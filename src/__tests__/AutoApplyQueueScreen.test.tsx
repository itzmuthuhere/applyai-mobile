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

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ goBack: jest.fn(), setOptions: jest.fn() })),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', secondary: '#10B981',
    background: '#F8FAFC', surface: '#FFFFFF', textPrimary: '#0F172A',
    textSecondary: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
    error: '#EF4444', warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    AUTO_APPLY_QUEUE: '/api/auto-apply/queue',
    AUTO_APPLY_DELETE: (id: number) => `/api/auto-apply/${id}`,
    AUTO_APPLY_DELETE_BATCH: '/api/auto-apply/queue/batch',
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
      expect(screen.getAllByText('Senior Engineer').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Acme Corp/).length).toBeGreaterThan(0);
    });
  });

  it('shows PENDING status badge for pending items', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getAllByText('Queued').length).toBeGreaterThan(0);
    });
  });

  it('shows APPLIED status badge for applied items', async () => {
    mockGet.mockResolvedValueOnce({ data: [APPLIED_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
    });
  });

  it('shows match score pill', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('82% match')).toBeTruthy();
    });
  });

  it('shows "Tailored" badge when tailoredResumeText is present', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Resume tailored')).toBeTruthy();
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

  it('renders queue items when API returns a paginated Page response (regression, BUG-062)', async () => {
    mockGet.mockResolvedValueOnce({ data: { content: [PENDING_ITEM, APPLIED_ITEM], totalPages: 1, totalElements: 2 } });
    renderScreen();

    await waitFor(() => {
      expect(screen.getAllByText('Senior Engineer').length).toBeGreaterThan(0);
      expect(screen.getByTestId('queue-summary-bar')).toBeTruthy();
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

  it('shows "Cover letter ready" badge when tailoredCoverLetterText is present', async () => {
    mockGet.mockResolvedValueOnce({ data: [{ ...PENDING_ITEM, tailoredCoverLetterText: 'Dear Hiring Manager...' }] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Cover letter ready')).toBeTruthy();
    });
  });

  it('enters select mode and shows selected count', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM, { ...PENDING_ITEM, id: 3 }] });
    renderScreen();

    await waitFor(() => screen.getByTestId('queue-select-toggle'));
    fireEvent.press(screen.getByTestId('queue-select-toggle'));

    await waitFor(() => screen.getByTestId('queue-card-1'));
    fireEvent.press(screen.getByTestId('queue-card-1'));

    expect(screen.getByText('1 selected')).toBeTruthy();
  });

  it('select all selects every removable item', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM, APPLIED_ITEM] });
    renderScreen();

    await waitFor(() => screen.getByTestId('queue-select-toggle'));
    fireEvent.press(screen.getByTestId('queue-select-toggle'));

    await waitFor(() => screen.getByTestId('queue-select-all-btn'));
    fireEvent.press(screen.getByTestId('queue-select-all-btn'));

    // APPLIED_ITEM is not removable, so only PENDING_ITEM (id 1) gets selected
    expect(screen.getByText('1 selected')).toBeTruthy();
  });

  it('cancel exits select mode and clears selection', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM] });
    renderScreen();

    await waitFor(() => screen.getByTestId('queue-select-toggle'));
    fireEvent.press(screen.getByTestId('queue-select-toggle'));

    await waitFor(() => screen.getByTestId('queue-card-1'));
    fireEvent.press(screen.getByTestId('queue-card-1'));
    expect(screen.getByText('1 selected')).toBeTruthy();

    fireEvent.press(screen.getByTestId('queue-cancel-select-btn'));

    expect(screen.queryByTestId('queue-bulk-bar')).toBeNull();
  });

  it('bulk removes selected items after confirmation', async () => {
    mockGet.mockResolvedValueOnce({ data: [PENDING_ITEM, { ...PENDING_ITEM, id: 3, jobTitle: 'Other Job' }] });
    mockDelete.mockResolvedValueOnce({ data: {} });
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const confirm = buttons?.find((b: any) => b.style !== 'cancel');
      confirm?.onPress?.();
    });

    renderScreen();

    await waitFor(() => screen.getByTestId('queue-select-toggle'));
    fireEvent.press(screen.getByTestId('queue-select-toggle'));

    await waitFor(() => screen.getByTestId('queue-card-1'));
    fireEvent.press(screen.getByTestId('queue-card-1'));

    fireEvent.press(screen.getByTestId('queue-bulk-remove-btn'));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/api/auto-apply/queue/batch', { data: { ids: [1] } });
    });
    await waitFor(() => {
      expect(screen.queryByText('Senior Engineer')).toBeNull();
      expect(screen.getByText('Other Job')).toBeTruthy();
    });
  });

  it('non-removable items cannot be selected', async () => {
    mockGet.mockResolvedValueOnce({ data: [APPLIED_ITEM] });
    renderScreen();

    await waitFor(() => screen.getByTestId('queue-select-toggle'));
    fireEvent.press(screen.getByTestId('queue-select-toggle'));

    await waitFor(() => screen.getByTestId('queue-card-2'));
    fireEvent.press(screen.getByTestId('queue-card-2'));

    expect(screen.getByText('0 selected')).toBeTruthy();
  });
});
