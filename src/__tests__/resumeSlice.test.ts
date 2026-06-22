import { configureStore } from '@reduxjs/toolkit';
import resumeReducer, {
  setResumes,
  setSelectedResume,
  addResume,
  setUploading,
  setAnalyzing,
  setLoading,
  setError,
  updateResumeScore,
  updateResumeParsed,
  clearError,
} from '../store/slices/resumeSlice';
import { Resume } from '../types/api.types';

function makeResume(id: number, name = 'v1'): Resume {
  return {
    id,
    versionName: name,
    fileUrl: `https://cdn.com/r${id}.pdf`,
    aiScore: null,
    isOriginal: id === 1,
    isParsed: false,
    createdAt: '2026-06-01T10:00:00',
  };
}

function makeStore() {
  return configureStore({ reducer: { resume: resumeReducer } });
}

describe('resumeSlice', () => {
  it('initial state is correct', () => {
    const state = resumeReducer(undefined, { type: '@@INIT' });
    expect(state.list).toEqual([]);
    expect(state.selected).toBeNull();
    expect(state.isUploading).toBe(false);
    expect(state.isAnalyzing).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setResumes replaces list and clears loading', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    store.dispatch(setResumes([makeResume(1), makeResume(2)]));

    const state = store.getState().resume;
    expect(state.list).toHaveLength(2);
    expect(state.isLoading).toBe(false);
  });

  it('setSelectedResume stores selected', () => {
    const store = makeStore();
    const r = makeResume(5);
    store.dispatch(setSelectedResume(r));

    expect(store.getState().resume.selected?.id).toBe(5);
  });

  it('setSelectedResume null clears selected', () => {
    const store = makeStore();
    store.dispatch(setSelectedResume(makeResume(1)));
    store.dispatch(setSelectedResume(null));

    expect(store.getState().resume.selected).toBeNull();
  });

  it('addResume prepends to list and clears uploading', () => {
    const store = makeStore();
    store.dispatch(setResumes([makeResume(1)]));
    store.dispatch(setUploading(true));
    store.dispatch(addResume(makeResume(2, 'v2')));

    const state = store.getState().resume;
    expect(state.list[0].id).toBe(2);
    expect(state.list[1].id).toBe(1);
    expect(state.isUploading).toBe(false);
  });

  it('setUploading sets flag', () => {
    const store = makeStore();
    store.dispatch(setUploading(true));
    expect(store.getState().resume.isUploading).toBe(true);
  });

  it('setAnalyzing sets flag', () => {
    const store = makeStore();
    store.dispatch(setAnalyzing(true));
    expect(store.getState().resume.isAnalyzing).toBe(true);
  });

  it('setError stores error and clears loading and uploading flags', () => {
    const store = makeStore();
    store.dispatch(setLoading(true));
    store.dispatch(setUploading(true));
    store.dispatch(setError('Upload failed'));

    const state = store.getState().resume;
    expect(state.error).toBe('Upload failed');
    expect(state.isLoading).toBe(false);
    expect(state.isUploading).toBe(false);
  });

  it('clearError resets error', () => {
    const store = makeStore();
    store.dispatch(setError('Something failed'));
    store.dispatch(clearError());

    expect(store.getState().resume.error).toBeNull();
  });

  it('updateResumeScore updates score in list and selected', () => {
    const resume = makeResume(5);
    const store = configureStore({
      reducer: { resume: resumeReducer },
      preloadedState: { resume: { list: [resume], selected: resume, isLoading: false, isUploading: false, isAnalyzing: false, error: null } },
    });

    store.dispatch(updateResumeScore({ resumeId: 5, score: 87 }));

    const state = store.getState().resume;
    expect(state.list[0].aiScore).toBe(87);
    expect(state.selected?.aiScore).toBe(87);
  });

  it('updateResumeScore does not affect unrelated resumes', () => {
    const resume1 = makeResume(1);
    const resume2 = makeResume(2);
    const store = configureStore({
      reducer: { resume: resumeReducer },
      preloadedState: { resume: { list: [resume1, resume2], selected: null, isLoading: false, isUploading: false, isAnalyzing: false, error: null } },
    });

    store.dispatch(updateResumeScore({ resumeId: 1, score: 90 }));

    expect(store.getState().resume.list[1].aiScore).toBeNull();
  });

  it('updateResumeParsed sets isParsed true in list and selected', () => {
    const resume = makeResume(5);
    const store = configureStore({
      reducer: { resume: resumeReducer },
      preloadedState: { resume: { list: [resume], selected: resume, isLoading: false, isUploading: false, isAnalyzing: false, error: null } },
    });

    store.dispatch(updateResumeParsed({ resumeId: 5 }));

    const state = store.getState().resume;
    expect(state.list[0].isParsed).toBe(true);
    expect(state.selected?.isParsed).toBe(true);
  });
});
