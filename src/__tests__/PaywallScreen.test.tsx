import React from 'react';
import { Alert } from 'react-native';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ goBack: jest.fn(), navigate: jest.fn() })),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', secondary: '#10B981',
    background: '#F8FAFC', surface: '#FFFFFF', textPrimary: '#0F172A',
    textSecondary: '#64748B', textMuted: '#94A3B8', border: '#E2E8F0',
    error: '#EF4444', warning: '#F59E0B', success: '#10B981',
  },
}));

jest.mock('../services/revenueCat', () => ({
  getOfferings: jest.fn().mockResolvedValue(null),
  purchasePackage: jest.fn().mockResolvedValue({}),
  restorePurchases: jest.fn().mockResolvedValue({}),
}));

import PaywallScreen from '../screens/common/PaywallScreen';

describe('PaywallScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the correct title', async () => {
    render(<PaywallScreen />);

    await waitFor(() => {
      expect(screen.getByText('Choose Your Plan')).toBeTruthy();
    });
  });

  it('renders Hunter and Pro plan names after loading', async () => {
    render(<PaywallScreen />);

    await waitFor(() => {
      expect(screen.getByText('Hunter')).toBeTruthy();
      expect(screen.getByText('Pro')).toBeTruthy();
    });
  });

  it('shows annual prices by default (₹66 for Hunter, ₹133 for Pro)', async () => {
    render(<PaywallScreen />);

    await waitFor(() => {
      expect(screen.getByText('₹66')).toBeTruthy();
      expect(screen.getByText('₹133')).toBeTruthy();
    });
  });

  it('shows monthly prices after toggling to monthly', async () => {
    render(<PaywallScreen />);

    await waitFor(() => screen.getByText('Monthly'));
    fireEvent.press(screen.getByText('Monthly'));

    await waitFor(() => {
      expect(screen.getByText('₹99')).toBeTruthy();
      expect(screen.getByText('₹199')).toBeTruthy();
    });
  });

  it('shows "Most Popular" badge on the Pro plan', async () => {
    render(<PaywallScreen />);

    await waitFor(() => {
      expect(screen.getByText('Most Popular')).toBeTruthy();
    });
  });

  it('shows Get Hunter and Get Pro buttons', async () => {
    render(<PaywallScreen />);

    await waitFor(() => {
      expect(screen.getByText('Get Hunter')).toBeTruthy();
      expect(screen.getByText('Get Pro')).toBeTruthy();
    });
  });

  it('shows restore purchases link', async () => {
    render(<PaywallScreen />);

    await waitFor(() => {
      expect(screen.getByText('Restore previous purchases')).toBeTruthy();
    });
  });

  it('shows the real error message when restoring purchases fails (e.g. web-unsupported)', async () => {
    const { restorePurchases } = require('../services/revenueCat');
    restorePurchases.mockRejectedValueOnce(new Error("Restoring purchases isn't available on web yet."));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    render(<PaywallScreen />);
    await waitFor(() => screen.getByText('Restore previous purchases'));
    fireEvent.press(screen.getByText('Restore previous purchases'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', "Restoring purchases isn't available on web yet.");
    });

    alertSpy.mockRestore();
  });
});
