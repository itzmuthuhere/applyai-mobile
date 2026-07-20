import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), getParent: () => ({ navigate: jest.fn() }) })),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', secondary: '#10B981',
    background: '#F8FAFC', surface: '#FFFFFF', textPrimary: '#0F172A',
    textSecondary: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
    error: '#EF4444', warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    JOBS: '/api/jobs',
    RESUMES: '/api/resumes',
    AUTO_APPLY_QUEUE: '/api/auto-apply/queue',
    QUICK_APPLY: (id: number) => `/api/applications/quick-apply/${id}`,
  },
}));

import apiClient from '../api/apiClient';
import JobFeedScreen from '../screens/jobs/JobFeedScreen';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import applicationReducer from '../store/slices/applicationSlice';
import resumeReducer from '../store/slices/resumeSlice';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;

const JOB = {
  id: 10,
  title: 'Senior Engineer',
  company: 'Acme Corp',
  location: 'Bangalore',
  source: 'NAUKRI',
  isRemote: false,
  saved: false,
  salaryMin: 1000000,
  salaryMax: 2000000,
  scrapedAt: '2026-06-01',
  description: 'Build things',
  sourceUrl: null,
  category: null,
  deadline: null,
};

const JOB_2 = { ...JOB, id: 11, title: 'Backend Dev', company: 'TechCo' };

const RESUME = {
  id: 5,
  versionName: 'My Resume',
  fileUrl: 'https://cdn.com/r.pdf',
  aiScore: 80,
  isOriginal: true,
  isParsed: true,
  createdAt: '2026-01-01',
};

function makeStore(role = 'JOBSEEKER', resumes: typeof RESUME[] = []) {
  return configureStore({
    reducer: { auth: authReducer, application: applicationReducer, resume: resumeReducer },
    preloadedState: {
      auth: {
        jwt: 'test-token',
        user: { id: 1, email: 't@t.com', name: 'Test', role, subscriptionPlan: 'FREE', targetRole: null, targetLocation: null, minSalary: null, remotePreference: null, skills: null, headline: null, createdAt: '2026-01-01' },
        isLoading: false,
        error: null,
      },
      resume: { list: resumes, selected: null, isUploading: false, isAnalyzing: false, isLoading: false, error: null },
    },
  });
}

function renderScreen(role = 'JOBSEEKER', resumes: typeof RESUME[] = []) {
  const store = makeStore(role, resumes);
  return { store, ...render(
    <Provider store={store}>
      <JobFeedScreen />
    </Provider>
  ) };
}

