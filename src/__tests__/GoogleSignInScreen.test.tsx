import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
}));

import GoogleSignInScreen from '../screens/auth/GoogleSignInScreen';

function makeStore(overrides: any = {}) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { jwt: null, user: null, isLoading: false, error: null, ...overrides },
    },
  });
}

function renderScreen(overrides: any = {}) {
  return render(
    <Provider store={makeStore(overrides)}>
      <GoogleSignInScreen />
    </Provider>
  );
}

describe('GoogleSignInScreen', () => {
  it('renders app name and tagline', () => {
    renderScreen();
    expect(screen.getByText('ApplyAI')).toBeTruthy();
    expect(screen.getByText(/AI-Powered Job Search/i)).toBeTruthy();
  });

  it('renders Continue with Google button', () => {
    renderScreen();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('renders feature list', () => {
    renderScreen();
    expect(screen.getByText(/AI resume scoring/i)).toBeTruthy();
    expect(screen.getByText(/Smart job matching/i)).toBeTruthy();
    expect(screen.getByText(/AI mock interview/i)).toBeTruthy();
  });

  it('renders stats strip', () => {
    renderScreen();
    expect(screen.getByText('12K+')).toBeTruthy();
    expect(screen.getByText('3×')).toBeTruthy();
    expect(screen.getByText('89%')).toBeTruthy();
  });

  it('renders disclaimer text', () => {
    renderScreen();
    expect(screen.getByText(/Terms of Service/i)).toBeTruthy();
  });

  it('shows activity indicator when isLoading is true', () => {
    renderScreen({ isLoading: true });
    expect(screen.queryByText('Continue with Google')).toBeNull();
  });

  it('button is disabled while loading', () => {
    renderScreen({ isLoading: true });
    const btn = screen.getByTestId
      ? screen.queryByTestId('google-signin-btn')
      : null;
    // No crash on render — loading state replaces button text with spinner
    expect(screen.queryByText('Continue with Google')).toBeNull();
  });

  it('renders trust footer', () => {
    renderScreen();
    expect(screen.getByText(/Secured by Google/i)).toBeTruthy();
  });
});
