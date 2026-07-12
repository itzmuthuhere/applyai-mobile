import { Platform } from 'react-native';
import { configureStore } from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';
import { saveJwt } from '../utils/auth';
import { signInWithGoogleWeb } from '../utils/googleWebAuth';
import authReducer, {
  setAuth,
  clearAuth,
  clearError,
  signInWithGoogle,
  signOut,
} from '../store/slices/authSlice';
import { User } from '../types/api.types';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));
jest.mock('../utils/auth', () => ({
  saveJwt: jest.fn(),
  getJwt: jest.fn(),
  clearJwt: jest.fn(),
}));
jest.mock('../utils/googleWebAuth', () => ({
  signInWithGoogleWeb: jest.fn(),
}));

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

  describe('signInWithGoogle on web', () => {
    const originalOS = Platform.OS;
    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
      jest.clearAllMocks();
    });

    it('uses Google Identity Services (not the native SDK) and stores the returned jwt', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      (signInWithGoogleWeb as jest.Mock).mockResolvedValueOnce('web-id-token');
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { jwt: 'backend-jwt', user: makeUser() },
      });

      const store = makeStore();
      await store.dispatch(signInWithGoogle());

      expect(signInWithGoogleWeb).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/google', { idToken: 'web-id-token' });
      expect(saveJwt).toHaveBeenCalledWith('backend-jwt');
      expect(store.getState().auth.jwt).toBe('backend-jwt');
    });

    it('rejects with an error message when the web sign-in is cancelled', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      (signInWithGoogleWeb as jest.Mock).mockRejectedValueOnce(new Error('Sign-in cancelled'));

      const store = makeStore();
      await store.dispatch(signInWithGoogle());

      expect(apiClient.post).not.toHaveBeenCalled();
      expect(store.getState().auth.error).toBe('Sign-in cancelled');
    });
  });
});
