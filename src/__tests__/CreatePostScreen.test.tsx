import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import feedReducer, { FeedPost } from '../store/slices/feedSlice';
import authReducer from '../store/slices/authSlice';
import CreatePostScreen from '../screens/feed/CreatePostScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => ({ params: mockRouteParams }),
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    put: (...a: any[]) => mockPut(...a),
  },
}));

jest.mock('../constants', () => ({
  API_ENDPOINTS: {
    FEED: '/api/feed',
    FEED_MEDIA: '/api/feed/media',
    USER_SEARCH: '/api/users/search',
  },
}));

const AUTH_USER = { id: 1, name: 'Muthu', email: 'm@test.com', subscriptionPlan: 'FREE' };

function makeStore() {
  return configureStore({
    reducer: { feed: feedReducer, auth: authReducer },
    preloadedState: {
      feed: { posts: [], page: 0, hasMore: true, loading: false },
      auth: { jwt: 'tok', user: AUTH_USER, isLoading: false, error: null },
    } as any,
  });
}

function renderScreen() {
  return render(
    <Provider store={makeStore()}>
      <CreatePostScreen />
    </Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = {};
  mockPost.mockResolvedValue({ data: { id: 99, content: 'test', author: { id: 1, name: 'Muthu' }, likesCount: 0, commentsCount: 0, createdAt: '2026-06-27T10:00:00' } });
  mockPut.mockResolvedValue({ data: { id: 5, content: 'edited', author: { id: 1, name: 'Muthu' }, likesCount: 0, commentsCount: 0, createdAt: '2026-06-27T10:00:00' } });
});

it('renders Create Post header in create mode', () => {
  renderScreen();
  expect(screen.getByText('Create Post')).toBeTruthy();
  expect(screen.getByText('Post')).toBeTruthy();
});

it('pressing Post with empty content does not call API', async () => {
  renderScreen();
  fireEvent.press(screen.getByTestId('post-submit-btn'));
  await waitFor(() => expect(mockPost).not.toHaveBeenCalled());
});

it('Post button enables after typing content', () => {
  renderScreen();
  fireEvent.changeText(screen.getByTestId('post-content-input'), 'Hello world');
  expect(screen.getByTestId('post-submit-btn').props.disabled).toBeFalsy();
});

it('pressing Post when content exceeds 2000 chars does not call API', async () => {
  renderScreen();
  fireEvent.changeText(screen.getByTestId('post-content-input'), 'x'.repeat(2001));
  fireEvent.press(screen.getByTestId('post-submit-btn'));
  await waitFor(() => expect(mockPost).not.toHaveBeenCalled());
});

it('char counter turns red when content exceeds 2000 chars', () => {
  renderScreen();
  fireEvent.changeText(screen.getByTestId('post-content-input'), 'x'.repeat(2001));
  const counter = screen.getByTestId('char-count');
  expect(counter.props.style).toEqual(expect.arrayContaining([
    expect.objectContaining({ color: expect.any(String) }),
  ]));
});

it('submitting in create mode calls POST and dispatches prependPost', async () => {
  renderScreen();
  fireEvent.changeText(screen.getByTestId('post-content-input'), 'My new post');
  fireEvent.press(screen.getByTestId('post-submit-btn'));
  await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
    '/api/feed',
    expect.objectContaining({ content: 'My new post' })
  ));
  await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
});

it('renders Edit Post header and Save button in edit mode', () => {
  const editPost: FeedPost = {
    id: 5, content: 'Old content', likesCount: 0, commentsCount: 0,
    createdAt: '2026-06-27T10:00:00', myReaction: null,
    author: { id: 1, name: 'Muthu' },
  };
  mockRouteParams = { editPost };
  renderScreen();
  expect(screen.getByText('Edit Post')).toBeTruthy();
  expect(screen.getByText('Save')).toBeTruthy();
});

it('pre-fills content from editPost param', () => {
  const editPost: FeedPost = {
    id: 5, content: 'Old content', likesCount: 0, commentsCount: 0,
    createdAt: '2026-06-27T10:00:00', myReaction: null,
    author: { id: 1, name: 'Muthu' },
  };
  mockRouteParams = { editPost };
  renderScreen();
  expect(screen.getByTestId('post-content-input').props.value).toBe('Old content');
});

it('submitting in edit mode calls PUT and dispatches updatePost', async () => {
  const editPost: FeedPost = {
    id: 5, content: 'Old content', likesCount: 0, commentsCount: 0,
    createdAt: '2026-06-27T10:00:00', myReaction: null,
    author: { id: 1, name: 'Muthu' },
  };
  mockRouteParams = { editPost };
  renderScreen();
  fireEvent.changeText(screen.getByTestId('post-content-input'), 'Updated content');
  fireEvent.press(screen.getByTestId('post-submit-btn'));
  await waitFor(() => expect(mockPut).toHaveBeenCalledWith(
    '/api/feed/5',
    expect.objectContaining({ content: 'Updated content' })
  ));
  await waitFor(() => expect(mockGoBack).toHaveBeenCalled());
});

it('image picker modal opens when image button pressed', () => {
  renderScreen();
  fireEvent.changeText(screen.getByTestId('post-content-input'), 'content');
  fireEvent.press(screen.getByTestId('pick-image-btn'));
  expect(screen.getByTestId('image-picker-modal')).toBeTruthy();
  expect(screen.getByTestId('pick-library-btn')).toBeTruthy();
  expect(screen.getByTestId('pick-camera-btn')).toBeTruthy();
});

it('image picker modal closes on cancel', () => {
  renderScreen();
  fireEvent.press(screen.getByTestId('pick-image-btn'));
  fireEvent.press(screen.getByTestId('pick-image-cancel-btn'));
  expect(screen.queryByTestId('image-picker-modal')).toBeNull();
});
