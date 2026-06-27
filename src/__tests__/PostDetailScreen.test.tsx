import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import feedReducer, { FeedPost } from '../store/slices/feedSlice';
import authReducer from '../store/slices/authSlice';
import socialNotificationReducer from '../store/slices/notificationSlice';
import PostDetailScreen from '../screens/feed/PostDetailScreen';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { postId: 1 } }),
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();
const mockPut = jest.fn();
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    delete: (...a: any[]) => mockDelete(...a),
    put: (...a: any[]) => mockPut(...a),
  },
}));

const AUTH_USER = { id: 42, name: 'Bob', email: 'bob@test.com', subscriptionPlan: 'FREE', role: 'JOBSEEKER' };

const MOCK_POST: FeedPost = {
  id: 1, content: 'Great news!', likesCount: 3, commentsCount: 2,
  createdAt: '2026-06-27T10:00:00', myReaction: null,
  author: { id: 99, name: 'Alice', headline: 'Engineer' },
};

const MOCK_COMMENT = {
  id: 10, content: 'Nice post!',
  author: { id: 5, name: 'Carol' },
  createdAt: '2026-06-27T11:00:00',
};

const OWN_COMMENT = {
  id: 11, content: 'My comment',
  author: { id: 42, name: 'Bob' },
  createdAt: '2026-06-27T11:30:00',
};

function makeStore(post?: FeedPost) {
  return configureStore({
    reducer: { feed: feedReducer, auth: authReducer, socialNotifications: socialNotificationReducer },
    preloadedState: {
      feed: { posts: post ? [post] : [], page: 1, hasMore: true, loading: false },
      auth: { jwt: 'tok', user: AUTH_USER },
      socialNotifications: { notifications: [], unreadCount: 0, hasMore: true, page: 0 },
    } as any,
  });
}

function renderScreen(post?: FeedPost) {
  const store = makeStore(post);
  return render(<Provider store={store}><PostDetailScreen /></Provider>);
}

const EMPTY_COMMENTS = { data: { content: [], last: true } };
const WITH_COMMENTS = { data: { content: [MOCK_COMMENT], last: true } };

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(EMPTY_COMMENTS);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it('renders post content from Redux', async () => {
  const { getByText } = renderScreen(MOCK_POST);
  await waitFor(() => expect(getByText('Great news!')).toBeTruthy());
  expect(getByText('Alice')).toBeTruthy();
});

it('fetches post from API when not in Redux', async () => {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/api/feed/1') && !url.includes('comments')) {
      return Promise.resolve({ data: MOCK_POST });
    }
    return Promise.resolve(EMPTY_COMMENTS);
  });
  const { getByText } = renderScreen(); // no post in Redux
  await waitFor(() => expect(getByText('Great news!')).toBeTruthy());
});

it('renders loaded comments', async () => {
  mockGet.mockResolvedValue(WITH_COMMENTS);
  const { getByText } = renderScreen(MOCK_POST);
  await waitFor(() => expect(getByText('Nice post!')).toBeTruthy());
  expect(getByText('Carol')).toBeTruthy();
});

it('sends comment and appends it to list', async () => {
  const newComment = { id: 99, content: 'Hello!', author: { id: 42, name: 'Bob' }, createdAt: '2026-06-27T12:00:00' };
  mockPost.mockResolvedValue({ data: newComment });
  const { getByTestId, getByText } = renderScreen(MOCK_POST);
  await waitFor(() => getByTestId('comment-input'));
  fireEvent.changeText(getByTestId('comment-input'), 'Hello!');
  fireEvent.press(getByTestId('send-comment-btn'));
  await waitFor(() => expect(getByText('Hello!')).toBeTruthy());
});

it('react button renders and opens picker on press when unreacted', async () => {
  const { getByTestId } = renderScreen(MOCK_POST);
  await waitFor(() => getByTestId('detail-react-btn'));
  fireEvent.press(getByTestId('detail-react-btn'));
  await waitFor(() => getByTestId('reaction-option-LIKE'));
  expect(getByTestId('reaction-option-LIKE')).toBeTruthy();
});

