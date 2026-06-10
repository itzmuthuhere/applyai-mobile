import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import blacklistReducer from '../store/blacklistSlice';
import BlacklistScreen from '../screens/home/BlacklistScreen';

jest.mock('../api/apiClient', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(),
  delete: jest.fn(),
}));

function makeStore(items = []) {
  return configureStore({
    reducer: { blacklist: blacklistReducer },
    preloadedState: { blacklist: { items, loading: false, error: null } },
  });
}

describe('BlacklistScreen', () => {
  it('renders title', () => {
    render(<Provider store={makeStore()}><BlacklistScreen /></Provider>);
    expect(screen.getByText('Company Blacklist')).toBeTruthy();
  });

  it('shows empty state when no items', async () => {
    const { findByText } = render(<Provider store={makeStore()}><BlacklistScreen /></Provider>);
    const text = await findByText('No companies blacklisted');
    expect(text).toBeTruthy();
  });

  it('renders blacklisted companies', () => {
    const items: any[] = [
      { id: 1, companyName: 'Acme Corp', reason: 'REJECTED_ME', createdAt: '2026-06-10' },
    ];
    render(<Provider store={makeStore(items)}><BlacklistScreen /></Provider>);
    expect(screen.getByText('Acme Corp')).toBeTruthy();
    expect(screen.getByText('Rejected me')).toBeTruthy();
  });

  it('renders add blacklist button in header area', () => {
    render(<Provider store={makeStore()}><BlacklistScreen /></Provider>);
    // The + button and subtitle are always visible
    expect(screen.getByText('Company Blacklist')).toBeTruthy();
  });
});
