import { configureStore } from '@reduxjs/toolkit';
import jobReducer, {
  setJobs,
  appendJobs,
  setSelectedJob,
  setMatchScore,
  setLoading,
  setError,
  clearError,
} from '../store/slices/jobSlice';
import { Job, MatchScore } from '../types/api.types';

function makeJob(id: number, title = 'Engineer'): Job {
  return {
    id,
    title,
    company: 'Acme',
    location: 'Bangalore',
    salaryMin: null,
    salaryMax: null,
    isRemote: false,
    source: 'NAUKRI',
    sourceUrl: null,
    scrapedAt: '2026-06-01',
    description: 'Build things',
    category: null,
    deadline: null,
    saved: false,
  };
}

function makeStore() {
  return configureStore({ reducer: { job: jobReducer } });
}

describe('jobSlice', () => {
  it('initial state is correct', () => {
    const state = jobReducer(undefined, { type: '@@INIT' });
    expect(state.feed).toEqual([]);
    expect(state.selected).toBeNull();
    expect(state.currentPage).toBe(0);
    expect(state.totalElements).toBe(0);
    expect(state.matchScores).toEqual({});
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setJobs replaces feed and clears loading', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    store.dispatch(setJobs({ jobs: [makeJob(1), makeJob(2)], totalElements: 50, page: 0 }));

    const state = store.getState().job;
    expect(state.feed).toHaveLength(2);
    expect(state.totalElements).toBe(50);
    expect(state.currentPage).toBe(0);
    expect(state.isLoading).toBe(false);
  });

  it('appendJobs adds to existing feed', () => {
    const store = makeStore();
    store.dispatch(setJobs({ jobs: [makeJob(1)], totalElements: 5, page: 0 }));
    store.dispatch(appendJobs({ jobs: [makeJob(2), makeJob(3)], totalElements: 5, page: 1 }));

    const state = store.getState().job;
    expect(state.feed).toHaveLength(3);
    expect(state.currentPage).toBe(1);
  });

  it('setSelectedJob stores selected job', () => {
    const store = makeStore();
    const job = makeJob(42, 'Senior Dev');
    store.dispatch(setSelectedJob(job));

    expect(store.getState().job.selected?.id).toBe(42);
  });

  it('setSelectedJob null clears selection', () => {
    const store = makeStore();
    store.dispatch(setSelectedJob(makeJob(1)));
    store.dispatch(setSelectedJob(null));

    expect(store.getState().job.selected).toBeNull();
  });

  it('setMatchScore stores by composite key', () => {
    const store = makeStore();
    const score: MatchScore = { resumeId: 5, jobId: 10, matchScore: 78, matchedSkills: [], missingSkills: [] };
    store.dispatch(setMatchScore(score));

    expect(store.getState().job.matchScores['5_10']).toBeDefined();
    expect(store.getState().job.matchScores['5_10'].matchScore).toBe(78);
  });

  it('setMatchScore overwrites existing entry for same resume+job', () => {
    const store = makeStore();
    const score1: MatchScore = { resumeId: 5, jobId: 10, matchScore: 70, matchedSkills: [], missingSkills: [] };
    const score2: MatchScore = { resumeId: 5, jobId: 10, matchScore: 85, matchedSkills: [], missingSkills: [] };
    store.dispatch(setMatchScore(score1));
    store.dispatch(setMatchScore(score2));

    expect(store.getState().job.matchScores['5_10'].matchScore).toBe(85);
  });

  it('setLoading updates isLoading', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    expect(store.getState().job.isLoading).toBe(true);
    store.dispatch(setLoading(false));
    expect(store.getState().job.isLoading).toBe(false);
  });

  it('setError stores error and clears loading', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    store.dispatch(setError('Network error'));

    const state = store.getState().job;
    expect(state.error).toBe('Network error');
    expect(state.isLoading).toBe(false);
  });

  it('clearError resets error to null', () => {
    const store = makeStore();
    store.dispatch(setError('Some error'));
    store.dispatch(clearError());

    expect(store.getState().job.error).toBeNull();
  });

  it('setJobs resets to page 0 when page is 0', () => {
    const store = makeStore();
    store.dispatch(appendJobs({ jobs: [makeJob(1)], totalElements: 10, page: 1 }));
    store.dispatch(setJobs({ jobs: [makeJob(99)], totalElements: 10, page: 0 }));

    const state = store.getState().job;
    expect(state.currentPage).toBe(0);
    expect(state.feed).toHaveLength(1);
    expect(state.feed[0].id).toBe(99);
  });
});
