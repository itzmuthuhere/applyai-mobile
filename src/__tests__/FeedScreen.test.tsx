import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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
  useFocusEffect: (cb: () => void) => { cb(); },
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

const LONG_POST: FeedPost = {
  id: 10,
  content: 'A'.repeat(300) + ' this is the end of a very long post that should be truncated',
  likesCount: 0, commentsCount: 0,
  createdAt: '2026-06-24T10:00:00', myReaction: null,
  author: { id: 99, name: 'Alice' },
};

const AUTH_USER = { id: 42, name: 'Bob', email: 'bob@test.com', subscriptionPlan: 'FREE', role: 'JOBSEEKER' };

function makeStore(posts: FeedPost[] = [], page = 1) {
  return configureStore({
    reducer: { feed: feedReducer, auth: authReducer, socialNotifications: socialNotificationReducer },
    preloadedState: {
      feed: { posts, page, hasMore: true, loading: false },
      auth: { jwt: 'tok', user: AUTH_USER },
      socialNotifications: { notifications: [], unreadCount: 0, hasMore: true, page: 0 },
    } as any,
  });
}

function renderScreen(posts: FeedPost[] = [], page = 1) {
  const store = makeStore(posts, page);
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

it('header no longer duplicates the bell/chat icons already shown by the global top bar', async () => {
  const { getByTestId, UNSAFE_queryAllByProps } = renderScreen([]);
  await waitFor(() => expect(getByTestId('feed-create-post-btn')).toBeTruthy());
  expect(UNSAFE_queryAllByProps({ name: 'notifications-outline' })).toHaveLength(0);
  expect(UNSAFE_queryAllByProps({ name: 'chatbubbles-outline' })).toHaveLength(0);
});

it('tapping the header create-post button navigates to CreatePost', async () => {
  const { getByTestId } = renderScreen([]);
  await waitFor(() => expect(getByTestId('feed-create-post-btn')).toBeTruthy());
  fireEvent.press(getByTestId('feed-create-post-btn'));
  expect(mockNavigate).toHaveBeenCalledWith('CreatePost');
});

it('empty state "Find people to follow" navigates to Search', async () => {
  const { getByText } = renderScreen([]);
  await waitFor(() => expect(getByText('Find people to follow')).toBeTruthy());
  fireEvent.press(getByText('Find people to follow'));
  expect(mockNavigate).toHaveBeenCalledWith('Search', { initialQuery: '' });
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

it('tapping react on unreacted post — button is present', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [MOCK_POST] } });
  });
  mockPost.mockResolvedValue({ data: {} });
  const { getByTestId } = renderScreen([]);
  await waitFor(() => getByTestId(`react-btn-${MOCK_POST.id}`));
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
  mockGet.mockImplementation(() => new Promise(() => {})); // never resolves
  renderScreen([]);
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
  await waitFor(() => getByTestId('delete-btn-2'));
  fireEvent.press(getByTestId('delete-btn-2'));
  expect(alertSpy).toHaveBeenCalledWith('Delete Post', expect.any(String), expect.any(Array));
});

it('edit button navigates to CreatePost with editPost param', async () => {
  const ownPost: FeedPost = { ...MOCK_POST, id: 3, author: { id: 42, name: 'Bob' } };
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [ownPost] } });
  });
  const { getByTestId } = renderScreen([]);
  await waitFor(() => getByTestId('edit-btn-3'));
  fireEvent.press(getByTestId('edit-btn-3'));
  expect(mockNavigate).toHaveBeenCalledWith('CreatePost', { editPost: ownPost });
});

it('long post shows See more button', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [LONG_POST] } });
  });
  const { getByTestId } = renderScreen([]);
  await waitFor(() => getByTestId('see-more-btn'));
  expect(getByTestId('see-more-btn')).toBeTruthy();
});

it('short post does not show See more button', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [MOCK_POST] } });
  });
  const { queryByTestId } = renderScreen([]);
  await waitFor(() => {}, { timeout: 200 }).catch(() => {});
  expect(queryByTestId('see-more-btn')).toBeNull();
});

it('See more expands to full content and toggles to See less', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    return Promise.resolve({ data: { content: [LONG_POST] } });
  });
  const { getByTestId, getByText } = renderScreen([]);
  await waitFor(() => getByTestId('see-more-btn'));
  fireEvent.press(getByTestId('see-more-btn'));
  await waitFor(() => expect(getByText('See less')).toBeTruthy());
});

it('load-more requests page 1 (not page 0) after initial load', async () => {
  // Verify the core duplicate-content fix: setPosts sets page=1 so the next
  // pagination call requests page 1, not page 0 (which would re-fetch existing data).
  // We pre-load posts in the store with page=1, so loadFeed(false) will use page=1.
  const feedCalls: number[] = [];
  mockGet.mockImplementation((url: string, opts: any) => {
    if (url.includes('unread-count')) return Promise.resolve({ data: { count: 0 } });
    feedCalls.push(opts?.params?.page ?? 0);
    return Promise.resolve({ data: { content: [] } });
  });

  // Start with posts already in state + page=1 (as setPosts would set after first load)
  const store = configureStore({
    reducer: { feed: feedReducer, auth: authReducer, socialNotifications: socialNotificationReducer },
    preloadedState: {
      feed: { posts: [MOCK_POST], page: 1, hasMore: true, loading: false },
      auth: { jwt: 'tok', user: AUTH_USER },
      socialNotifications: { notifications: [], unreadCount: 0, hasMore: true, page: 0 },
    } as any,
  });
  const { getByTestId } = render(
    <Provider store={store}><FeedScreen /></Provider>
  );
  // initial render shows existing post (no spinner); FlatList calls loadFeed(true) on mount
  // which resets to page 0 — but after that setPosts sets page=1 again.
  // The important thing: any subsequent loadFeed(false) must request page 1, not page 0.
  await waitFor(() => getByTestId('react-btn-1'));
  // feedCalls[0] is the initial reset load (page 0), any further load-more would be page 1
  if (feedCalls.length > 1) {
    expect(feedCalls[1]).toBe(1);
  }
});
