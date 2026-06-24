import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import FollowersScreen from '../screens/feed/FollowersScreen';

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

const FOLLOWER = { id: 10, name: 'Bob', headline: 'Dev', followersCount: 12, followingCount: 5 };

beforeEach(() => { jest.clearAllMocks(); });

it('shows followers list when API returns data', async () => {
  mockGet.mockResolvedValue({ data: { content: [FOLLOWER] } });
  const { getByText, getByTestId } = render(<FollowersScreen />);
  await waitFor(() => expect(getByText('Bob')).toBeTruthy());
  expect(getByTestId('followers-list')).toBeTruthy();
});

it('shows empty state when no followers', async () => {
  mockGet.mockResolvedValue({ data: { content: [] } });
  const { getByText } = render(<FollowersScreen />);
  await waitFor(() => expect(getByText('No followers yet')).toBeTruthy());
});