describe('JobFeedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows upload CTA when no parsed resume exists', async () => {
    mockGet.mockResolvedValueOnce({ data: { content: [], totalElements: 0, number: 0, totalPages: 0 } });
    renderScreen('JOBSEEKER', []);

    await waitFor(() => {
      expect(screen.getByTestId('resume-upload-cta')).toBeTruthy();
      expect(screen.queryByTestId('resume-status-card')).toBeNull();
    });
  });

  it('shows resume status card with AI score when a parsed resume exists', async () => {
    mockGet.mockResolvedValueOnce({ data: { content: [], totalElements: 0, number: 0, totalPages: 0 } });
    renderScreen('JOBSEEKER', [RESUME]);

    await waitFor(() => {
      expect(screen.getByTestId('resume-status-card')).toBeTruthy();
      expect(screen.getByText('My Resume')).toBeTruthy();
      expect(screen.getByText('80')).toBeTruthy();
      expect(screen.queryByTestId('resume-upload-cta')).toBeNull();
    });
  });

  it('hides the resume status section entirely for HR users', async () => {
    mockGet.mockResolvedValueOnce({ data: { content: [], totalElements: 0, number: 0, totalPages: 0 } });
    renderScreen('HR', []);

    await waitFor(() => {
      expect(screen.queryByTestId('resume-upload-cta')).toBeNull();
      expect(screen.queryByTestId('resume-status-card')).toBeNull();
    });
  });

  it('shows loading state initially', async () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    renderScreen();

    expect(screen.getByTestId('jobs-loading')).toBeTruthy();
  });

  it('renders job cards after load', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [JOB, JOB_2], totalElements: 2, number: 0, totalPages: 1 },
    });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
      expect(screen.getByText('Backend Dev')).toBeTruthy();
    });
  });

  it('shows a JD snippet on the card when the job has a description', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 },
    });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Build things')).toBeTruthy();
    });
  });

  it('omits the JD snippet when the job has a blank description', async () => {
    const blankDescJob = { ...JOB, description: '   ' };
    mockGet.mockResolvedValueOnce({
      data: { content: [blankDescJob], totalElements: 1, number: 0, totalPages: 1 },
    });
    renderScreen();

    await waitFor(() => screen.getByText('Senior Engineer'));
    expect(screen.queryByText('   ')).toBeNull();
  });

  it('shows Apply All button for JOBSEEKER users', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 },
    });
    renderScreen('JOBSEEKER');

    await waitFor(() => {
      expect(screen.getByTestId('apply-all-btn')).toBeTruthy();
    });
  });

  it('does NOT show Apply All button for HR users', async () => {
    mockGet.mockResolvedValueOnce({
      data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 },
    });
    renderScreen('HR');

    await waitFor(() => {
      expect(screen.queryByTestId('apply-all-btn')).toBeNull();
    });
  });

  it('auto-selects every job and enters select mode when Apply All is pressed', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB, JOB_2], totalElements: 2, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });

    renderScreen();

    await waitFor(() => screen.getByTestId('apply-all-btn'));
    fireEvent.press(screen.getByTestId('apply-all-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('select-all-btn')).toBeTruthy();
      expect(screen.getByTestId('cancel-select-btn')).toBeTruthy();
      expect(screen.getByTestId('selected-count')).toBeTruthy();
      expect(screen.getByText(/2 selected/i)).toBeTruthy();
    });
  });

  it('shows Auto Apply bar as soon as Apply All is pressed', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });

    renderScreen();

    await waitFor(() => screen.getByTestId('apply-all-btn'));
    fireEvent.press(screen.getByTestId('apply-all-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auto-apply-bar')).toBeTruthy();
    });
  });

  it('deselecting a job then pressing All restores full selection', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB, JOB_2], totalElements: 2, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });

    renderScreen();

    await waitFor(() => screen.getByTestId('apply-all-btn'));
    fireEvent.press(screen.getByTestId('apply-all-btn'));

    await waitFor(() => screen.getByText(/2 selected/i));
    fireEvent.press(screen.getByTestId('job-card-10')); // deselect job 10

    await waitFor(() => screen.getByText(/1 selected/i));
    fireEvent.press(screen.getByTestId('select-all-btn'));

    await waitFor(() => {
      expect(screen.getByText(/2 selected/i)).toBeTruthy();
    });
  });

  it('exits select mode when Cancel is pressed', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });

    renderScreen();

    await waitFor(() => screen.getByTestId('apply-all-btn'));
    fireEvent.press(screen.getByTestId('apply-all-btn'));

    await waitFor(() => screen.getByTestId('cancel-select-btn'));
    fireEvent.press(screen.getByTestId('cancel-select-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('cancel-select-btn')).toBeNull();
      expect(screen.getByTestId('apply-all-btn')).toBeTruthy();
    });
  });

  it('navigates to JobDetail in normal mode on card press', async () => {
    const navigate = jest.fn();
    jest.requireMock('@react-navigation/native').useNavigation.mockReturnValue({ navigate });
    mockGet.mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } });

    renderScreen();

    await waitFor(() => screen.getByTestId('job-card-10'));
    fireEvent.press(screen.getByTestId('job-card-10'));

    expect(navigate).toHaveBeenCalledWith('JobDetail', { jobId: 10 });
  });

  it('calls auto-apply API and navigates to queue on submit', async () => {
    const navigate = jest.fn();
    jest.requireMock('@react-navigation/native').useNavigation.mockReturnValue({ navigate });

    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });
    mockPost.mockResolvedValueOnce({ data: [{ id: 1, status: 'PENDING' }] });

    renderScreen();

    await waitFor(() => screen.getByTestId('apply-all-btn'));
    fireEvent.press(screen.getByTestId('apply-all-btn'));

    await waitFor(() => screen.getByTestId('auto-apply-submit-btn'));
    fireEvent.press(screen.getByTestId('auto-apply-submit-btn'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/auto-apply/queue', {
        jobIds: [10], resumeId: 5, tailorResume: true, generateCoverLetter: false,
      });
      expect(navigate).toHaveBeenCalledWith('AutoApplyQueue');
    });
  });

  it('respects tailor-resume and cover-letter toggles when queuing', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } })
      .mockResolvedValueOnce({ data: [RESUME] });
    mockPost.mockResolvedValueOnce({ data: [{ id: 1, status: 'PENDING' }] });

    renderScreen();

    await waitFor(() => screen.getByTestId('apply-all-btn'));
    fireEvent.press(screen.getByTestId('apply-all-btn'));

    await waitFor(() => screen.getByTestId('toggle-tailor-resume'));
    fireEvent.press(screen.getByTestId('toggle-tailor-resume')); // off
    fireEvent.press(screen.getByTestId('toggle-cover-letter'));  // on

    fireEvent.press(screen.getByTestId('auto-apply-submit-btn'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/auto-apply/queue', {
        jobIds: [10], resumeId: 5, tailorResume: false, generateCoverLetter: true,
      });
    });
  });

  it('deduplicates jobs by id when a paginated page overlaps the previous one', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { content: [JOB], totalElements: 2, number: 0, totalPages: 2 } })
      // Page 2 re-returns JOB (id 10) alongside a genuinely new job — simulates an
      // unstable DB sort tiebreak shifting the same row across two OFFSET/LIMIT pages.
      .mockResolvedValueOnce({ data: { content: [JOB, JOB_2], totalElements: 2, number: 1, totalPages: 2 } });

    renderScreen();

    await waitFor(() => screen.getByTestId('job-card-10'));
    fireEvent(screen.getByTestId('jobs-list'), 'onEndReached');

    await waitFor(() => {
      expect(screen.getAllByTestId('job-card-10')).toHaveLength(1);
      expect(screen.getByTestId('job-card-11')).toBeTruthy();
    });
  });

  it('shows empty state when no jobs found', async () => {
    mockGet.mockResolvedValueOnce({ data: { content: [], totalElements: 0, number: 0, totalPages: 0 } });
    renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId('jobs-empty-state')).toBeTruthy();
    });
  });

  it('opens the sort sheet and applies a new sort choice from the compact pill', async () => {
    mockGet.mockResolvedValue({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } });
    renderScreen();

    await waitFor(() => screen.getByTestId('sort-pill-btn'));
    expect(screen.getByText('Best Match')).toBeTruthy();

    fireEvent.press(screen.getByTestId('sort-pill-btn'));
    await waitFor(() => screen.getByTestId('sort-option-recent'));
    fireEvent.press(screen.getByTestId('sort-option-recent'));

    await waitFor(() => {
      expect(screen.getByText('Most Recent')).toBeTruthy();
      expect(screen.queryByTestId('sort-option-recent')).toBeNull(); // sheet closed
    });
  });

  it('opens the salary sheet and applies a minimum salary filter from the compact pill', async () => {
    mockGet.mockResolvedValue({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } });
    renderScreen();

    await waitFor(() => screen.getByTestId('salary-pill-btn'));
    fireEvent.press(screen.getByTestId('salary-pill-btn'));

    await waitFor(() => screen.getByTestId('salary-option-1000000'));
    fireEvent.press(screen.getByTestId('salary-option-1000000'));

    await waitFor(() => {
      expect(screen.getByText('₹10L+')).toBeTruthy();
      expect(screen.getByTestId('clear-filters-btn')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('clear-filters-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('clear-filters-btn')).toBeNull();
      expect(screen.getByText('Salary')).toBeTruthy();
    });
  });

  // Regression test for BUG-MOB-011: Easy Apply from this screen never
  // dispatched the new application to Redux, so it went missing from the
  // Mock Interview job picker (which reads state.application.list) until
  // the next app restart repopulated it.
  it('dispatches the new application to Redux on Easy Apply', async () => {
    mockGet.mockResolvedValueOnce({ data: { content: [JOB], totalElements: 1, number: 0, totalPages: 1 } });
    const newApplication = { id: 42, job: JOB, status: 'APPLIED', appliedAt: '2026-07-11T10:00:00.000Z' };
    mockPost.mockResolvedValueOnce({ data: newApplication });
    const { store } = renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Easy Apply'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/applications/quick-apply/10');
    });
    await waitFor(() => {
      expect(store.getState().application.list).toContainEqual(newApplication);
    });
  });
});
