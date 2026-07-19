import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({ navigate: mockNavigate })),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', background: '#F8FAFC', surface: '#FFFFFF',
    textPrimary: '#0F172A', textMuted: '#94A3B8', border: '#E2E8F0',
  },
  API_ENDPOINTS: {
    SOCIAL_NOTIFICATIONS_UNREAD: '/api/notifications/social/unread-count',
  },
}));

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ data: { count: 0 } })) },
}));

let mockState: any = {
  auth: { user: { name: 'Muthu', profilePicture: null } },
  socialNotifications: { unreadCount: 0 },
};
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector: any) => selector(mockState)),
  useDispatch: jest.fn(() => mockDispatch),
}));

import apiClient from '../api/apiClient';
import GlobalSearchBar from '../components/GlobalSearchBar';

describe('GlobalSearchBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { count: 0 } });
    mockState = {
      auth: { user: { name: 'Muthu', profilePicture: null } },
      socialNotifications: { unreadCount: 0 },
    };
  });

  it('renders avatar initial, search pill, and bell', () => {
    render(<GlobalSearchBar topInset={44} />);
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getByTestId('global-search-bar')).toBeTruthy();
    expect(screen.getByTestId('global-bell-btn')).toBeTruthy();
  });

  it('does not render a chat icon (social feed/chat is hidden)', () => {
    render(<GlobalSearchBar topInset={44} />);
    expect(screen.queryByTestId('global-chat-btn')).toBeNull();
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

  it('navigates to the Jobs feed when the search pill is tapped', () => {
    render(<GlobalSearchBar topInset={44} />);
    fireEvent.press(screen.getByTestId('global-search-bar'));
    expect(mockNavigate).toHaveBeenCalledWith('Main', {
      screen: 'JobsTab',
      params: { screen: 'JobFeed' },
    });
  });

  it('navigates to Notifications when bell is tapped', () => {
    render(<GlobalSearchBar topInset={44} />);
    fireEvent.press(screen.getByTestId('global-bell-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('Main', {
      screen: 'HomeTab',
      params: { screen: 'Notifications' },
    });
  });

  it('fetches the unread notification count on mount (regression: this used to only happen inside the now-hidden FeedScreen, silently breaking the bell badge)', async () => {
    render(<GlobalSearchBar topInset={44} />);
    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications/social/unread-count')
    );
  });
});
