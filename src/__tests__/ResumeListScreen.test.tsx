import React from 'react';
import { Alert } from 'react-native';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), delete: jest.fn(), put: jest.fn() },
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
    RESUMES: '/api/resumes',
    RESUME_BY_ID: (id: number) => `/api/resumes/${id}`,
    RESUME_SET_PRIMARY: (id: number) => `/api/resumes/${id}/primary`,
  },
  ROUTES: { RESUME_DETAIL: 'ResumeDetail', RESUME_UPLOAD: 'ResumeUpload' },
}));

import apiClient from '../api/apiClient';
import resumeReducer from '../store/slices/resumeSlice';
import ResumeListScreen from '../screens/resume/ResumeListScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockDelete = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;
const mockPut = apiClient.put as jest.MockedFunction<typeof apiClient.put>;

// Simulates the user tapping the given button label in the confirmation Alert
async function confirmAlertButton(label: string) {
  const call = (Alert.alert as jest.Mock).mock.calls.at(-1);
  const buttons = call?.[2] as { text: string; onPress?: () => void }[];
  await act(async () => {
    buttons.find(b => b.text === label)?.onPress?.();
  });
}

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

const RESUME_PARSED_NOT_PRIMARY = {
  id: 3,
  versionName: 'Second Resume',
  fileUrl: 'https://cdn.com/r3.pdf',
  aiScore: 65,
  isOriginal: false,
  isParsed: true,
  createdAt: '2026-03-01T10:00:00',
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
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
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

  it('decodes a percent-encoded versionName (BUG-051 regression)', async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ ...RESUME_PARSED, versionName: 'Muthu%20raja%20CV.pdf' }],
    });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Muthu raja CV.pdf')).toBeTruthy();
      expect(screen.queryByText('Muthu%20raja%20CV.pdf')).toBeNull();
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

  it('long-press shows a delete confirmation dialog', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED] });
    renderScreen();

    await waitFor(() => screen.getByTestId('resume-card-1'));
    fireEvent(screen.getByTestId('resume-card-1'), 'longPress');

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete resume?',
      expect.stringContaining('My Resume v1'),
      expect.any(Array)
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('confirming delete calls the API and removes the resume from the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED, RESUME_UNPARSED] });
    mockDelete.mockResolvedValueOnce({ data: {} });
    renderScreen();

    await waitFor(() => screen.getByTestId('resume-card-1'));
    fireEvent(screen.getByTestId('resume-card-1'), 'longPress');
    await confirmAlertButton('Delete');

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/api/resumes/1');
      expect(screen.queryByTestId('resume-card-1')).toBeNull();
    });
    expect(screen.getByTestId('resume-card-2')).toBeTruthy();
  });

  it('shows an error alert when delete fails and keeps the resume in the list', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED] });
    mockDelete.mockRejectedValueOnce({
      response: { data: { error: "This resume has been used in an application and can't be deleted" } },
    });
    renderScreen();

    await waitFor(() => screen.getByTestId('resume-card-1'));
    fireEvent(screen.getByTestId('resume-card-1'), 'longPress');
    await confirmAlertButton('Delete');

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete failed',
        "This resume has been used in an application and can't be deleted"
      );
    });
    expect(screen.getByTestId('resume-card-1')).toBeTruthy();
  });

  it('shows "Used for job matching" indicator on the primary resume', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('matching-indicator-1')).toBeTruthy();
      expect(screen.queryByTestId('set-primary-btn-1')).toBeNull();
    });
  });

  it('shows "Use for job matching" button on other parsed resumes', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED, RESUME_PARSED_NOT_PRIMARY] });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('set-primary-btn-3')).toBeTruthy();
      expect(screen.queryByTestId('matching-indicator-3')).toBeNull();
    });
  });

  it('does not show a set-primary button on unparsed resumes', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_UNPARSED] });
    renderScreen();

    await waitFor(() => screen.getByTestId('resume-card-2'));
    expect(screen.queryByTestId('set-primary-btn-2')).toBeNull();
    expect(screen.queryByTestId('matching-indicator-2')).toBeNull();
  });

  it('tapping "Use for job matching" calls the API and swaps the primary resume', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED, RESUME_PARSED_NOT_PRIMARY] });
    mockPut.mockResolvedValueOnce({ data: { ...RESUME_PARSED_NOT_PRIMARY, isOriginal: true } });
    renderScreen();

    await waitFor(() => screen.getByTestId('set-primary-btn-3'));
    fireEvent.press(screen.getByTestId('set-primary-btn-3'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/resumes/3/primary');
      expect(screen.getByTestId('matching-indicator-3')).toBeTruthy();
      expect(screen.getByTestId('set-primary-btn-1')).toBeTruthy();
    });
  });

  it('BUG-MOB-013 regression: with multiple stale isOriginal=true resumes, only the newest shows the indicator', async () => {
    // Simulates accounts with resumes uploaded before BUG-060's exclusivity fix —
    // several rows can all still have isOriginal=true in the backend response.
    const staleOlder = { ...RESUME_PARSED_NOT_PRIMARY, id: 4, isOriginal: true, createdAt: '2026-06-01T10:00:00' };
    const newest = { ...RESUME_PARSED, id: 5, isOriginal: true, createdAt: '2026-07-01T10:00:00' };
    // List order matches backend's createdAt DESC.
    mockGet.mockResolvedValueOnce({ data: [newest, staleOlder, RESUME_PARSED] });
    renderScreen();

    await waitFor(() => {
      // Only the newest gets the indicator...
      expect(screen.getByTestId('matching-indicator-5')).toBeTruthy();
      // ...every other stale "original" gets a real selector button instead.
      expect(screen.getByTestId('set-primary-btn-4')).toBeTruthy();
      expect(screen.getByTestId('set-primary-btn-1')).toBeTruthy();
      expect(screen.queryByTestId('matching-indicator-4')).toBeNull();
      expect(screen.queryByTestId('matching-indicator-1')).toBeNull();
    });
  });

  it('shows an error alert when switching the primary resume fails', async () => {
    mockGet.mockResolvedValueOnce({ data: [RESUME_PARSED, RESUME_PARSED_NOT_PRIMARY] });
    mockPut.mockRejectedValueOnce({ response: { data: { error: 'Could not switch resumes.' } } });
    renderScreen();

    await waitFor(() => screen.getByTestId('set-primary-btn-3'));
    fireEvent.press(screen.getByTestId('set-primary-btn-3'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not switch resumes.');
    });
    // No change on failure — original resume stays primary
    expect(screen.getByTestId('matching-indicator-1')).toBeTruthy();
    expect(screen.getByTestId('set-primary-btn-3')).toBeTruthy();
  });
});
