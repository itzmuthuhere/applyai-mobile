import { configureStore } from '@reduxjs/toolkit';
import interviewReducer, {
  setCurrentSession,
  setHistory,
  clearCurrentSession,
  setLoading,
  setError,
  clearError,
} from '../store/slices/interviewSlice';
import { InterviewSession } from '../types/api.types';

function makeSession(id: number): InterviewSession {
  return {
    id,
    applicationId: 20,
    status: 'IN_PROGRESS',
    overallScore: null,
    questions: [],
    createdAt: '2026-06-01T10:00:00',
    completedAt: null,
  };
}

function makeStore() {
  return configureStore({ reducer: { interview: interviewReducer } });
}

describe('interviewSlice', () => {
  it('initial state is correct', () => {
    const state = interviewReducer(undefined, { type: '@@INIT' });
    expect(state.currentSession).toBeNull();
    expect(state.history).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setCurrentSession stores session and clears loading', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    store.dispatch(setCurrentSession(makeSession(1)));

    const state = store.getState().interview;
    expect(state.currentSession?.id).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('setHistory stores list of sessions', () => {
    const store = makeStore();
    store.dispatch(setHistory([makeSession(1), makeSession(2)]));

    expect(store.getState().interview.history).toHaveLength(2);
  });

  it('clearCurrentSession sets currentSession to null', () => {
    const store = makeStore();
    store.dispatch(setCurrentSession(makeSession(5)));
    store.dispatch(clearCurrentSession());

    expect(store.getState().interview.currentSession).toBeNull();
  });

  it('setLoading sets isLoading flag', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    expect(store.getState().interview.isLoading).toBe(true);
    store.dispatch(setLoading(false));
    expect(store.getState().interview.isLoading).toBe(false);
  });

  it('setError stores error and clears loading', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    store.dispatch(setError('Interview fetch failed'));

    const state = store.getState().interview;
    expect(state.error).toBe('Interview fetch failed');
    expect(state.isLoading).toBe(false);
  });

  it('clearError resets error to null', () => {
    const store = makeStore();
    store.dispatch(setError('Something went wrong'));
    store.dispatch(clearError());

    expect(store.getState().interview.error).toBeNull();
  });

  it('setCurrentSession overwrites a previous session', () => {
    const store = makeStore();
    store.dispatch(setCurrentSession(makeSession(1)));
    store.dispatch(setCurrentSession(makeSession(99)));

    expect(store.getState().interview.currentSession?.id).toBe(99);
  });

  it('setHistory overwrites previous history', () => {
    const store = makeStore();
    store.dispatch(setHistory([makeSession(1), makeSession(2)]));
    store.dispatch(setHistory([makeSession(5)]));

    expect(store.getState().interview.history).toHaveLength(1);
    expect(store.getState().interview.history[0].id).toBe(5);
  });
});
