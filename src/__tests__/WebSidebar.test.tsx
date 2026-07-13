import React from 'react';
import { Platform } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import WebSidebar from '../navigation/WebSidebar';

const mockUseWindowDimensions = jest.fn(() => ({ width: 1280, height: 800 }));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockUseWindowDimensions(),
}));

function makeStore(user: any) {
  return configureStore({
    reducer: { auth: (state = { user }) => state },
  });
}

function makeProps(overrides = {}) {
  const routes = [
    { key: 'HomeTab', name: 'HomeTab' },
    { key: 'FeedTab', name: 'FeedTab' },
  ];
  return {
    state: { routes, index: 0 },
    descriptors: {
      HomeTab: { options: { tabBarIcon: () => null } },
      FeedTab: { options: { tabBarIcon: () => null } },
    },
    navigation: { navigate: jest.fn(), emit: jest.fn(() => ({ defaultPrevented: false })) },
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    ...overrides,
  } as any;
}

describe('WebSidebar', () => {
  const originalOS = Platform.OS;
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  });
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });

  it('navigates to the Profile screen when the user footer is pressed', () => {
    const props = makeProps();
    render(
      <Provider store={makeStore({ name: 'Muthu Test', subscriptionPlan: 'PRO' })}>
        <WebSidebar {...props} />
      </Provider>
    );

    fireEvent.press(screen.getByText('Muthu Test'));

    expect(props.navigation.navigate).toHaveBeenCalledWith('HomeTab', { screen: 'Profile' });
  });

  it('falls back to BottomTabBar below the desktop breakpoint (no user footer press target)', () => {
    mockUseWindowDimensions.mockReturnValueOnce({ width: 400, height: 800 } as any);
    const props = makeProps();
    render(
      <Provider store={makeStore({ name: 'Muthu Test' })}>
        <WebSidebar {...props} />
      </Provider>
    );

    expect(screen.queryByText('PRO Plan')).toBeNull();
  });
});
