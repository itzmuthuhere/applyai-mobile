import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import FollowingScreen from '../screens/feed/FollowingScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: { userId: 5, userName: 'Alice' } }),
}));

const mockGet = jest.fn();
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: (...a: any[]) => mockGet(...a) },
}));

const FOLLOWING_USER = { id: 20, name: 'Carol', headline: 'PM', followersCount: 88, followingCount: 10 };

beforeEach(() => { jest.clearAllMocks(); });

it('shows following list when API returns data', async () => {
  mockGet.mockResolvedValue({ data: { content: [FOLLOWING_USER] } });
  const { getByText, getByTestId } = render(<FollowingScreen />);
  await waitFor(() => expect(getByText('Carol')).toBeTruthy());
  expect(getByTestId('following-list')).toBeTruthy();
});

it('shows empty state when not following anyone', async () => {
  mockGet.mockResolvedValue({ data: { content: [] } });
  const { getByText } = render(<FollowingScreen />);
  await waitFor(() => expect(getByText('Not following anyone yet')).toBeTruthy());
});
