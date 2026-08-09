import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';
import authReducer from '../store/slices/authSlice';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { put: jest.fn() },
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    PROFILE: '/api/profile',
  },
}));

import apiClient from '../api/apiClient';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

const mockPut = apiClient.put as jest.MockedFunction<typeof apiClient.put>;
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        jwt: 'test-jwt',
        user: {
          id: 1, email: 't@t.com', name: 'Muthu Raja', googleId: 'g1',
          subscriptionPlan: 'FREE', role: 'JOBSEEKER', headline: null, phone: null,
          bio: null, city: null, country: null, yearsOfExperience: null,
          linkedinUrl: null, githubUrl: null, portfolioUrl: null, twitterUrl: null,
          targetRole: null, targetLocation: null, minSalary: null, remotePreference: null,
        } as any,
        isLoading: false, error: null,
      },
    },
  });
}

function renderScreen() {
  const store = makeStore();
  return { store, ...render(<Provider store={store}><ProfileSetupScreen /></Provider>) };
}

describe('ProfileSetupScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('greets the user by first name', () => {
    renderScreen();
    expect(screen.getByText(/Hi Muthu,/)).toBeTruthy();
  });

  it('disables Continue until role and location are filled', () => {
    renderScreen();
    expect(screen.getByTestId('profile-setup-continue-btn').props.accessibilityState?.disabled).toBe(true);
  });

  it('enables Continue once role and location are filled', () => {
    renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Engineer');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Bengaluru'), 'Chennai');
    expect(screen.getByTestId('profile-setup-continue-btn').props.accessibilityState?.disabled).toBe(false);
  });

  it('defaults remote preference to Any', () => {
    renderScreen();
    const anyPill = screen.getByTestId('remote-pref-ANY');
    expect(anyPill).toBeTruthy();
  });

  it('saves profile and dispatches updated user on Continue', async () => {
    const updatedUser = { id: 1, targetRole: 'Backend Engineer', targetLocation: 'Chennai', remotePreference: 'ANY' };
    mockPut.mockResolvedValueOnce({ data: updatedUser });
    const { store } = renderScreen();

    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Engineer');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Bengaluru'), 'Chennai');
    fireEvent.press(screen.getByTestId('profile-setup-continue-btn'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/profile', {
        targetRole: 'Backend Engineer',
        targetLocation: 'Chennai',
        minSalary: undefined,
        remotePreference: 'ANY',
      });
    });
    await waitFor(() => {
      expect(store.getState().auth.user).toEqual(updatedUser);
    });
  });

  it('shows an error alert when saving fails', async () => {
    mockPut.mockRejectedValueOnce({ response: { data: { error: 'Something broke' } } });
    renderScreen();

    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Engineer');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Bengaluru'), 'Chennai');
    fireEvent.press(screen.getByTestId('profile-setup-continue-btn'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Something broke');
    });
  });

  it('parses minSalary as a number when provided', async () => {
    mockPut.mockResolvedValueOnce({ data: {} });
    renderScreen();

    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Engineer');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Bengaluru'), 'Chennai');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. 1200000'), '1500000');
    fireEvent.press(screen.getByTestId('profile-setup-continue-btn'));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/profile', expect.objectContaining({ minSalary: 1500000 }));
    });
  });
});
