import { configureStore } from '@reduxjs/toolkit';
import notificationReducer, { registerFcmToken, setFcmToken } from '../store/notificationSlice';

function makeStore() {
  return configureStore({ reducer: { notifications: notificationReducer } });
}

describe('notificationSlice', () => {
  it('initializes with null token and registered=false', () => {
    const s = makeStore().getState().notifications;
    expect(s.fcmToken).toBeNull();
    expect(s.registered).toBe(false);
  });

  it('sets token with setFcmToken', () => {
    const store = makeStore();
    store.dispatch(setFcmToken('mock-token-123'));
    expect(store.getState().notifications.fcmToken).toBe('mock-token-123');
  });

  it('sets token and registered=true on registerFcmToken fulfilled', () => {
    const store = makeStore();
    store.dispatch({ type: registerFcmToken.fulfilled.type, payload: 'fcm-abc' });
    const s = store.getState().notifications;
    expect(s.fcmToken).toBe('fcm-abc');
    expect(s.registered).toBe(true);
  });

  it('sets error on registerFcmToken rejected', () => {
    const store = makeStore();
    store.dispatch({ type: registerFcmToken.rejected.type, payload: 'Network error' });
    expect(store.getState().notifications.error).toBe('Network error');
  });
});
