import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  CHROME_EXTENSION_URL: 'https://chrome.google.com/webstore/detail/nigpinofkjobdkncjgojoloohkfdnjbm',
}));

import ExtensionPromptScreen from '../screens/auth/ExtensionPromptScreen';

describe('ExtensionPromptScreen', () => {
  it('renders the install prompt', () => {
    render(<ExtensionPromptScreen onDone={jest.fn()} />);
    expect(screen.getByText('Install the ApplyAI Chrome extension')).toBeTruthy();
  });

  it('opens the Chrome Web Store link on Install', () => {
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    render(<ExtensionPromptScreen onDone={jest.fn()} />);

    fireEvent.press(screen.getByTestId('extension-prompt-install-btn'));

    expect(openURLSpy).toHaveBeenCalledWith(
      'https://chrome.google.com/webstore/detail/nigpinofkjobdkncjgojoloohkfdnjbm'
    );
  });

  it('calls onDone when the user skips', () => {
    const onDone = jest.fn();
    render(<ExtensionPromptScreen onDone={onDone} />);

    fireEvent.press(screen.getByTestId('extension-prompt-skip-btn'));

    expect(onDone).toHaveBeenCalled();
  });
});
