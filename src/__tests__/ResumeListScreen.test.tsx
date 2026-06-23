import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

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
  API_ENDPOINTS: { RESUMES: '/api/resumes' },
  ROUTES: { RESUME_DETAIL: 'ResumeDetail', RESUME_UPLOAD: 'ResumeUpload' },
}));

import apiClient from '../api/apiClient';
import resumeReducer from '../store/slices/resumeSlice';
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

function makeStore(preloaded?: Partial<{ isLoading: boolean; list: any[] }>) {
  return configureStore({
    reducer: { resume: resumeReducer },
    preloadedState: preloaded
      ? { resume: { list: preloaded.list ?? [], isLoading: preloaded.isLoading ?? false, isUploading: false, error: null } }
      : undefined,
  });
}

function renderScreen(preloaded?: Partial<{ isLoading: boolean; list: any[] }>) {
  return render(
    <Provider store={makeStore(preloaded)}>
      <ResumeListScreen />
    </Provider>
  );
}

describe('ResumeListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator on initial load', async () => {
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    renderScreen({ isLoading: true });

    expect(screen.getByTestId('resumes-loading')).toBeTruthy();
  });

  it('renders resume cards after load', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED, RESUME_UNPARSED] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('My Resume v1')).toBeTruthy();
      expect(screen.getByText('Old Resume')).toBeTruthy();
    });
  });

  it('shows AI score for parsed resumes', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('78')).toBeTruthy();
    });
  });

  it('shows "Not analyzed" for resumes without score', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_UNPARSED] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('resume-no-score-2')).toBeTruthy();
    });
  });

  it('shows "Parsed" badge for parsed resumes', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('parsed-badge-1')).toBeTruthy();
    });
  });

  it('shows empty state when no resumes', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('resumes-empty-state')).toBeTruthy();
    });
  });

  it('shows error state on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Server error'));
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('resumes-error')).toBeTruthy();
    });
  });

  it('has upload button that navigates to upload screen', async () => {
    const navigate = jest.fn();
    jest.requireMock('@react-navigation/native').useNavigation.mockReturnValue({ navigate });
    mockGet.mockResolvedValueOnce({ data: [] });
    renderScreen();

    await waitFor(() => screen.getByTestId('upload-resume-btn'));
    fireEvent.press(screen.getByTestId('upload-resume-btn'));

    expect(navigate).toHaveBeenCalledWith('ResumeUpload');
  });

  it('navigates to detail when resume card pressed', async () => {
    const navigate = jest.fn();
    jest.requireMock('@react-navigation/native').useNavigation.mockReturnValue({ navigate });
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED] });
    renderScreen();

    await waitFor(() => screen.getByTestId('resume-card-1'));
    fireEvent.press(screen.getByTestId('resume-card-1'));

    expect(navigate).toHaveBeenCalledWith('ResumeDetail', { resumeId: 1 });
  });
});
