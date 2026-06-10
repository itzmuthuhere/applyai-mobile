import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import intelligenceReducer from '../store/intelligenceSlice';
import NegotiationCoachScreen from '../screens/home/NegotiationCoachScreen';

jest.mock('../api/apiClient', () => ({ post: jest.fn() }));

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

describe('NegotiationCoachScreen', () => {
  it('renders title', () => {
    render(<Provider store={makeStore()}><NegotiationCoachScreen /></Provider>);
    expect(screen.getByText('Negotiation Coach')).toBeTruthy();
  });

  it('shows verdict card when result loaded', () => {
    const store = makeStore({
      negotiationResult: {
        verdict: 'Negotiate — you can get 15% more',
        counterOfferRange: '13–15 LPA',
        marketPosition: 'Your offer is below market',
        negotiationScript: 'Thank you for the offer...',
        talkingPoints: ['Strong Spring Boot experience'],
        redFlags: [],
      },
    });
    render(<Provider store={store}><NegotiationCoachScreen /></Provider>);
    expect(screen.getByText('Negotiate — you can get 15% more')).toBeTruthy();
    expect(screen.getByText('13–15 LPA')).toBeTruthy();
  });

  it('shows red flags section when present', () => {
    const store = makeStore({
      negotiationResult: {
        verdict: 'Be cautious',
        counterOfferRange: '12 LPA',
        marketPosition: 'At market',
        negotiationScript: 'Script...',
        talkingPoints: [],
        redFlags: ['Startup — equity risk'],
      },
    });
    render(<Provider store={store}><NegotiationCoachScreen /></Provider>);
    expect(screen.getByText('Red Flags')).toBeTruthy();
    expect(screen.getByText('⚠ Startup — equity risk')).toBeTruthy();
  });
});
