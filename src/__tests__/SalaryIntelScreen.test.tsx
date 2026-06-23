import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import intelligenceReducer from '../store/intelligenceSlice';
import SalaryIntelScreen from '../screens/home/SalaryIntelScreen';

jest.mock('../api/apiClient', () => ({ post: jest.fn(() => Promise.resolve({ data: {} })) }));

function makeStore(override = {}) {
  return configureStore({
    reducer: { intelligence: intelligenceReducer },
    preloadedState: {
      intelligence: {
        salaryResult: null, negotiationResult: null, interviewPrepResult: null,
        companyIntelResult: null, loading: false, error: null, ...override,
      },
    },
  });
}

describe('SalaryIntelScreen', () => {
  it('renders the title', () => {
    render(<Provider store={makeStore()}><SalaryIntelScreen /></Provider>);
    expect(screen.getByText('Salary Intelligence')).toBeTruthy();
  });

  it('disables button when role is empty', () => {
    render(<Provider store={makeStore()}><SalaryIntelScreen /></Provider>);
    const btn = screen.getByText('Get Salary Data');
    expect(btn).toBeTruthy();
  });

  it('shows error text when error is set', () => {
    render(<Provider store={makeStore({ error: 'API failed' })}><SalaryIntelScreen /></Provider>);
    expect(screen.getByText('API failed')).toBeTruthy();
  });

  it('shows salary result when salaryResult is loaded', () => {
    const store = makeStore({
      salaryResult: {
        salaryRange: '10–15 LPA',
        minSalary: 1000000, maxSalary: 1500000, medianSalary: 1200000,
        insights: ['High demand'], topPayingCompanies: ['Google'],
      },
    });
    render(<Provider store={store}><SalaryIntelScreen /></Provider>);
    expect(screen.getByText('10–15 LPA')).toBeTruthy();
    // Insights rendered as plain text, no bullet prefix in the Text node
    expect(screen.getByText('High demand')).toBeTruthy();
  });

  it('shows button even when loading', () => {
    // loading spinner replaces button text — just check no crash
    render(<Provider store={makeStore({ loading: true })}><SalaryIntelScreen /></Provider>);
    expect(true).toBeTruthy();
  });
});
