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
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
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

it('calls mark-all-read API when button pressed', async () => {
  const { getByText } = render(
    <Provider store={makeStore()}>
      <SocialNotificationsScreen />
    </Provider>
  );
  await waitFor(() => expect(getByText('Mark all read')).toBeTruthy());
  fireEvent.press(getByText('Mark all read'));
  await waitFor(() => expect(mockPost).toHaveBeenCalled());
});
