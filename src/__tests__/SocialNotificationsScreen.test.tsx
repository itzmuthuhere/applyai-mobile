import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import socialNotificationReducer from '../store/slices/notificationSlice';
import authReducer from '../store/slices/authSlice';
import SocialNotificationsScreen from '../screens/feed/SocialNotificationsScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack, setOptions: jest.fn() }),
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    patch: (...a: any[]) => mockPatch(...a),
  },
}));

const AUTH_USER = { id: 1, name: 'Bob', email: 'b@b.com', subscriptionPlan: 'FREE', role: 'JOBSEEKER' };

const MOCK_NOTIF = {
  id: 10,
  type: 'POST_LIKE',
  message: 'Alice liked your post',
  read: false,
  createdAt: '2026-06-24T10:00:00',
  actor: { id: 99, name: 'Alice', profilePicture: null },
  postId: 5,
};

function makeStore() {
  return configureStore({
    reducer: { socialNotifications: socialNotificationReducer, auth: authReducer },
    preloadedState: {
      socialNotifications: { notifications: [], unreadCount: 2, hasMore: true, page: 0 },
      auth: { jwt: 'tok', user: AUTH_USER },
    } as any,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ data: { content: [MOCK_NOTIF], last: true } });
  mockPost.mockResolvedValue({ data: {} });
  mockPatch.mockResolvedValue({ data: {} });
});

it('loads and shows notification', async () => {
  const { getByText } = render(
    <Provider store={makeStore()}>
      <SocialNotificationsScreen />
    </Provider>
  );
  await waitFor(() => expect(getByText('Alice liked your post')).toBeTruthy());
});

it('shows empty state when no notifications', async () => {
  mockGet.mockResolvedValue({ data: { content: [], last: true } });
  const { getByText } = render(
    <Provider store={makeStore()}>
      <SocialNotificationsScreen />
    </Provider>
  );
  await waitFor(() => expect(getByText('No notifications yet')).toBeTruthy());
});

it('automatically marks all read once the notification list loads (opening the screen is the "seen it" signal)', async () => {
  render(
    <Provider store={makeStore()}>
      <SocialNotificationsScreen />
    </Provider>
  );
  await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/api/notifications/social/read-all'));
});

it('marks an unread notification read and navigates on tap', async () => {
  // Auto-mark-all-read fires on load; make it fail here so this item stays
  // unread and the individual tap-to-read fallback path is actually exercised.
  mockPost.mockRejectedValueOnce(new Error('network error'));
  const { getByTestId } = render(
    <Provider store={makeStore()}>
      <SocialNotificationsScreen />
    </Provider>
  );
  await waitFor(() => expect(getByTestId('notif-item-10')).toBeTruthy());
  fireEvent.press(getByTestId('notif-item-10'));

  await waitFor(() => {
    expect(mockPatch).toHaveBeenCalledWith('/api/notifications/social/10/read');
    expect(mockNavigate).toHaveBeenCalledWith('PostDetail', { postId: 5 });
  });
});
