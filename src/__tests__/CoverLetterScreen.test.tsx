import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { jobId: 10, resumeId: 5 } }),
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));

jest.mock('../constants', () => ({
  API_ENDPOINTS: {
    COVER_LETTER: '/api/ai/cover-letter',
  },
}));

import apiClient from '../api/apiClient';
import CoverLetterScreen from '../screens/resume/CoverLetterScreen';
import Clipboard from '@react-native-clipboard/clipboard';

const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

describe('CoverLetterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders generate button on mount', () => {
    render(<CoverLetterScreen />);

    expect(screen.getByTestId('generate-btn')).toBeTruthy();
  });

  it('shows loading state while generating', async () => {
    mockPost.mockImplementationOnce(() => new Promise(() => {}));
    render(<CoverLetterScreen />);

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cover-letter-loading')).toBeTruthy();
    });
  });

  it('shows warm-up message after 5s delay during generation', async () => {
    mockPost.mockImplementationOnce(() => new Promise(() => {}));
    render(<CoverLetterScreen />);

    fireEvent.press(screen.getByTestId('generate-btn'));

    act(() => {
      jest.advanceTimersByTime(5500);
    });

    await waitFor(() => {
      expect(screen.getByTestId('warmup-message')).toBeTruthy();
    });
  });

  it('shows generated cover letter on success', async () => {
    mockPost.mockResolvedValueOnce({ data: { coverLetter: 'Dear Hiring Manager, I am excited...' } });
    render(<CoverLetterScreen />);

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Dear Hiring Manager/)).toBeTruthy();
    });
  });

  it('shows copy button after generation', async () => {
    mockPost.mockResolvedValueOnce({ data: { coverLetter: 'Cover letter text' } });
    render(<CoverLetterScreen />);

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('copy-btn')).toBeTruthy();
    });
  });

  it('copies cover letter to clipboard on copy button press', async () => {
    mockPost.mockResolvedValueOnce({ data: { coverLetter: 'Cover letter text' } });
    render(<CoverLetterScreen />);

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => screen.getByTestId('copy-btn'));
    fireEvent.press(screen.getByTestId('copy-btn'));

    expect(Clipboard.setString).toHaveBeenCalledWith('Cover letter text');
  });

  it('shows error message on generation failure', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Job has no description' } } });
    render(<CoverLetterScreen />);

    fireEvent.press(screen.getByTestId('generate-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cover-letter-error')).toBeTruthy();
    });
  });

  it('allows regeneration after viewing result', async () => {
    mockPost
      .mockResolvedValueOnce({ data: { coverLetter: 'First version' } })
      .mockResolvedValueOnce({ data: { coverLetter: 'Second version' } });

    render(<CoverLetterScreen />);

    fireEvent.press(screen.getByTestId('generate-btn'));
    await waitFor(() => screen.getByTestId('regenerate-btn'));
    fireEvent.press(screen.getByTestId('regenerate-btn'));

    await waitFor(() => {
      expect(screen.getByText('Second version')).toBeTruthy();
    });
    expect(mockPost).toHaveBeenCalledTimes(2);
  });
});
