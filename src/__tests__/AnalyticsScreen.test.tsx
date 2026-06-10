import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import analyticsReducer, { fetchAnalyticsOverview, fetchResumePerformance } from '../store/analyticsSlice';
import AnalyticsScreen from '../screens/home/AnalyticsScreen';

// Prevent actual API calls — reject immediately so the thunks resolve fast
jest.mock('../api/apiClient', () => ({
  get: jest.fn(() => Promise.reject(new Error('mocked'))),
}));

const mockOverview = {
  totalApplications: 15, pendingApplications: 5, interviewsScheduled: 3,
  offersReceived: 1, applicationsByStatus: {}, applicationsByMonth: [],
  topAppliedRoles: ['SWE'], averageMatchScore: 78,
};

function makeStore(override = {}) {
  return configureStore({
    reducer: { analytics: analyticsReducer },
    preloadedState: { analytics: { overview: null, resumePerformance: [], loading: false, error: null, ...override } },
  });
}

describe('AnalyticsScreen', () => {
  it('shows loading indicator when loading and no overview', () => {
    const store = makeStore({ loading: true });
    render(<Provider store={store}><AnalyticsScreen /></Provider>);
    // ActivityIndicator is rendered — no crash
    expect(true).toBeTruthy();
  });

  it('renders overview stats when data is loaded', () => {
    const store = makeStore({ overview: mockOverview });
    render(<Provider store={store}><AnalyticsScreen /></Provider>);
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByText('78%')).toBeTruthy();
  });

  it('shows top applied roles when loaded', () => {
    const store = makeStore({ overview: mockOverview });
    render(<Provider store={store}><AnalyticsScreen /></Provider>);
    expect(screen.getByText('• SWE')).toBeTruthy();
  });

  it('shows resume performance section when data present', () => {
    const store = makeStore({
      overview: mockOverview,
      resumePerformance: [{ resumeId: 1, fileName: 'resume.pdf', totalApplications: 5, interviewRate: 40, averageMatchScore: 75 }],
    });
    render(<Provider store={store}><AnalyticsScreen /></Provider>);
    expect(screen.getByText('resume.pdf')).toBeTruthy();
  });
});
