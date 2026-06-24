import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer, { Conversation } from '../store/slices/chatSlice';
import authReducer from '../store/slices/authSlice';
import ChatListScreen from '../screens/feed/ChatListScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

const mockGet = jest.fn();
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: (...a: any[]) => mockGet(...a) },
}));

const MOCK_CONV: Conversation = {
  partnerId: 7, partnerName: 'Carol', partnerHeadline: 'Product Manager',
  lastMessage: 'Hi there!', lastMessageAt: '2026-06-24T09:00:00', unreadCount: 2,
};

function makeStore(conversations: Conversation[] = []) {
  return configureStore({
    reducer: { chat: chatReducer, auth: authReducer },
    preloadedState: {
      chat: { conversations, messages: {} },
      auth: { jwt: 'tok', user: { id: 1, name: 'Bob', email: 'b@t.com', subscriptionPlan: 'FREE' } },
    } as any,
  });
}

function renderScreen(conversations: Conversation[] = []) {
  const store = makeStore(conversations);
  return render(
    <Provider store={store}>
      <ChatListScreen />
    </Provider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({ data: [] });
});

it('shows empty state when API returns no conversations', async () => {
  const { getByText } = renderScreen([]);
  await waitFor(() => expect(getByText('No messages yet')).toBeTruthy());
});

it('shows conversation returned by API', async () => {
  mockGet.mockResolvedValue({ data: [MOCK_CONV] });
  const { getByText } = renderScreen([]);
  await waitFor(() => expect(getByText('Carol')).toBeTruthy());
  expect(getByText('Hi there!')).toBeTruthy();
  expect(getByText('Product Manager')).toBeTruthy();
});

it('navigates to ChatDetail when conversation pressed', async () => {
  mockGet.mockResolvedValue({ data: [MOCK_CONV] });
  const { getByTestId } = renderScreen([]);
  await waitFor(() => getByTestId(`conv-item-${MOCK_CONV.partnerId}`));
  fireEvent.press(getByTestId(`conv-item-${MOCK_CONV.partnerId}`));
  expect(mockNavigate).toHaveBeenCalledWith('ChatDetail', {
    partnerId: 7, partnerName: 'Carol', partnerPicture: undefined,
  });
});

it('shows unread badge count', async () => {
  mockGet.mockResolvedValue({ data: [MOCK_CONV] });
  const { getByText } = renderScreen([]);
  await waitFor(() => expect(getByText('2')).toBeTruthy());
});

it('does not show badge when no unread', async () => {
  const noUnread = { ...MOCK_CONV, unreadCount: 0 };
  mockGet.mockResolvedValue({ data: [noUnread] });
  const { queryByText } = renderScreen([]);
  await waitFor(() => queryByText('Carol'));
  expect(queryByText('0')).toBeNull();
});