it('picking a reaction calls POST react and updates optimistically', async () => {
  mockPost.mockResolvedValue({ data: { likesCount: 4, myReaction: 'LIKE' } });
  const { getByTestId } = renderScreen(MOCK_POST);
  await waitFor(() => getByTestId('detail-react-btn'));
  fireEvent.press(getByTestId('detail-react-btn'));
  await waitFor(() => getByTestId('reaction-option-LIKE'));
  fireEvent.press(getByTestId('reaction-option-LIKE'));
  await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
    expect.stringContaining('/react'), { type: 'LIKE' }
  ));
});

it('tapping react button when already reacted calls DELETE react', async () => {
  const reactedPost = { ...MOCK_POST, myReaction: 'LIKE', likesCount: 4 };
  mockDelete.mockResolvedValue({ data: { likesCount: 3, myReaction: null } });
  const { getByTestId } = renderScreen(reactedPost);
  await waitFor(() => getByTestId('detail-react-btn'));
  fireEvent.press(getByTestId('detail-react-btn'));
  await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('/react')));
});

it('long pressing own comment shows action alert', async () => {
  mockGet.mockResolvedValue({ data: { content: [OWN_COMMENT], last: true } });
  const alertSpy = jest.spyOn(Alert, 'alert');
  const { getByTestId } = renderScreen(MOCK_POST);
  await waitFor(() => getByTestId(`comment-item-${OWN_COMMENT.id}`));
  fireEvent(getByTestId(`comment-item-${OWN_COMMENT.id}`), 'longPress');
  expect(alertSpy).toHaveBeenCalledWith('Comment', undefined, expect.any(Array));
});

it('deleting own comment calls DELETE and removes it from list', async () => {
  mockGet.mockResolvedValue({ data: { content: [OWN_COMMENT], last: true } });
  mockDelete.mockResolvedValue({});
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons: any) => {
    const deleteBtn = buttons.find((b: any) => b.style === 'destructive');
    deleteBtn?.onPress?.();
  });
  const { getByTestId, queryByText } = renderScreen(MOCK_POST);
  await waitFor(() => getByTestId(`comment-item-${OWN_COMMENT.id}`));
  await act(async () => {
    fireEvent(getByTestId(`comment-item-${OWN_COMMENT.id}`), 'longPress');
  });
  await waitFor(() => expect(queryByText('My comment')).toBeNull(), { timeout: 3000 });
  expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining(`/comments/${OWN_COMMENT.id}`));
});

it('edit inline: shows text input and saves with PUT', async () => {
  mockGet.mockResolvedValue({ data: { content: [OWN_COMMENT], last: true } });
  mockPut.mockResolvedValue({ data: { ...OWN_COMMENT, content: 'edited content' } });
  jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons: any) => {
    const editBtn = buttons.find((b: any) => b.text === 'Edit');
    editBtn?.onPress?.();
  });
  const { getByTestId } = renderScreen(MOCK_POST);
  await waitFor(() => getByTestId(`comment-item-${OWN_COMMENT.id}`));
  fireEvent(getByTestId(`comment-item-${OWN_COMMENT.id}`), 'longPress');
  await waitFor(() => getByTestId('edit-comment-input'));
  fireEvent.changeText(getByTestId('edit-comment-input'), 'edited content');
  fireEvent.press(getByTestId('edit-save-btn'));
  await waitFor(() => expect(mockPut).toHaveBeenCalledWith(
    expect.stringContaining(`/comments/${OWN_COMMENT.id}`),
    { content: 'edited content' }
  ));
});

it('shows comment count from post data not array length', async () => {
  // commentsCount = 2 in post but API returns only 1 comment
  const { getByTestId } = renderScreen(MOCK_POST);
  await waitFor(() => getByTestId('post-comments-count'));
  expect(getByTestId('post-comments-count').props.children).toContain(2);
});
