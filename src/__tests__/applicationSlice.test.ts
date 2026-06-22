import { configureStore } from '@reduxjs/toolkit';
import applicationReducer, {
  setApplications,
  setSelectedApplication,
  addApplication,
  updateApplication,
  setLoading,
  setError,
  clearError,
} from '../store/slices/applicationSlice';
import { Application } from '../types/api.types';

function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 1,
    job: { id: 10, title: 'Engineer', company: 'Acme', location: null, salaryMin: null, salaryMax: null, isRemote: false, source: 'NAUKRI', sourceUrl: null, scrapedAt: '2026-01-01', description: '', category: null, deadline: null, saved: false },
    resume: { id: 5, versionName: 'v1', fileUrl: 'https://cdn.com/r.pdf', aiScore: null, isOriginal: true, isParsed: true, createdAt: '2026-01-01' },
    status: 'APPLIED',
    coverLetter: null,
    appliedAt: '2026-06-01T10:00:00',
    notes: null,
    interviewDate: null,
    interviewNotes: null,
    offerSalary: null,
    offerDeadline: null,
    offerDetails: null,
    ...overrides,
  };
}

function makeStore(initialList: Application[] = []) {
  return configureStore({
    reducer: { application: applicationReducer },
    preloadedState: { application: { list: initialList, selected: null, isLoading: false, error: null } },
  });
}

describe('applicationSlice', () => {
  it('setApplications replaces list and clears loading', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    store.dispatch(setApplications([makeApp({ id: 1 }), makeApp({ id: 2 })]));

    const state = store.getState().application;
    expect(state.list).toHaveLength(2);
    expect(state.isLoading).toBe(false);
  });

  it('setSelectedApplication sets selected', () => {
    const app = makeApp({ id: 42 });
    const store = makeStore([app]);
    store.dispatch(setSelectedApplication(app));

    expect(store.getState().application.selected?.id).toBe(42);
  });

  it('setSelectedApplication null clears selected', () => {
    const app = makeApp({ id: 1 });
    const store = makeStore([app]);
    store.dispatch(setSelectedApplication(app));
    store.dispatch(setSelectedApplication(null));

    expect(store.getState().application.selected).toBeNull();
  });

  it('addApplication prepends to list', () => {
    const existing = makeApp({ id: 1 });
    const store = makeStore([existing]);
    const newApp = makeApp({ id: 2 });

    store.dispatch(addApplication(newApp));

    const list = store.getState().application.list;
    expect(list[0].id).toBe(2);
    expect(list[1].id).toBe(1);
  });

  it('updateApplication replaces item in list', () => {
    const app = makeApp({ id: 1, status: 'APPLIED' });
    const store = makeStore([app]);

    store.dispatch(updateApplication({ ...app, status: 'INTERVIEW' }));

    expect(store.getState().application.list[0].status).toBe('INTERVIEW');
  });

  it('updateApplication also updates selected if same id', () => {
    const app = makeApp({ id: 1, status: 'APPLIED' });
    const store = makeStore([app]);
    store.dispatch(setSelectedApplication(app));

    store.dispatch(updateApplication({ ...app, status: 'OFFER' }));

    expect(store.getState().application.selected?.status).toBe('OFFER');
  });

  it('updateApplication does not affect unrelated items', () => {
    const app1 = makeApp({ id: 1, status: 'APPLIED' });
    const app2 = makeApp({ id: 2, status: 'VIEWED' });
    const store = makeStore([app1, app2]);

    store.dispatch(updateApplication({ ...app1, status: 'REJECTED' }));

    expect(store.getState().application.list[1].status).toBe('VIEWED');
  });

  it('setLoading sets isLoading', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    expect(store.getState().application.isLoading).toBe(true);
  });

  it('setError sets error and clears loading', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    store.dispatch(setError('Network error'));

    const state = store.getState().application;
    expect(state.error).toBe('Network error');
    expect(state.isLoading).toBe(false);
  });

  it('clearError resets error to null', () => {
    const store = makeStore();
    store.dispatch(setError('Something failed'));
    store.dispatch(clearError());

    expect(store.getState().application.error).toBeNull();
  });

  it('initial state is correct', () => {
    const state = applicationReducer(undefined, { type: '@@INIT' });
    expect(state.list).toEqual([]);
    expect(state.selected).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});
