import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../constants', () => ({
  API_ENDPOINTS: { RESUMES: '/api/resumes' },
}));

import apiClient from '../api/apiClient';
import ResumeListScreen from '../screens/resume/ResumeListScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

const RESUME_PARSED = {
  id: 1,
  versionName: 'My Resume v1',
  fileUrl: 'https://cdn.com/r1.pdf',
  aiScore: 78,
  isOriginal: true,
  isParsed: true,
  createdAt: '2026-05-01T10:00:00',
};

const RESUME_UNPARSED = {
  id: 2,
  versionName: 'Old Resume',
  fileUrl: 'https://cdn.com/r2.pdf',
  aiScore: null,
  isOriginal: false,
  isParsed: false,
  createdAt: '2026-04-01T10:00:00',
};

describe('ResumeListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator on initial load', async () => {
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    render(<ResumeListScreen />);

    expect(screen.getByTestId('resumes-loading')).toBeTruthy();
  });

  it('renders resume cards after load', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED, RESUME_UNPARSED] });
    render(<ResumeListScreen />);

    await waitFor(() => {
      expect(screen.getByText('My Resume v1')).toBeTruthy();
      expect(screen.getByText('Old Resume')).toBeTruthy();
    });
  });

  it('shows AI score for parsed resumes', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED] });
    render(<ResumeListScreen />);

    await waitFor(() => {
      expect(screen.getByText('78')).toBeTruthy();
    });
  });

  it('shows "Not analyzed" for resumes without score', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_UNPARSED] });
    render(<ResumeListScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('resume-no-score-2')).toBeTruthy();
    });
  });

  it('shows "Parsed" badge for parsed resumes', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED] });
    render(<ResumeListScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('parsed-badge-1')).toBeTruthy();
    });
  });

  it('shows empty state when no resumes', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<ResumeListScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('resumes-empty-state')).toBeTruthy();
    });
  });

  it('shows error state on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Server error'));
    render(<ResumeListScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('resumes-error')).toBeTruthy();
    });
  });

  it('has upload button that navigates to upload screen', async () => {
    const navigate = jest.fn();
    jest.requireMock('@react-navigation/native').useNavigation.mockReturnValue({ navigate });
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<ResumeListScreen />);

    await waitFor(() => screen.getByTestId('upload-resume-btn'));
    fireEvent.press(screen.getByTestId('upload-resume-btn'));

    expect(navigate).toHaveBeenCalledWith('ResumeUpload');
  });

  it('navigates to detail when resume card pressed', async () => {
    const navigate = jest.fn();
    jest.requireMock('@react-navigation/native').useNavigation.mockReturnValue({ navigate });
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED] });
    render(<ResumeListScreen />);

    await waitFor(() => screen.getByTestId('resume-card-1'));
    fireEvent.press(screen.getByTestId('resume-card-1'));

    expect(navigate).toHaveBeenCalledWith('ResumeDetail', { resumeId: 1 });
  });
});
