import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { jobId: 10 } }),
}));

jest.mock('../constants', () => ({
  API_ENDPOINTS: {
    JOB_DETAIL: (id: number) => `/api/jobs/${id}`,
    APPLY: '/api/applications',
    RESUMES: '/api/resumes',
  },
}));

import apiClient from '../api/apiClient';
import ApplyJobScreen from '../screens/jobs/ApplyJobScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const JOB = {
  id: 10,
  title: 'Senior Engineer',
  company: 'Acme Corp',
  description: 'Build amazing Java apps',
  location: 'Bangalore',
  isRemote: false,
  salaryMin: 1000000,
  salaryMax: 2000000,
  source: 'NAUKRI',
  sourceUrl: null,
  saved: false,
  scrapedAt: '2026-06-01',
  category: null,
  deadline: null,
};

const RESUMES = [
  { id: 5, versionName: 'My Resume', fileUrl: 'https://cdn.com/r.pdf', aiScore: 80, isOriginal: true, isParsed: true, createdAt: '2026-01-01' },
];

describe('ApplyJobScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows loading state initially', async () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    render(<ApplyJobScreen />);

    expect(screen.getByTestId('apply-loading')).toBeTruthy();
  });

  it('renders job details after load', async () => {
    mockGet
      .mockResolvedValueOnce({ data: JOB })
      .mockResolvedValueOnce({ data: RESUMES });

    render(<ApplyJobScreen />);

    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });
  });

  it('shows resume picker with loaded resumes', async () => {
    mockGet
      .mockResolvedValueOnce({ data: JOB })
      .mockResolvedValueOnce({ data: RESUMES });

    render(<ApplyJobScreen />);

    await waitFor(() => {
      expect(screen.getByText('My Resume')).toBeTruthy();
    });
  });

  it('shows warm-up message when server is cold (delay > 5s)', async () => {
    mockGet
      .mockResolvedValueOnce({ data: JOB })
      .mockResolvedValueOnce({ data: RESUMES });
    mockPost.mockImplementationOnce(() => new Promise(() => {})); // never resolves

    render(<ApplyJobScreen />);

    await waitFor(() => screen.getByTestId('apply-submit-btn'));
    fireEvent.press(screen.getByTestId('apply-submit-btn'));

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('warmup-message')).toBeTruthy();
    });
  });

  it('shows success state after successful apply', async () => {
    mockGet
      .mockResolvedValueOnce({ data: JOB })
      .mockResolvedValueOnce({ data: RESUMES });
    mockPost.mockResolvedValueOnce({ data: { id: 100, status: 'APPLIED' } });

    render(<ApplyJobScreen />);

    await waitFor(() => screen.getByTestId('apply-submit-btn'));
    fireEvent.press(screen.getByTestId('apply-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('apply-success')).toBeTruthy();
    });
  });

  it('shows error when apply fails', async () => {
    mockGet
      .mockResolvedValueOnce({ data: JOB })
      .mockResolvedValueOnce({ data: RESUMES });
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Already applied' } } });

    render(<ApplyJobScreen />);

    await waitFor(() => screen.getByTestId('apply-submit-btn'));
    fireEvent.press(screen.getByTestId('apply-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('apply-error')).toBeTruthy();
    });
  });

  it('disables submit button when no resume is selected', async () => {
    mockGet
      .mockResolvedValueOnce({ data: JOB })
      .mockResolvedValueOnce({ data: [] }); // no resumes

    render(<ApplyJobScreen />);

    await waitFor(() => screen.getByTestId('apply-submit-btn'));
    expect(screen.getByTestId('apply-submit-btn')).toBeDisabled();
  });

  it('shows cover letter input field', async () => {
    mockGet
      .mockResolvedValueOnce({ data: JOB })
      .mockResolvedValueOnce({ data: RESUMES });

    render(<ApplyJobScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('cover-letter-input')).toBeTruthy();
    });
  });
});
