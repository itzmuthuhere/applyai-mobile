import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    RESUME_UPLOAD: '/api/resumes/upload',
    RESUMES: '/api/resumes',
  },
}));

import apiClient from '../api/apiClient';
import resumeReducer from '../store/slices/resumeSlice';
import ResumeUploadScreen from '../screens/resume/ResumeUploadScreen';

const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockGetDocument = DocumentPicker.getDocumentAsync as jest.MockedFunction<typeof DocumentPicker.getDocumentAsync>;

function makeStore() {
  return configureStore({
    reducer: { resume: resumeReducer },
    preloadedState: { resume: { list: [], selected: null, isLoading: false, error: null } },
  });
}

function renderScreen() {
  return render(
    <Provider store={makeStore()}>
      <ResumeUploadScreen />
    </Provider>
  );
}

describe('ResumeUploadScreen', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    mockGoBack.mockReset();
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('renders file picker trigger', () => {
    renderScreen();
    expect(screen.getByText('Tap to select a file')).toBeTruthy();
  });

  it('renders upload tips', () => {
    renderScreen();
    expect(screen.getByText(/Use clear section headings/i)).toBeTruthy();
  });

  it('shows selected file name after picking', async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://resume.pdf', name: 'resume.pdf', size: 1024, mimeType: 'application/pdf' }],
    });

    renderScreen();
    fireEvent.press(screen.getByText('Tap to select a file'));

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeTruthy();
    });
  });

  it('shows error when file exceeds 5 MB', async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://big.pdf', name: 'big.pdf', size: 6 * 1024 * 1024, mimeType: 'application/pdf' }],
    });

    renderScreen();
    fireEvent.press(screen.getByText('Tap to select a file'));

    await waitFor(() => {
      expect(screen.getByText(/under 5 MB/i)).toBeTruthy();
    });
  });

  it('does nothing when picker is cancelled', async () => {
    mockGetDocument.mockResolvedValueOnce({ canceled: true, assets: [] });

    renderScreen();
    fireEvent.press(screen.getByText('Tap to select a file'));

    await waitFor(() => {
      expect(screen.queryByText(/\.pdf/i)).toBeNull();
    });
  });

  it('calls upload API and navigates to ResumeList on success', async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://resume.pdf', name: 'resume.pdf', size: 100 * 1024, mimeType: 'application/pdf' }],
    });
    mockPost.mockResolvedValueOnce({
      data: { resumeId: 99, versionName: 'resume.pdf', fileUrl: 'https://cdn.com/r.pdf', isParsed: false },
    });

    renderScreen();
    fireEvent.press(screen.getByText('Tap to select a file'));

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Upload & Analyse'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/api/resumes/upload',
        expect.any(Object),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('ResumeList');
    });
  });

  it('shows error message when upload fails', async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://resume.pdf', name: 'resume.pdf', size: 100 * 1024, mimeType: 'application/pdf' }],
    });
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Only PDF and DOCX files are allowed' } } });

    renderScreen();
    fireEvent.press(screen.getByText('Tap to select a file'));

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Upload & Analyse'));

    await waitFor(() => {
      expect(screen.getByText('Only PDF and DOCX files are allowed')).toBeTruthy();
    });
  });

  it('appends the real web File object (not a {uri,name,type} descriptor) when running on web', async () => {
    // Regression test for BUG-074: on web, FormData is the browser's real
    // FormData, so appending a {uri,name,type} plain object (the native
    // pattern) silently stringifies into a text field instead of a file
    // part, and the backend fails with "Required part 'file' is not
    // present". Web must append the real File/Blob from asset.file instead.
    Platform.OS = 'web';
    const appendSpy = jest.spyOn(FormData.prototype, 'append');
    const webFile = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });

    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'blob:http://localhost/abc', name: 'resume.pdf', size: 100 * 1024, mimeType: 'application/pdf', file: webFile }],
    });
    mockPost.mockResolvedValueOnce({
      data: { resumeId: 99, versionName: 'resume.pdf', fileUrl: 'https://cdn.com/r.pdf', isParsed: false },
    });

    renderScreen();
    fireEvent.press(screen.getByText('Tap to select a file'));

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Upload & Analyse'));

    await waitFor(() => {
      expect(appendSpy).toHaveBeenCalledWith('file', webFile, 'resume.pdf');
      expect(mockNavigate).toHaveBeenCalledWith('ResumeList');
    });

    appendSpy.mockRestore();
  });

  it('shows an error and does not call the upload API when the web File is missing', async () => {
    Platform.OS = 'web';

    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'blob:http://localhost/abc', name: 'resume.pdf', size: 100 * 1024, mimeType: 'application/pdf' }],
    });

    renderScreen();
    fireEvent.press(screen.getByText('Tap to select a file'));

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Upload & Analyse'));

    await waitFor(() => {
      expect(screen.getByText(/Could not read the selected file/i)).toBeTruthy();
    });
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('shows fallback error when upload fails with no message', async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://resume.pdf', name: 'resume.pdf', size: 100 * 1024, mimeType: 'application/pdf' }],
    });
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    renderScreen();
    fireEvent.press(screen.getByText('Tap to select a file'));

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Upload & Analyse'));

    await waitFor(() => {
      expect(screen.getByText(/Upload failed/i)).toBeTruthy();
    });
  });
});
