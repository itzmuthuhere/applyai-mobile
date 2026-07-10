import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: mockNavigate })),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', background: '#F8FAFC', surface: '#FFFFFF',
    textPrimary: '#0F172A', textMuted: '#94A3B8', border: '#E2E8F0',
  },
}));

let mockState: any = {
  auth: { user: { name: 'Muthu', profilePicture: null } },
  socialNotifications: { unreadCount: 0 },
};
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector: any) => selector(mockState)),
}));

import GlobalSearchBar from '../components/GlobalSearchBar';

describe('GlobalSearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      auth: { user: { name: 'Muthu', profilePicture: null } },
      socialNotifications: { unreadCount: 0 },
    };
  });

  it('renders avatar initial, search pill, chat icon, and bell', () => {
    render(<GlobalSearchBar topInset={44} />);
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getByTestId('global-search-bar')).toBeTruthy();
    expect(screen.getByTestId('global-chat-btn')).toBeTruthy();
  });

  it('does not show the unread dot when unreadCount is 0', () => {
    mockState.socialNotifications.unreadCount = 0;
    render(<GlobalSearchBar topInset={44} />);
    expect(screen.queryByTestId('global-bell-dot')).toBeNull();
  });

  it('shows the unread dot when unreadCount is greater than 0', () => {
    mockState.socialNotifications.unreadCount = 3;
    render(<GlobalSearchBar topInset={44} />);
    expect(screen.getByTestId('global-bell-dot')).toBeTruthy();
  });

  it('navigates to ChatList when chat icon is tapped', () => {
    render(<GlobalSearchBar topInset={44} />);
    fireEvent.press(screen.getByTestId('global-chat-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('Main', {
      screen: 'FeedTab',
      params: { screen: 'ChatList' },
    });
  });

  it('navigates to Notifications when bell is tapped', () => {
    render(<GlobalSearchBar topInset={44} />);
    fireEvent.press(screen.getByTestId('global-bell-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('Main', {
      screen: 'Home',
      params: { screen: 'Notifications' },
    });
  });
});
