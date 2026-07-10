import React from 'react';
import { Alert } from 'react-native';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import resumeReducer from '../store/slices/resumeSlice';
import ResumeDetailScreen from '../screens/resume/ResumeDetailScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: { resumeId: 1 } }),
}));

const mockPost = jest.fn((url: string) => {
  if (url.includes('resume-parse')) {
    return Promise.resolve({
      data: { skills: ['React'], experienceYears: 3, education: 'B.Tech', techStack: ['Node'], summary: 'Engineer' },
    });
  }
  if (url.includes('resume-score')) {
    return Promise.resolve({ data: { score: 78, strengths: ['Clear layout'], improvements: ['Add metrics'] } });
  }
  return Promise.resolve({ data: {} });
});
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { post: (...a: any[]) => mockPost(...a) },
}));

const PARSED_RESUME = {
  id: 1,
  versionName: 'My CV',
  fileUrl: 'https://cdn.com/r.pdf',
  aiScore: 78,
  isOriginal: true,
  isParsed: true,
  createdAt: '2026-05-01T10:00:00',
};

const UNPARSED_RESUME = { ...PARSED_RESUME, isParsed: false, aiScore: null };

function makeStore(resume: typeof PARSED_RESUME) {
  return configureStore({
    reducer: { resume: resumeReducer },
    preloadedState: {
      resume: { list: [resume], selected: null, isUploading: false, isAnalyzing: false, isLoading: false, error: null },
    } as any,
  });
}

function renderScreen(resume: typeof PARSED_RESUME) {
  return render(
    <Provider store={makeStore(resume)}>
      <ResumeDetailScreen />
    </Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('ResumeDetailScreen — Tailor for a Job quick action', () => {
  it('navigates to the Jobs tab when the resume is already parsed (BUG regression: used to only show an alert)', async () => {
    renderScreen(PARSED_RESUME);
    await waitFor(() => expect(screen.getByTestId('tailor-for-job-btn')).toBeTruthy());

    fireEvent.press(screen.getByTestId('tailor-for-job-btn'));

    expect(mockNavigate).toHaveBeenCalledWith('JobsTab', { screen: 'JobFeed' });
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('shows an "Analyze First" alert instead of navigating when the resume is not yet parsed', async () => {
    renderScreen(UNPARSED_RESUME);
    await waitFor(() => expect(screen.getByTestId('tailor-for-job-btn')).toBeTruthy());

    fireEvent.press(screen.getByTestId('tailor-for-job-btn'));

    expect(Alert.alert).toHaveBeenCalledWith('Analyze First', 'Please analyze this resume before tailoring it.');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
