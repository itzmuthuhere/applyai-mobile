import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: (cb: () => void) => { cb(); },
}));

jest.mock('../theme/ThemeContext', () => ({
  useTheme: () => ({
    primary: '#2563EB', primaryLight: '#DBEAFE', secondary: '#10B981',
    background: '#F8FAFC', surface: '#FFFFFF', surfaceAlt: '#F1F5F9',
    textPrimary: '#0F172A', textSecondary: '#64748B', textMuted: '#94A3B8',
    border: '#E2E8F0', error: '#EF4444', warning: '#F59E0B', success: '#10B981',
  }),
  useThemeSettings: () => ({ isDark: false, mode: 'light', accent: 'blue', colors: {} }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    PROFILE: '/api/profile',
  },
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

import apiClient from '../api/apiClient';
import authReducer from '../store/slices/authSlice';
import themeReducer from '../store/slices/themeSlice';
import ProfileScreen from '../screens/home/ProfileScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

function makeUser(overrides: any = {}) {
  return {
    id: 1, email: 'muthu@example.com', name: 'Muthu Raja',
    role: 'JOBSEEKER', subscriptionPlan: 'FREE',
    targetRole: 'Software Engineer', targetLocation: 'Chennai',
    minSalary: 1_200_000, remotePreference: 'HYBRID',
    skills: 'Java, Spring Boot', headline: 'Java Dev @ BofA',
    bio: 'Passionate builder', city: 'Chennai', country: 'India',
    phone: null, yearsOfExperience: 4,
    linkedinUrl: null, githubUrl: null, portfolioUrl: null, twitterUrl: null,
    profilePicture: null, followersCount: 12, followingCount: 5,
    completenessScore: 65, completenessHints: ['Add a bio', 'Add experience'],
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function makeFullProfile(user: any = makeUser()) {
  return { ...user, experience: [], education: [], certifications: [] };
}

function makeStore(user: any = makeUser(), plan = 'FREE') {
  return configureStore({
    reducer: { auth: authReducer, theme: themeReducer },
    preloadedState: {
      auth: { jwt: 'token', user: { ...user, subscriptionPlan: plan }, isLoading: false, error: null },
    },
  });
}

function renderScreen(user: any = makeUser(), plan = 'FREE') {
  return render(
    <Provider store={makeStore(user, plan)}>
      <ProfileScreen />
    </Provider>
  );
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: API returns full profile successfully
    mockGet.mockResolvedValue({ data: makeFullProfile() });
  });

  it('renders user name after API load', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Muthu Raja')).toBeTruthy();
    });
  });

  it('renders user email', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('muthu@example.com')).toBeTruthy();
    });
  });

  it('renders headline when set', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Java Dev @ BofA')).toBeTruthy();
    });
  });

  it('renders Free Plan badge for free users', async () => {
    renderScreen(makeUser(), 'FREE');
    await waitFor(() => {
      expect(screen.getByText('Free Plan')).toBeTruthy();
    });
  });

  it('renders Hunter Plan badge', async () => {
    mockGet.mockResolvedValue({ data: makeFullProfile(makeUser({ subscriptionPlan: 'HUNTER' })) });
    renderScreen(makeUser({ subscriptionPlan: 'HUNTER' }), 'HUNTER');
    await waitFor(() => {
      expect(screen.getByText('Hunter Plan')).toBeTruthy();
    });
  });

  it('renders Pro Plan badge', async () => {
    mockGet.mockResolvedValue({ data: makeFullProfile(makeUser({ subscriptionPlan: 'PRO' })) });
    renderScreen(makeUser({ subscriptionPlan: 'PRO' }), 'PRO');
    await waitFor(() => {
      expect(screen.getByText('Pro Plan')).toBeTruthy();
    });
  });

  it('shows profile completeness card when score < 100', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('completeness-card')).toBeTruthy();
    });
  });

  it('does not show completeness card when score is 100', async () => {
    mockGet.mockResolvedValue({
      data: makeFullProfile(makeUser({ completenessScore: 100, completenessHints: [] })),
    });
    renderScreen(makeUser({ completenessScore: 100, completenessHints: [] }));
    await waitFor(() => {
      expect(screen.queryByTestId('completeness-card')).toBeNull();
    });
  });

  it('shows bio section when bio is set', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Passionate builder')).toBeTruthy();
    });
  });

  it('shows location (city + country)', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Chennai, India')).toBeTruthy();
    });
  });

  it('shows skills chips', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Java')).toBeTruthy();
      expect(screen.getByText('Spring Boot')).toBeTruthy();
    });
  });

  it('shows Experience section header', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Experience')).toBeTruthy();
    });
  });

  it('shows Education section header', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Education')).toBeTruthy();
    });
  });

  it('shows Job Preferences section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeTruthy();
    });
  });

  it('shows followers and following counts', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('12')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
    });
  });

  it('renders sign out button', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('sign-out-btn')).toBeTruthy();
    });
  });

  it('shows My Resumes in quick links', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('My Resumes')).toBeTruthy();
    });
  });

  it('shows My Applications in quick links', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('My Applications')).toBeTruthy();
    });
  });

  it('shows Saved Jobs in quick links', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Saved Jobs')).toBeTruthy();
    });
  });

  it('falls back to store user when API fails', async () => {
    mockGet.mockRejectedValue(new Error('network error'));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Muthu Raja')).toBeTruthy();
    });
  });

  it('shows upgrade CTA for FREE plan users', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/Upgrade/i)).toBeTruthy();
    });
  });

  it('does not show upgrade CTA for PRO users', async () => {
    mockGet.mockResolvedValue({ data: makeFullProfile(makeUser({ subscriptionPlan: 'PRO' })) });
    renderScreen(makeUser({ subscriptionPlan: 'PRO' }), 'PRO');
    await waitFor(() => {
      expect(screen.queryByText(/Upgrade to/i)).toBeNull();
    });
  });

  it('shows experience entries when present', async () => {
    const exp = [{ id: 1, company: 'BofA', title: 'Senior Java Dev', location: null, startMonth: 1, startYear: 2022, endMonth: null, endYear: null, current: true, description: null, createdAt: '2026-01-01' }];
    mockGet.mockResolvedValue({ data: { ...makeFullProfile(), experience: exp } });
    renderScreen();
    await waitFor(() => {
      // Title renders standalone; company renders as "BofA" when location is null
      expect(screen.getByText('Senior Java Dev')).toBeTruthy();
    });
  });

  it('shows education entries when present', async () => {
    const edu = [{ id: 1, school: 'Anna University', degree: 'B.E.', fieldOfStudy: 'CSE', startYear: 2016, endYear: 2020, current: false, grade: '8.5', description: null, createdAt: '2026-01-01' }];
    mockGet.mockResolvedValue({ data: { ...makeFullProfile(), education: edu } });
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Anna University')).toBeTruthy();
    });
  });
});
