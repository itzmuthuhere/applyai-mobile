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
const mockPut = jest.fn();
const mockDelete = jest.fn();
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    put: (...a: any[]) => mockPut(...a),
    delete: (...a: any[]) => mockDelete(...a),
  },
}));

jest.mock('../constants', () => ({
  API_ENDPOINTS: {
    CHAT_MESSAGES: '/api/chat/messages',
    CHAT_READ: '/api/chat/read',
    CHAT_MESSAGE_BY_ID: (id: number) => `/api/chat/messages/${id}`,
    CHAT_REACT: (id: number) => `/api/chat/messages/${id}/react`,
    CHAT_UPLOAD: '/api/chat/upload',
  },
}));

const MSG: ChatMsg = {
  id: 1, senderId: 1, recipientId: 7,
  content: 'Hello Carol!', deleted: false, read: true, createdAt: '2026-06-25T10:00:00',
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
  mockPut.mockResolvedValue({ data: {} });
  mockDelete.mockResolvedValue({ data: {} });
});

it('renders without crashing when chat state is empty (defensive optional chaining)', () => {
  renderScreen({});
  expect(screen.getByTestId('chat-input')).toBeTruthy();
});

it('shows partner name in header', () => {
  renderScreen({});
  expect(screen.getByText('Carol')).toBeTruthy();
});

it('shows preloaded messages', async () => {
  mockGet.mockResolvedValue({ data: { content: [MSG] } });
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

it('shows deleted placeholder for deleted message', async () => {
  const deleted: ChatMsg = { ...MSG, deleted: true, content: null };
  mockGet.mockResolvedValue({ data: { content: [deleted] } });
  renderScreen({});
  await waitFor(() => expect(screen.getByText('Message deleted')).toBeTruthy());
  expect(screen.getByTestId('msg-deleted-1')).toBeTruthy();
});

it('shows edited label on edited message', async () => {
  const edited: ChatMsg = { ...MSG, editedAt: '2026-06-25T10:05:00' };
  mockGet.mockResolvedValue({ data: { content: [edited] } });
  renderScreen({});
  await waitFor(() => expect(screen.getByTestId('msg-edited-1')).toBeTruthy());
  expect(screen.getByText('edited')).toBeTruthy();
});

it('long pressing own message shows Edit and Delete options', async () => {
  mockGet.mockResolvedValue({ data: { content: [MSG] } });
  renderScreen({});
  await waitFor(() => screen.getByTestId('msg-bubble-1'));
  fireEvent(screen.getByTestId('msg-bubble-1'), 'longPress');
  await waitFor(() => expect(screen.getByTestId('action-edit-btn')).toBeTruthy());
  expect(screen.getByTestId('action-delete-btn')).toBeTruthy();
});

it('tapping Edit pre-fills input with message content', async () => {
  mockGet.mockResolvedValue({ data: { content: [MSG] } });
  renderScreen({});
  await waitFor(() => screen.getByTestId('msg-bubble-1'));
  fireEvent(screen.getByTestId('msg-bubble-1'), 'longPress');
  await waitFor(() => screen.getByTestId('action-edit-btn'));
  fireEvent.press(screen.getByTestId('action-edit-btn'));
  await waitFor(() => {
    expect(screen.getByTestId('chat-input').props.value).toBe('Hello Carol!');
  });
});

it('tapping react emoji calls react API', async () => {
  mockGet.mockResolvedValue({ data: { content: [MSG] } });
  mockPost.mockResolvedValue({ data: { ...MSG, reactions: { '👍': [1] } } });
  renderScreen({});
  await waitFor(() => screen.getByTestId('msg-bubble-1'));
  fireEvent(screen.getByTestId('msg-bubble-1'), 'longPress');
  await waitFor(() => screen.getByTestId('react-emoji-👍'));
  fireEvent.press(screen.getByTestId('react-emoji-👍'));
  await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
    '/api/chat/messages/1/react',
    { emoji: '👍' }
  ));
});

it('long pressing partner message shows no Edit or Delete options', async () => {
  const partnerMsg: ChatMsg = { ...MSG, id: 2, senderId: 7, recipientId: 1 };
  mockGet.mockResolvedValue({ data: { content: [partnerMsg] } });
  renderScreen({});
  await waitFor(() => screen.getByTestId('msg-bubble-2'));
  fireEvent(screen.getByTestId('msg-bubble-2'), 'longPress');
  await waitFor(() => screen.getByTestId('react-emoji-👍'));
  expect(screen.queryByTestId('action-edit-btn')).toBeNull();
  expect(screen.queryByTestId('action-delete-btn')).toBeNull();
});

it('attach button is visible in input row', () => {
  renderScreen({});
  expect(screen.getByTestId('attach-btn')).toBeTruthy();
});

it('shows image attachment in bubble for image message', async () => {
  const imgMsg: ChatMsg = {
    ...MSG, id: 3, content: null,
    attachmentUrl: 'https://cdn.example.com/photo.jpg',
    attachmentType: 'IMAGE', attachmentName: 'photo.jpg', attachmentSize: 102400,
  };
  mockGet.mockResolvedValue({ data: { content: [imgMsg] } });
  renderScreen({});
  await waitFor(() => expect(screen.getByTestId('attachment-image-3')).toBeTruthy());
});

it('shows file card in bubble for PDF message', async () => {
  const pdfMsg: ChatMsg = {
    ...MSG, id: 4, content: null,
    attachmentUrl: 'https://cdn.example.com/doc.pdf',
    attachmentType: 'PDF', attachmentName: 'document.pdf', attachmentSize: 512000,
  };
  mockGet.mockResolvedValue({ data: { content: [pdfMsg] } });
  renderScreen({});
  await waitFor(() => expect(screen.getByTestId('attachment-file-4')).toBeTruthy());
  expect(screen.getByText('document.pdf')).toBeTruthy();
});

it('shows pending attachment chip after picking a document', async () => {
  const docPicker = require('expo-document-picker');
  docPicker.getDocumentAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://test.pdf', name: 'test.pdf', mimeType: 'application/pdf', size: 2048 }],
  });
  renderScreen({});
  fireEvent.press(screen.getByTestId('attach-btn'));
  await waitFor(() => screen.getByTestId('pick-files-btn'));
  fireEvent.press(screen.getByTestId('pick-files-btn'));
  await waitFor(() => expect(screen.getByTestId('pending-attachment-chip')).toBeTruthy());
  expect(screen.getByText('test.pdf')).toBeTruthy();
});
