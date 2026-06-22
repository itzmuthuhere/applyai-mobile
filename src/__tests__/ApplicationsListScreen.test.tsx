import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../constants', () => ({
  API_ENDPOINTS: {
    APPLICATIONS: '/api/applications',
  },
}));

import apiClient from '../api/apiClient';
import ApplicationsListScreen from '../screens/applications/ApplicationsListScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

const APPLIED_APP = {
  id: 1,
  job: { id: 10, title: 'Senior Engineer', company: 'Acme Corp', location: 'Bangalore', source: 'NAUKRI', isRemote: false, saved: false, scrapedAt: '2026-01-01', salaryMin: null, salaryMax: null, sourceUrl: null, description: '', category: null, deadline: null },
  resume: { id: 5, versionName: 'v1', fileUrl: 'https://cdn.com/r.pdf', aiScore: 80, isOriginal: true, isParsed: true, createdAt: '2026-01-01' },
  status: 'APPLIED',
  coverLetter: null,
  appliedAt: '2026-06-01T10:00:00',
  notes: null,
  interviewDate: null,
  interviewNotes: null,
  offerSalary: null,
  offerDeadline: null,
  offerDetails: null,
};

const INTERVIEW_APP = { ...APPLIED_APP, id: 2, status: 'INTERVIEW' };
const OFFER_APP = { ...APPLIED_APP, id: 3, status: 'OFFER' };
const REJECTED_APP = { ...APPLIED_APP, id: 4, status: 'REJECTED' };

function renderScreen() {
  return render(<ApplicationsListScreen />);
}

describe('ApplicationsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    renderScreen();

    expect(screen.getByTestId('apps-loading')).toBeTruthy();
  });

  it('renders applications after load', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [APPLIED_APP, INTERVIEW_APP], totalElements: 2, totalPages: 1, number: 0 },
    });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });
  });

  it('shows ALL tab by default and all applications', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [APPLIED_APP, INTERVIEW_APP, OFFER_APP], totalElements: 3, totalPages: 1, number: 0 },
    });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('tab-ALL')).toBeTruthy();
    });
  });

  it('filters applications when INTERVIEW tab pressed', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [APPLIED_APP, INTERVIEW_APP], totalElements: 2, totalPages: 1, number: 0 },
    });
    renderScreen();

    await waitFor(() => screen.getByTestId('tab-INTERVIEW'));
    fireEvent.press(screen.getByTestId('tab-INTERVIEW'));

    await waitFor(() => {
      expect(screen.getAllByText('INTERVIEW').length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no applications', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [], totalElements: 0, totalPages: 0, number: 0 },
    });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('apps-empty-state')).toBeTruthy();
    });
  });

  it('shows error state on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Server error'));
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('apps-error')).toBeTruthy();
    });
  });

  it('displays status badge for each application', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [APPLIED_APP, REJECTED_APP], totalElements: 2, totalPages: 1, number: 0 },
    });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('APPLIED')).toBeTruthy();
      expect(screen.getByText('REJECTED')).toBeTruthy();
    });
  });

  it('navigates to detail on item press', async () => {
    const navigate = jest.fn();
    jest.requireMock('@react-navigation/native').useNavigation.mockReturnValue({ navigate });

    mockGet.mockResolvedValueOnce({
      data: { content: [APPLIED_APP], totalElements: 1, totalPages: 1, number: 0 },
    });
    renderScreen();

    await waitFor(() => screen.getByTestId('app-item-1'));
    fireEvent.press(screen.getByTestId('app-item-1'));

    expect(navigate).toHaveBeenCalledWith('ApplicationDetail', { applicationId: 1 });
  });
});
