import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn() }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
}));

import authReducer from '../store/slices/authSlice';
import ProfileScreen from '../screens/home/ProfileScreen';

function makeUser(overrides: any = {}) {
  return {
    id: 1, email: 'muthu@example.com', name: 'Muthu Raja',
    role: 'JOBSEEKER', subscriptionPlan: 'FREE',
    targetRole: 'Software Engineer', targetLocation: 'Chennai',
    minSalary: 1200000, remotePreference: 'HYBRID',
    skills: ['Java', 'Spring Boot'], headline: 'Java Dev @ BofA',
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function makeStore(user: any = makeUser(), plan = 'FREE') {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { jwt: 'token', user: { ...user, subscriptionPlan: plan }, isLoading: false, error: null },
    },
  });
}

function renderScreen(user: any = makeUser(), plan = 'FREE') {
  return render(
    <Provider store={makeStore(user, plan)}>
      <ProfileScreen />
    </Provider>
  );
}

describe('ProfileScreen', () => {
  it('renders user name', () => {
    renderScreen();
    expect(screen.getByText('Muthu Raja')).toBeTruthy();
  });

  it('renders user email', () => {
    renderScreen();
    expect(screen.getByText('muthu@example.com')).toBeTruthy();
  });

  it('renders headline when set', () => {
    renderScreen();
    expect(screen.getByText('Java Dev @ BofA')).toBeTruthy();
  });

  it('renders Free Plan badge for free users', () => {
    renderScreen(makeUser(), 'FREE');
    expect(screen.getByText('Free Plan')).toBeTruthy();
  });

  it('renders Hunter Plan badge for hunter users', () => {
    renderScreen(makeUser(), 'HUNTER');
    expect(screen.getByText('Hunter Plan')).toBeTruthy();
  });

  it('renders Pro Plan badge for pro users', () => {
    renderScreen(makeUser(), 'PRO');
    expect(screen.getByText('Pro Plan')).toBeTruthy();
  });

  it('renders sign out option', () => {
    renderScreen();
    expect(screen.getByText('Sign Out')).toBeTruthy();
  });

  it('renders My Resumes menu item', () => {
    renderScreen();
    expect(screen.getByText('My Resumes')).toBeTruthy();
  });

  it('renders My Applications menu item', () => {
    renderScreen();
    expect(screen.getByText('My Applications')).toBeTruthy();
  });

  it('renders Notifications menu item', () => {
    renderScreen();
    expect(screen.getByText('Notifications')).toBeTruthy();
  });

  it('renders Saved Jobs menu item', () => {
    renderScreen();
    expect(screen.getByText('Saved Jobs')).toBeTruthy();
  });

  it('shows target role preference', () => {
    renderScreen();
    expect(screen.getByText('Software Engineer')).toBeTruthy();
  });

  it('shows location preference', () => {
    renderScreen();
    expect(screen.getByText('Chennai')).toBeTruthy();
  });
});
