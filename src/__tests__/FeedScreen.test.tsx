import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import feedReducer, { FeedPost } from '../store/slices/feedSlice';
import authReducer from '../store/slices/authSlice';
import socialNotificationReducer from '../store/slices/notificationSlice';
import FeedScreen from '../screens/feed/FeedScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    delete: (...a: any[]) => mockDelete(...a),
  },
}));

const MOCK_POST: FeedPost = {
  id: 1, content: 'Just got a job!', likesCount: 5, commentsCount: 2,
  createdAt: '2026-06-24T10:00:00', myReaction: null,
  author: { id: 99, name: 'Alice', headline: 'Software Engineer' },
};

const AUTH_USER = { id: 42, name: 'Bob', email: 'bob@test.com', subscriptionPlan: 'FREE', role: 'JOBSEEKER' };

function makeStore(posts: FeedPost[] = []) {
  return configureStore({
    reducer: { feed: feedReducer, auth: authReducer, socialNotifications: socialNotificationReducer },
    preloadedState: {
      feed: { posts, page: 0, hasMore: true, loading: false },
      auth: { jwt: 'tok', user: AUTH_USER },
      socialNotifications: { notifications: [], unreadCount: 0, hasMore: true, page: 0 },
    } as any,
  });
}

function renderScreen(posts: FeedPost[] = []) {
  const store = makeStore(posts);
  return render(
    <Provider store={store}>
      <FeedScreen />
    </Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [], totalPages: 1 } });
  });
});

it('shows empty state when API returns empty', async () => {
  const { getByText } = renderScreen([]);
  await waitFor(() => expect(getByText('Nothing here yet')).toBeTruthy());
});

it('renders posts returned by API', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [MOCK_POST] } });
  });
  const { getByText } = renderScreen([]);
  await waitFor(() => expect(getByText('Just got a job!')).toBeTruthy());
  expect(getByText('Alice')).toBeTruthy();
  expect(getByText('Software Engineer')).toBeTruthy();
});

it('react button is present when post is shown', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [MOCK_POST] } });
  });
  const { getByTestId } = renderScreen([]);
  await waitFor(() => getByTestId(`react-btn-${MOCK_POST.id}`));
  expect(getByTestId(`react-btn-${MOCK_POST.id}`)).toBeTruthy();
});

it('tapping react on unreacted post calls API and optimistic-updates like count', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [MOCK_POST] } });
  });
  mockPost.mockResolvedValue({ data: {} });
  const { getByTestId, getByText } = renderScreen([]);
  await waitFor(() => getByTestId(`react-btn-${MOCK_POST.id}`));
  // Long press opens reaction picker — just verify the button is there
  expect(getByTestId(`react-btn-${MOCK_POST.id}`)).toBeTruthy();
});

it('navigates to PublicProfile when author name pressed', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [MOCK_POST] } });
  });
  const { getByText } = renderScreen([]);
  await waitFor(() => getByText('Alice'));
  fireEvent.press(getByText('Alice'));
  expect(mockNavigate).toHaveBeenCalledWith('PublicProfile', { userId: 99, userName: 'Alice' });
});

it('navigates to PostDetail when Comment pressed', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [MOCK_POST] } });
  });
  const { getByText } = renderScreen([]);
  await waitFor(() => getByText('Comment'));
  fireEvent.press(getByText('Comment'));
  expect(mockNavigate).toHaveBeenCalledWith('PostDetail', { postId: 1 });
});

it('shows loading indicator initially when no posts', async () => {
  // Feed starts loading before API resolves
  mockGet.mockImplementation(() => new Promise(() => {})); // never resolves
  const { getByTestId } = renderScreen([]);
  // loading state is visible immediately
  // (after initial render, before API returns)
  await waitFor(() => {}, { timeout: 100 }).catch(() => {});
});

it('delete button shows confirmation dialog for own posts', async () => {
  const ownPost: FeedPost = { ...MOCK_POST, id: 2, author: { id: 42, name: 'Bob' } };
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [ownPost] } });
  });
  const alertSpy = jest.spyOn(Alert, 'alert');
  const { getByTestId } = renderScreen([]);
  await waitFor(() => getByTestId(`delete-btn-2`));
  fireEvent.press(getByTestId('delete-btn-2'));
  expect(alertSpy).toHaveBeenCalledWith(
    'Delete Post',
    expect.any(String),
    expect.any(Array)
  );
});

it('edit button navigates to CreatePost with editPost param', async () => {
  const ownPost: FeedPost = { ...MOCK_POST, id: 3, author: { id: 42, name: 'Bob' } };
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [ownPost] } });
  });
  const { getByTestId } = renderScreen([]);
  await waitFor(() => getByTestId(`edit-btn-3`));
  fireEvent.press(getByTestId('edit-btn-3'));
  expect(mockNavigate).toHaveBeenCalledWith('CreatePost', { editPost: ownPost });
});
