import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Alert } from 'react-native';

jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  MediaTypeOptions: { Images: 'Images' },
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
    PROFILE_EXPERIENCE: '/api/profile/experience',
    PROFILE_EXPERIENCE_BY_ID: (id: number) => `/api/profile/experience/${id}`,
    PROFILE_EDUCATION: '/api/profile/education',
    PROFILE_EDUCATION_BY_ID: (id: number) => `/api/profile/education/${id}`,
    PROFILE_CERTIFICATIONS: '/api/profile/certifications',
    PROFILE_CERTIFICATION_BY_ID: (id: number) => `/api/profile/certifications/${id}`,
    PROFILE_PICTURE_UPLOAD: '/api/auth/profile/picture',
  },
}));

import apiClient from '../api/apiClient';
import authReducer from '../store/slices/authSlice';
import themeReducer from '../store/slices/themeSlice';
import ProfileSettingsScreen from '../screens/home/ProfileSettingsScreen';

const mockGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;
const mockPut = apiClient.put as jest.MockedFunction<typeof apiClient.put>;
const mockPost = apiClient.post as jest.MockedFunction<typeof apiClient.post>;
const mockDelete = apiClient.delete as jest.MockedFunction<typeof apiClient.delete>;

function makeUser(overrides: any = {}) {
  return {
    id: 1, email: 'muthu@example.com', name: 'Muthu Raja',
    role: 'JOBSEEKER', subscriptionPlan: 'FREE',
    targetRole: 'Software Engineer', targetLocation: 'Chennai',
    minSalary: 1_200_000, remotePreference: 'HYBRID',
    skills: 'Java, Spring Boot', headline: 'Java Dev @ BofA',
    bio: 'Passionate builder', city: 'Chennai', country: 'India',
    phone: '+91 98765 43210', yearsOfExperience: 4,
    linkedinUrl: 'https://linkedin.com/in/muthu',
    githubUrl: null, portfolioUrl: null, twitterUrl: null,
    profilePicture: null, followersCount: 12, followingCount: 5,
    completenessScore: 65, profileStrengthLabel: 'Advanced', completenessHints: [],
    createdAt: '2026-01-01T00:00:00',
    ...overrides,
  };
}

function makeFullProfile(overrides: any = {}) {
  return {
    ...makeUser(overrides),
    experience: [],
    education: [],
    certifications: [],
    ...overrides,
  };
}

function makeStore(user: any = makeUser()) {
  return configureStore({
    reducer: { auth: authReducer, theme: themeReducer },
    preloadedState: {
      auth: { jwt: 'token', user, isLoading: false, error: null },
    },
  });
}

function renderScreen(user: any = makeUser()) {
  return render(
    <Provider store={makeStore(user)}>
      <ProfileSettingsScreen />
    </Provider>
  );
}

