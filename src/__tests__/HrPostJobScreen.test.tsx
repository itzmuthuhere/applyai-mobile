import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    HR_POST_JOB: '/api/hr/jobs',
  },
}));

import apiClient from '../api/apiClient';
import HrPostJobScreen from '../screens/jobs/HrPostJobScreen';

const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('HrPostJobScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Job Title input', () => {
    render(<HrPostJobScreen />);
    expect(screen.getByPlaceholderText('e.g. Senior Java Developer')).toBeTruthy();
  });

  it('renders Company Name input', () => {
    render(<HrPostJobScreen />);
    expect(screen.getByPlaceholderText('e.g. Tech Corp Pvt. Ltd.')).toBeTruthy();
  });

  it('renders Post Job Now button', () => {
    render(<HrPostJobScreen />);
    expect(screen.getByText('Post Job Now')).toBeTruthy();
  });

  it('shows hint when fields are not ready', () => {
    render(<HrPostJobScreen />);
    // Button is disabled when fields are empty — hint text is shown instead of alert
    expect(screen.getByText(/Fill in Title, Company, and Description/i)).toBeTruthy();
  });

  it('shows hint when only title is filled', () => {
    render(<HrPostJobScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Developer');
    expect(screen.getByText(/Fill in Title, Company, and Description/i)).toBeTruthy();
  });

  it('shows hint when description is shorter than 50 chars', () => {
    render(<HrPostJobScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Developer');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Tech Corp Pvt. Ltd.'), 'Acme Corp');
    fireEvent.changeText(screen.getByPlaceholderText(/Describe the role/), 'Short desc');
    // Still disabled — hint still shows
    expect(screen.getByText(/Fill in Title, Company, and Description/i)).toBeTruthy();
  });

  it('hides hint and enables button when all fields are properly filled', () => {
    render(<HrPostJobScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Developer');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Tech Corp Pvt. Ltd.'), 'Acme Corp');
    fireEvent.changeText(
      screen.getByPlaceholderText(/Describe the role/),
      'We are looking for a skilled backend developer with Java and Spring Boot experience.',
    );
    // Hint disappears when isReady = true
    expect(screen.queryByText(/Fill in Title, Company, and Description/i)).toBeNull();
  });

  it('calls API on valid input and shows success alert', async () => {
    mockPost.mockResolvedValueOnce({ data: {} });
    render(<HrPostJobScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Developer');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Tech Corp Pvt. Ltd.'), 'Acme Corp');
    fireEvent.changeText(
      screen.getByPlaceholderText(/Describe the role/),
      'We are looking for a skilled backend developer with Java and Spring Boot experience to join our growing team of engineers.',
    );
    fireEvent.press(screen.getByText('Post Job Now'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/api/hr/jobs', expect.objectContaining({
        title: 'Backend Developer',
        company: 'Acme Corp',
      }));
      expect(alertSpy).toHaveBeenCalledWith('Job Posted!', expect.any(String), expect.any(Array));
    });
  });

  it('shows error alert on API failure', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Server error occurred' } } });
    render(<HrPostJobScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Developer');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Tech Corp Pvt. Ltd.'), 'Acme Corp');
    fireEvent.changeText(
      screen.getByPlaceholderText(/Describe the role/),
      'We are looking for a skilled backend developer with Java and Spring Boot experience to join our growing team.',
    );
    fireEvent.press(screen.getByText('Post Job Now'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Server error occurred');
    });
  });

  it('shows fallback error message when no response message', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));
    render(<HrPostJobScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('e.g. Senior Java Developer'), 'Backend Developer');
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Tech Corp Pvt. Ltd.'), 'Acme Corp');
    fireEvent.changeText(
      screen.getByPlaceholderText(/Describe the role/),
      'We are looking for a skilled backend developer with Java and Spring Boot experience to join our team.',
    );
    fireEvent.press(screen.getByText('Post Job Now'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to post job. Please try again.');
    });
  });
});
