// apiClient.test.ts
// Tests the axios instance configuration and interceptors using jest module mocking
jest.mock('../utils/auth', () => ({
  getJwt: jest.fn(),
  clearJwt: jest.fn(),
}));

import apiClient, { setUnauthorizedHandler } from '../api/apiClient';
import { getJwt, clearJwt } from '../utils/auth';

const mockGetJwt = getJwt as jest.MockedFunction<typeof getJwt>;
const mockClearJwt = clearJwt as jest.MockedFunction<typeof clearJwt>;

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is an axios instance with correct baseURL', () => {
    expect(apiClient.defaults.baseURL).toBe(process.env.EXPO_PUBLIC_API_URL);
  });

  it('has a 30 second timeout configured', () => {
    expect(apiClient.defaults.timeout).toBe(30000);
  });

  it('sets Content-Type to application/json by default', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('request interceptor attaches Bearer token when JWT exists', async () => {
    mockGetJwt.mockResolvedValueOnce('my-jwt-token');

    const config: any = {
      headers: {} as Record<string, string>,
    };

    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const result = await interceptor(config);

    expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
  });

  it('request interceptor skips Authorization when JWT is null', async () => {
    mockGetJwt.mockResolvedValueOnce(null);

    const config: any = { headers: {} as Record<string, string> };
    const interceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const result = await interceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('response interceptor calls clearJwt and onUnauthorized on 401', async () => {
    mockClearJwt.mockResolvedValueOnce(undefined);
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);

    const error = { response: { status: 401 } };
    const interceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    await expect(interceptor(error)).rejects.toEqual(error);
    expect(mockClearJwt).toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalled();

    // cleanup
    setUnauthorizedHandler(() => {});
  });

  it('response interceptor does not call clearJwt on non-401 errors', async () => {
    const error = { response: { status: 500 } };
    const interceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    await expect(interceptor(error)).rejects.toEqual(error);
    expect(mockClearJwt).not.toHaveBeenCalled();
  });

  it('response interceptor passes through successful responses unchanged', () => {
    const response = { data: { id: 1 }, status: 200 };
    const interceptor = (apiClient.interceptors.response as any).handlers[0].fulfilled;

    const result = interceptor(response);

    expect(result).toBe(response);
  });

  it('setUnauthorizedHandler replaces previous handler', async () => {
    mockClearJwt.mockResolvedValueOnce(undefined);
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    setUnauthorizedHandler(handler1);
    setUnauthorizedHandler(handler2);

    const error = { response: { status: 401 } };
    const interceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    await expect(interceptor(error)).rejects.toEqual(error);
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();

    setUnauthorizedHandler(() => {});
  });
});