describe('ProfileSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: makeFullProfile() });
    mockPut.mockResolvedValue({ data: makeFullProfile() });
    mockPost.mockResolvedValue({ data: {} });
    mockDelete.mockResolvedValue({ data: {} });
  });

  it('renders the Edit Profile header', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeTruthy();
    });
  });

  it('renders Save button in header', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('save-btn')).toBeTruthy();
    });
  });

  it('renders Basic Info section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Basic Info')).toBeTruthy();
    });
  });

  it('populates name field from API response', async () => {
    renderScreen();
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Muthu Raja');
      expect(nameInput).toBeTruthy();
    });
  });

  it('populates phone field from API response', async () => {
    renderScreen();
    await waitFor(() => {
      const phoneInput = screen.getByDisplayValue('+91 98765 43210');
      expect(phoneInput).toBeTruthy();
    });
  });

  it('renders Experience section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Experience')).toBeTruthy();
    });
  });

  it('renders Education section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Education')).toBeTruthy();
    });
  });

  it('renders Certifications section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Certifications')).toBeTruthy();
    });
  });

  it('renders Skills section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Skills')).toBeTruthy();
    });
  });

  it('populates skills input from API response', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('skills-input')).toBeTruthy();
      expect(screen.getByDisplayValue('Java, Spring Boot')).toBeTruthy();
    });
  });

  it('renders Job Preferences section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Job Preferences')).toBeTruthy();
    });
  });

  it('renders Social Links section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Social Links')).toBeTruthy();
    });
  });

  it('renders Appearance section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Appearance')).toBeTruthy();
    });
  });

  it('renders Account Type section', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Account Type')).toBeTruthy();
    });
  });

  it('shows Add work experience prompt when list is empty', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('+ Add work experience')).toBeTruthy();
    });
  });

  it('shows Add education prompt when list is empty', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('+ Add education')).toBeTruthy();
    });
  });

  it('shows Add certification prompt when list is empty', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('+ Add certification')).toBeTruthy();
    });
  });

  it('shows existing experience entries', async () => {
    const exp = [{ id: 1, company: 'BofA', title: 'Java Dev', location: 'Chennai', startMonth: 1, startYear: 2022, endMonth: null, endYear: null, current: true, description: null, createdAt: '2026-01-01' }];
    mockGet.mockResolvedValue({ data: makeFullProfile({ experience: exp }) });
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Java Dev')).toBeTruthy();
      expect(screen.getByText('BofA')).toBeTruthy();
    });
  });

  it('shows existing education entries', async () => {
    const edu = [{ id: 1, school: 'Anna University', degree: 'B.E.', fieldOfStudy: 'CSE', startYear: 2016, endYear: 2020, current: false, grade: null, description: null, createdAt: '2026-01-01' }];
    mockGet.mockResolvedValue({ data: makeFullProfile({ education: edu }) });
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Anna University')).toBeTruthy();
    });
  });

  it('shows existing certifications', async () => {
    const certs = [{ id: 1, name: 'AWS SAA', issuer: 'Amazon', issueDate: '2024-01-01', expiryDate: null, credentialId: null, credentialUrl: null, createdAt: '2026-01-01' }];
    mockGet.mockResolvedValue({ data: makeFullProfile({ certifications: certs }) });
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('AWS SAA')).toBeTruthy();
      expect(screen.getByText('Amazon')).toBeTruthy();
    });
  });

  it('calls PUT /api/profile when Save is tapped', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('save-btn')).toBeTruthy());
    fireEvent.press(screen.getByTestId('save-btn'));
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/profile', expect.any(Object));
    });
  });

  it('opens add experience modal when add button tapped', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('add-exp-btn')).toBeTruthy());
    fireEvent.press(screen.getByTestId('add-exp-btn'));
    await waitFor(() => {
      expect(screen.getByText('Company *')).toBeTruthy();
    });
  });

  it('opens add education modal when add button tapped', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('add-edu-btn')).toBeTruthy());
    fireEvent.press(screen.getByTestId('add-edu-btn'));
    await waitFor(() => {
      expect(screen.getByText('School *')).toBeTruthy();
    });
  });

  it('opens add certification modal when add button tapped', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('add-cert-btn')).toBeTruthy());
    fireEvent.press(screen.getByTestId('add-cert-btn'));
    await waitFor(() => {
      expect(screen.getByText('Certification Name *')).toBeTruthy();
    });
  });

  it('renders sign out button', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('signout-btn')).toBeTruthy();
    });
  });

  it('shows salary preset chips in Job Preferences', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('₹5L')).toBeTruthy();
      expect(screen.getByText('₹12L')).toBeTruthy();
    });
  });

  it('shows remote mode chips', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Remote')).toBeTruthy();
      expect(screen.getByText('Hybrid')).toBeTruthy();
      expect(screen.getByText('Onsite')).toBeTruthy();
    });
  });

  it('shows Job Seeker account type label by default', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Job Seeker')).toBeTruthy();
    });
  });

  it('renders avatar tap button', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByTestId('avatar-btn')).toBeTruthy();
    });
  });

  it('shows fallback initials when no profile picture', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('M')).toBeTruthy();
    });
  });

  it('shows profile picture when URL is set', async () => {
    mockGet.mockResolvedValue({ data: makeFullProfile({ profilePicture: 'https://cdn.example.com/pic.jpg' }) });
    renderScreen(makeUser({ profilePicture: 'https://cdn.example.com/pic.jpg' }));
    await waitFor(() => {
      // Avatar img is rendered, no fallback initial
      expect(screen.queryByText('M')).toBeNull();
    });
  });
});
