import { configureStore } from '@reduxjs/toolkit';
import intelligenceReducer, {
  fetchSalaryIntel, fetchNegotiationCoach, fetchInterviewPrepPlan,
  clearSalary, clearNegotiation,
} from '../store/intelligenceSlice';

function makeStore() {
  return configureStore({ reducer: { intelligence: intelligenceReducer } });
}

describe('intelligenceSlice', () => {
  it('initializes with all null results', () => {
    const s = makeStore().getState().intelligence;
    expect(s.salaryResult).toBeNull();
    expect(s.negotiationResult).toBeNull();
    expect(s.interviewPrepResult).toBeNull();
    expect(s.companyIntelResult).toBeNull();
  });

  it('sets loading true on salary pending', () => {
    const store = makeStore();
    store.dispatch({ type: fetchSalaryIntel.pending.type });
    expect(store.getState().intelligence.loading).toBe(true);
  });

  it('saves salaryResult on salary fulfilled', () => {
    const store = makeStore();
    const payload = { salaryRange: '10–15 LPA', minSalary: 1000000, maxSalary: 1500000, medianSalary: 1200000 };
    store.dispatch({ type: fetchSalaryIntel.fulfilled.type, payload });
    expect(store.getState().intelligence.salaryResult?.salaryRange).toBe('10–15 LPA');
  });

  it('clearSalary resets salaryResult', () => {
    const store = makeStore();
    store.dispatch({ type: fetchSalaryIntel.fulfilled.type, payload: { salaryRange: '8–12 LPA' } });
    store.dispatch(clearSalary());
    expect(store.getState().intelligence.salaryResult).toBeNull();
  });

  it('saves negotiationResult on negotiation fulfilled', () => {
    const store = makeStore();
    const payload = { verdict: 'Negotiate', counterOfferRange: '13–15 LPA' };
    store.dispatch({ type: fetchNegotiationCoach.fulfilled.type, payload });
    expect(store.getState().intelligence.negotiationResult?.verdict).toBe('Negotiate');
  });

  it('clearNegotiation resets negotiationResult', () => {
    const store = makeStore();
    store.dispatch({ type: fetchNegotiationCoach.fulfilled.type, payload: { verdict: 'Accept' } });
    store.dispatch(clearNegotiation());
    expect(store.getState().intelligence.negotiationResult).toBeNull();
  });

  it('saves interviewPrepResult on prep fulfilled', () => {
    const store = makeStore();
    const payload = { totalDays: 7, targetRole: 'Backend Dev', company: 'Razorpay', days: [] };
    store.dispatch({ type: fetchInterviewPrepPlan.fulfilled.type, payload });
    expect(store.getState().intelligence.interviewPrepResult?.totalDays).toBe(7);
  });

  it('sets error on rejection', () => {
    const store = makeStore();
    store.dispatch({ type: fetchSalaryIntel.rejected.type, payload: 'API error' });
    expect(store.getState().intelligence.error).toBe('API error');
  });
});
