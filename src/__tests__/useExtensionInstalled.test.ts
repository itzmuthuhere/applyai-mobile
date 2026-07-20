import { renderHook, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useExtensionInstalled } from '../hooks/useExtensionInstalled';

describe('useExtensionInstalled', () => {
  const originalOS = Platform.OS;
  let postMessageMock: jest.Mock;
  let addEventListenerMock: jest.Mock;

  beforeEach(() => {
    postMessageMock = jest.fn();
    addEventListenerMock = jest.fn();
    (window as any).postMessage = postMessageMock;
    (window as any).addEventListener = addEventListenerMock;
    (window as any).removeEventListener = jest.fn();
    (window as any).location = { origin: 'http://localhost:8090' };
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.useRealTimers();
  });

  it('reports not installed on native without pinging window', () => {
    Platform.OS = 'ios';
    const { result } = renderHook(() => useExtensionInstalled());

    expect(result.current).toBe(false);
    expect(postMessageMock).not.toHaveBeenCalled();
  });

  it('reports installed on web when the extension replies to the ping', async () => {
    Platform.OS = 'web';
    const { result } = renderHook(() => useExtensionInstalled());

    expect(postMessageMock).toHaveBeenCalledWith(
      { type: 'APPLYAI_EXTENSION_PING' },
      'http://localhost:8090',
    );
    const handler = addEventListenerMock.mock.calls[0][1];

    act(() => {
      handler({ source: window, data: { type: 'APPLYAI_EXTENSION_PONG', version: '1.0.2' } });
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('reports not installed on web when no reply arrives before the timeout', () => {
    jest.useFakeTimers();
    Platform.OS = 'web';
    const { result } = renderHook(() => useExtensionInstalled());

    act(() => { jest.advanceTimersByTime(500); });

    expect(result.current).toBe(false);
  });
});
