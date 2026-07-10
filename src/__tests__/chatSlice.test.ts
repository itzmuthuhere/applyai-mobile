import chatReducer, {
  setMessages, appendMessage, updateMessage, removeMessage,
  ChatMsg,
} from '../store/slices/chatSlice';

const makeMsg = (id: number, overrides: Partial<ChatMsg> = {}): ChatMsg => ({
  id,
  senderId: 1,
  recipientId: 2,
  content: `Message ${id}`,
  deleted: false,
  read: false,
  createdAt: '2026-07-10T10:00:00',
  ...overrides,
});

const initial = { conversations: [], messages: {} };

describe('setMessages', () => {
  it('stores messages for the given partnerId', () => {
    const state = chatReducer(initial, setMessages({ partnerId: 2, messages: [makeMsg(1), makeMsg(2)] }));
    expect(state.messages[2]).toHaveLength(2);
  });

  it('dedupes messages that share the same id', () => {
    // Regression: the 5s poll in ChatDetailScreen re-dispatches setMessages on every
    // tick; if the fetched page ever overlaps a prior one, FlatList's keyExtractor
    // (String(item.id)) throws "duplicate key" warnings unless this is deduped.
    const dup = makeMsg(5);
    const state = chatReducer(initial, setMessages({ partnerId: 2, messages: [dup, makeMsg(6), { ...dup }] }));
    expect(state.messages[2]).toHaveLength(2);
    expect(state.messages[2].map(m => m.id)).toEqual([5, 6]);
  });

  it('replaces the previous list for that partnerId rather than merging', () => {
    const base = { ...initial, messages: { 2: [makeMsg(1)] } };
    const state = chatReducer(base, setMessages({ partnerId: 2, messages: [makeMsg(2)] }));
    expect(state.messages[2].map(m => m.id)).toEqual([2]);
  });
});

describe('appendMessage', () => {
  it('appends a new message to an existing conversation', () => {
    const base = { ...initial, messages: { 2: [makeMsg(1)] } };
    const state = chatReducer(base, appendMessage({ partnerId: 2, message: makeMsg(2) }));
    expect(state.messages[2].map(m => m.id)).toEqual([1, 2]);
  });

  it('is a no-op when the message id already exists', () => {
    const base = { ...initial, messages: { 2: [makeMsg(1)] } };
    const state = chatReducer(base, appendMessage({ partnerId: 2, message: makeMsg(1, { content: 'dup' }) }));
    expect(state.messages[2]).toHaveLength(1);
    expect(state.messages[2][0].content).toBe('Message 1');
  });

  it('initializes the conversation array when none exists yet', () => {
    const state = chatReducer(initial, appendMessage({ partnerId: 3, message: makeMsg(1) }));
    expect(state.messages[3]).toHaveLength(1);
  });
});

describe('updateMessage', () => {
  it('replaces the message in-place by id', () => {
    const base = { ...initial, messages: { 2: [makeMsg(1), makeMsg(2)] } };
    const edited = makeMsg(1, { content: 'Edited', editedAt: '2026-07-10T10:05:00' });
    const state = chatReducer(base, updateMessage({ partnerId: 2, message: edited }));
    expect(state.messages[2][0].content).toBe('Edited');
    expect(state.messages[2][1].id).toBe(2);
  });

  it('is a no-op when the conversation does not exist', () => {
    const state = chatReducer(initial, updateMessage({ partnerId: 9, message: makeMsg(1) }));
    expect(state.messages[9]).toBeUndefined();
  });
});

describe('removeMessage', () => {
  it('marks the message deleted and clears content', () => {
    const base = { ...initial, messages: { 2: [makeMsg(1)] } };
    const state = chatReducer(base, removeMessage({ partnerId: 2, messageId: 1 }));
    expect(state.messages[2][0].deleted).toBe(true);
    expect(state.messages[2][0].content).toBeNull();
  });

  it('is a no-op for an unknown messageId', () => {
    const base = { ...initial, messages: { 2: [makeMsg(1)] } };
    const state = chatReducer(base, removeMessage({ partnerId: 2, messageId: 999 }));
    expect(state.messages[2][0].deleted).toBe(false);
  });
});
