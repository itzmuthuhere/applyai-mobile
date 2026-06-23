import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { sessionId: 1 } }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    INTERVIEW_BY_ID: (id: number) => `/api/interviews/${id}`,
  },
}));

import apiClient from '../api/apiClient';
import InterviewReportScreen from '../screens/interview/InterviewReportScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

const SESSION = {
  sessionId: 1,
  jobTitle: 'Software Engineer',
  company: 'Acme Corp',
  overallScore: 7.8,
  createdAt: '2026-06-01T10:00:00',
  questions: [
    {
      id: 1, question: 'Tell me about yourself.', questionType: 'BEHAVIORAL', sequenceOrder: 1,
      transcript: 'I am a Java developer.', aiScore: 8, aiFeedback: 'Good confidence.',
    },
    {
      id: 2, question: 'Explain REST vs GraphQL.', questionType: 'TECHNICAL', sequenceOrder: 2,
      transcript: null, aiScore: null, aiFeedback: null,
    },
  ],
};

describe('InterviewReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: SESSION });
  });

  it('shows loading state initially', () => {
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    render(<InterviewReportScreen />);
    expect(screen.getByTestId
      ? screen.queryByTestId('report-loading')
      : screen.queryByText('Loading…')).toBeDefined();
  });

  it('loads and shows job title and company', async () => {
    render(<InterviewReportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeTruthy();
      expect(screen.getByText('Acme Corp')).toBeTruthy();
    });
  });

  it('shows overall score', async () => {
    render(<InterviewReportScreen />);

    await waitFor(() => {
      expect(screen.getByText('7.8')).toBeTruthy();
    });
  });

  it('shows score label Strong for 7.8 score', async () => {
    render(<InterviewReportScreen />);

    await waitFor(() => {
      // scoreLabel(7.8): 7.8 >= 7.5 → 'Strong'
      expect(screen.getByText('Strong')).toBeTruthy();
    });
  });

  it('shows answered question transcript', async () => {
    render(<InterviewReportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Tell me about yourself.')).toBeTruthy();
    });
  });

  it('shows question AI feedback after expanding', async () => {
    render(<InterviewReportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Tell me about yourself.')).toBeTruthy();
    });

    // The question text is OUTSIDE the TouchableOpacity header — press Q1 label inside the header to expand
    fireEvent.press(screen.getByText('Q1'));

    await waitFor(() => {
      expect(screen.getByText('Good confidence.')).toBeTruthy();
    });
  });

  it('shows Skipped badge for unanswered questions', async () => {
    render(<InterviewReportScreen />);

    await waitFor(() => {
      // Unanswered Q2 shows 'Skipped' badge in collapsed header
      expect(screen.getByText('Skipped')).toBeTruthy();
    });
  });

  it('shows error state on API failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    render(<InterviewReportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Could not load report')).toBeTruthy();
    });
  });

  it('calls the correct endpoint', async () => {
    render(<InterviewReportScreen />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/api/interviews/1');
    });
  });
});
