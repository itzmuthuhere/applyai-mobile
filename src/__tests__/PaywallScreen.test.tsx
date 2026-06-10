import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PaywallScreen from '../screens/common/PaywallScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
}));

describe('PaywallScreen', () => {
  it('renders the title', () => {
    render(<PaywallScreen />);
    expect(screen.getByText('Unlock Full Access')).toBeTruthy();
  });

  it('renders all three plan names', () => {
    render(<PaywallScreen />);
    expect(screen.getByText('Free')).toBeTruthy();
    expect(screen.getByText('Hunter')).toBeTruthy();
    expect(screen.getByText('Pro')).toBeTruthy();
  });

  it('shows prices for each plan', () => {
    render(<PaywallScreen />);
    expect(screen.getByText('₹0/month')).toBeTruthy();
    expect(screen.getByText('₹299/month')).toBeTruthy();
    expect(screen.getByText('₹599/month')).toBeTruthy();
  });

  it('shows "Most Popular" badge on Hunter plan', () => {
    render(<PaywallScreen />);
    expect(screen.getByText('Most Popular')).toBeTruthy();
  });

  it('shows current plan label for Free', () => {
    render(<PaywallScreen />);
    expect(screen.getByText('Current Plan')).toBeTruthy();
  });
});
