import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  setAuth,
  clearAuth,
  clearError,
  signInWithGoogle,
  signOut,
} from '../store/slices/authSlice';
import { User } from '../types/api.types';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'JOBSEEKER',
    subscriptionPlan: 'FREE',
    targetRole: null,
    targetLocation: null,
    minSalary: null,
    remotePreference: null,
    skills: null,
    headline: null,
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { jwt: null, user: null, isLoading: false, error: null } },
  });
}

describe('authSlice', () => {
  it('initial state is correct', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state.jwt).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setAuth stores jwt and user', () => {
    const store = makeStore();
    const user = makeUser();
    store.dispatch(setAuth({ jwt: 'token-123', user }));

    const state = store.getState().auth;
    expect(state.jwt).toBe('token-123');
    expect(state.user?.email).toBe('test@example.com');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('clearAuth resets state to initial', () => {
    const store = makeStore();
    store.dispatch(setAuth({ jwt: 'token', user: makeUser() }));
    store.dispatch(clearAuth());

    const state = store.getState().auth;
    expect(state.jwt).toBeNull();
    expect(state.user).toBeNull();
  });

  it('clearError resets error to null', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { jwt: null, user: null, isLoading: false, error: 'Some error' } },
    });

    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });

  it('signInWithGoogle.pending sets isLoading=true and clears error', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { jwt: null, user: null, isLoading: false, error: 'old error' } },
    });

    store.dispatch({ type: signInWithGoogle.pending.type });
    const state = store.getState().auth;
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('signInWithGoogle.fulfilled stores jwt and user', () => {
    const store = makeStore();
    const user = makeUser();

    store.dispatch({
      type: signInWithGoogle.fulfilled.type,
      payload: { jwt: 'new-token', user },
    });

    const state = store.getState().auth;
    expect(state.jwt).toBe('new-token');
    expect(state.user?.id).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('signInWithGoogle.rejected stores error and stops loading', () => {
    const store = makeStore();
    store.dispatch({ type: signInWithGoogle.pending.type });

    store.dispatch({
      type: signInWithGoogle.rejected.type,
      payload: 'Sign-in cancelled',
    });

    const state = store.getState().auth;
    expect(state.error).toBe('Sign-in cancelled');
    expect(state.isLoading).toBe(false);
  });

  it('signInWithGoogle.rejected with no payload uses default message', () => {
    const store = makeStore();
    store.dispatch({
      type: signInWithGoogle.rejected.type,
      payload: undefined,
    });

    expect(store.getState().auth.error).toBe('Sign-in failed');
  });

  it('signOut.fulfilled clears jwt and user', () => {
    const store = makeStore();
    store.dispatch(setAuth({ jwt: 'token', user: makeUser() }));
    store.dispatch({ type: signOut.fulfilled.type });

    const state = store.getState().auth;
    expect(state.jwt).toBeNull();
    expect(state.user).toBeNull();
  });
});
