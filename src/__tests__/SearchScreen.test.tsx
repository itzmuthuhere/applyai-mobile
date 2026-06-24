import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SearchScreen from '../screens/feed/SearchScreen';
import apiClient from '../api/apiClient';

jest.mock('../api/apiClient');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: { initialQuery: '' } }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const emptyResult = Promise.resolve({ data: { content: [], totalPages: 1 } });
const emptyList = Promise.resolve({ data: [] });

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation((url: string) => {
    if (url.includes('users/search')) return emptyList;
    if (url.includes('feed/search')) return emptyResult;
    if (url.includes('hashtags/suggest')) return emptyList;
    return emptyList;
  });
  mockPost.mockResolvedValue({ data: {} });
  mockDelete.mockResolvedValue({ data: {} });
});

describe('SearchScreen', () => {
  it('renders search input and filter tabs', () => {
    const { getByTestId } = render(<SearchScreen />);
    expect(getByTestId('search-input')).toBeTruthy();
    expect(getByTestId('tab-All')).toBeTruthy();
    expect(getByTestId('tab-People')).toBeTruthy();
    expect(getByTestId('tab-Posts')).toBeTruthy();
    expect(getByTestId('tab-Hashtags')).toBeTruthy();
  });

  it('shows empty-prompt when query is blank', () => {
    const { getByTestId } = render(<SearchScreen />);
    expect(getByTestId('empty-prompt')).toBeTruthy();
  });

  it('shows people results after typing a name', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('users/search'))
        return Promise.resolve({ data: [{ id: 1, name: 'Alice', headline: 'SWE at Google' }] });
      if (url.includes('feed/search')) return emptyResult;
      return emptyList;
    });

    const { getByTestId, findByText } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('search-input'), 'Alice');

    await findByText('Alice');
    expect(getByTestId('person-1')).toBeTruthy();
  });

  it('shows post results after typing a keyword', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('feed/search'))
        return Promise.resolve({
          data: {
            content: [{ id: 5, content: 'Hello Spring Boot world', authorName: 'Bob', likesCount: 3 }],
            totalPages: 1,
          },
        });
      if (url.includes('users/search')) return emptyList;
      return emptyList;
    });

    const { getByTestId, findByText } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('search-input'), 'spring');

    await findByText('Hello Spring Boot world');
    expect(getByTestId('post-5')).toBeTruthy();
  });

  it('shows hashtag chips after typing a prefix', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('hashtags/suggest'))
        return Promise.resolve({ data: ['java', 'javascript'] });
      if (url.includes('users/search')) return emptyList;
      return emptyResult;
    });

    const { getByTestId, findByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('search-input'), 'java');

    await findByTestId('hashtag-java');
    expect(getByTestId('hashtag-javascript')).toBeTruthy();
  });

  it('shows no-results state when all searches return empty', async () => {
    mockGet.mockImplementation(() => emptyList);

    const { getByTestId, findByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('search-input'), 'xyznotfound');

    await findByTestId('no-results');
  });

  it('clears query when clear button pressed', async () => {
    const { getByTestId, findByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('search-input'), 'hello');

    const clearBtn = await findByTestId('search-input');
    fireEvent.changeText(clearBtn, '');

    await findByTestId('empty-prompt');
  });

  it('calls follow API when follow button tapped', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('users/search'))
        return Promise.resolve({ data: [{ id: 7, name: 'Carol', isFollowing: false }] });
      if (url.includes('feed/search')) return emptyResult;
      return emptyList;
    });

    const { getByTestId, findByTestId } = render(<SearchScreen />);
    fireEvent.changeText(getByTestId('search-input'), 'Carol');

    await findByTestId('follow-btn-7');
    fireEvent.press(getByTestId('follow-btn-7'));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      expect.stringContaining('/users/7/follow')
    ));
  });
});
