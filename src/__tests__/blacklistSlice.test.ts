import { configureStore } from '@reduxjs/toolkit';
import blacklistReducer, {
  fetchBlacklist, addToBlacklist, removeFromBlacklist,
  BlacklistEntry,
} from '../store/blacklistSlice';

function makeStore() {
  return configureStore({ reducer: { blacklist: blacklistReducer } });
}

const mockEntry: BlacklistEntry = {
  id: 1, companyName: 'Acme Corp', reason: 'REJECTED_ME', createdAt: '2026-06-10T00:00:00',
};

describe('blacklistSlice', () => {
  it('initializes with empty items', () => {
    expect(makeStore().getState().blacklist.items).toEqual([]);
  });

  it('sets loading true on fetch pending', () => {
    const store = makeStore();
    store.dispatch({ type: fetchBlacklist.pending.type });
    expect(store.getState().blacklist.loading).toBe(true);
  });

  it('populates items on fetchBlacklist fulfilled', () => {
    const store = makeStore();
    store.dispatch({ type: fetchBlacklist.fulfilled.type, payload: [mockEntry] });
    expect(store.getState().blacklist.items).toHaveLength(1);
    expect(store.getState().blacklist.items[0].companyName).toBe('Acme Corp');
  });

  it('appends item on addToBlacklist fulfilled', () => {
    const store = makeStore();
    store.dispatch({ type: addToBlacklist.fulfilled.type, payload: mockEntry });
    expect(store.getState().blacklist.items).toHaveLength(1);
  });

  it('removes item by id on removeFromBlacklist fulfilled', () => {
    const store = makeStore();
    store.dispatch({ type: fetchBlacklist.fulfilled.type, payload: [mockEntry, { ...mockEntry, id: 2, companyName: 'Other Co' }] });
    store.dispatch({ type: removeFromBlacklist.fulfilled.type, payload: 1 });
    expect(store.getState().blacklist.items).toHaveLength(1);
    expect(store.getState().blacklist.items[0].id).toBe(2);
  });

  it('sets error on fetchBlacklist rejected', () => {
    const store = makeStore();
    store.dispatch({ type: fetchBlacklist.rejected.type, payload: 'Unauthorized' });
    expect(store.getState().blacklist.error).toBe('Unauthorized');
  });
});
