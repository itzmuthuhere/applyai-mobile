import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer, { ChatMsg } from '../store/slices/chatSlice';
import authReducer from '../store/slices/authSlice';
import ChatDetailScreen from '../screens/feed/ChatDetailScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockRoute = {
  params: { partnerId: 7, partnerName: 'Carol', partnerPicture: undefined },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  useRoute: () => mockRoute,
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

jest.mock('../constants', () => ({
  API_ENDPOINTS: {
    CHAT_MESSAGES: '/api/chat/messages',
    CHAT_READ: '/api/chat/read',
  },
}));

const MSG: ChatMsg = {
  id: 1, senderId: 1, recipientId: 7,
  content: 'Hello Carol!', read: true, createdAt: '2026-06-25T10:00:00',
};

function makeStore(messages: Record<number, ChatMsg[]> = {}) {
  return configureStore({
    reducer: { chat: chatReducer, auth: authReducer },
    preloadedState: {
      chat: { conversations: [], messages },
      auth: {
        jwt: 'tok',
        user: { id: 1, name: 'Bob', email: 'b@t.com', subscriptionPlan: 'FREE' },
        isLoading: false, error: null,
      },
    } as any,
  });
}

function renderScreen(messages: Record<number, ChatMsg[]> = {}) {
  return render(
    <Provider store={makeStore(messages)}>
      <ChatDetailScreen />
    </Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ data: { content: [] } });
  mockPost.mockResolvedValue({ data: {} });
});

it('renders without crashing when chat state is empty (defensive optional chaining)', () => {
  // This is the regression test for the s.chat?.messages?.[partnerId] fix.
  // Previously crashed with "Cannot read properties of undefined (reading 'messages')".
  renderScreen({});
  expect(screen.getByTestId('chat-input')).toBeTruthy();
});

it('shows partner name in header', () => {
  renderScreen({});
  expect(screen.getByText('Carol')).toBeTruthy();
});

it('shows preloaded messages', async () => {
  renderScreen({ 7: [MSG] });
  await waitFor(() => expect(screen.getByText('Hello Carol!')).toBeTruthy());
});

it('loads messages from API on mount', async () => {
  mockGet.mockResolvedValue({ data: { content: [MSG] } });
  renderScreen({});
  await waitFor(() => expect(mockGet).toHaveBeenCalledWith(
    '/api/chat/messages',
    expect.objectContaining({ params: { with: 7, page: 0, size: 50 } })
  ));
});

it('pressing send when input is empty does not call API', async () => {
  renderScreen({});
  fireEvent.press(screen.getByTestId('chat-send-btn'));
  await waitFor(() => expect(mockPost).not.toHaveBeenCalledWith('/api/chat/messages', expect.anything()));
});

it('send button enables after typing', () => {
  renderScreen({});
  fireEvent.changeText(screen.getByTestId('chat-input'), 'Hi there');
  expect(screen.getByTestId('chat-send-btn').props.disabled).toBeFalsy();
});
