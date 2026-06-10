import { configureStore } from '@reduxjs/toolkit';
import analyticsReducer, { fetchAnalyticsOverview, fetchResumePerformance } from '../store/analyticsSlice';

jest.mock('../api/apiClient', () => ({
  get: jest.fn(),
}));
import apiClient from '../api/apiClient';

function makeStore() {
  return configureStore({ reducer: { analytics: analyticsReducer } });
}

describe('analyticsSlice', () => {
  it('starts with null overview and empty resumePerformance', () => {
    const store = makeStore();
    const state = store.getState().analytics;
    expect(state.overview).toBeNull();
    expect(state.resumePerformance).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('sets loading true on fetchAnalyticsOverview.pending', () => {
    const store = makeStore();
    store.dispatch({ type: fetchAnalyticsOverview.pending.type });
    expect(store.getState().analytics.loading).toBe(true);
  });

  it('saves overview on fetchAnalyticsOverview.fulfilled', () => {
    const store = makeStore();
    const mockOverview = {
      totalApplications: 10, pendingApplications: 3, interviewsScheduled: 2,
      offersReceived: 1, applicationsByStatus: {}, applicationsByMonth: [],
      topAppliedRoles: ['SWE'], averageMatchScore: 72,
    };
    store.dispatch({ type: fetchAnalyticsOverview.fulfilled.type, payload: mockOverview });
    expect(store.getState().analytics.overview?.totalApplications).toBe(10);
  });

  it('saves error on fetchAnalyticsOverview.rejected', () => {
    const store = makeStore();
    store.dispatch({ type: fetchAnalyticsOverview.rejected.type, payload: 'Network error' });
    expect(store.getState().analytics.error).toBe('Network error');
    expect(store.getState().analytics.loading).toBe(false);
  });

  it('saves resumePerformance on fulfilled', () => {
    const store = makeStore();
    const mockPerf = [{ resumeId: 1, fileName: 'cv.pdf', totalApplications: 5, interviewRate: 40, averageMatchScore: 75 }];
    store.dispatch({ type: fetchResumePerformance.fulfilled.type, payload: mockPerf });
    expect(store.getState().analytics.resumePerformance).toHaveLength(1);
  });
});
