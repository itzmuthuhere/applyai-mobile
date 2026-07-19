import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import socialNotificationReducer from '../store/slices/notificationSlice';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../constants', () => ({
  COLORS: {
    primary: '#2563EB', primaryLight: '#DBEAFE', background: '#F8FAFC',
    surface: '#FFFFFF', textPrimary: '#0F172A', textSecondary: '#64748B',
    textMuted: '#94A3B8', border: '#E2E8F0', error: '#EF4444',
    warning: '#F59E0B', success: '#10B981',
  },
  API_ENDPOINTS: {
    JOB_ALERTS: '/api/alerts',
    SOCIAL_NOTIFICATIONS: '/api/notifications/social',
    SOCIAL_NOTIFICATIONS_READ_ALL: '/api/notifications/social/read-all',
    SOCIAL_NOTIFICATION_READ: (id: number) => `/api/notifications/social/${id}/read`,
  },
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
jest.mock('../api/apiClient', () => ({
  __esModule: true,
  default: {
    get: (...a: any[]) => mockGet(...a),
    post: (...a: any[]) => mockPost(...a),
    patch: (...a: any[]) => mockPatch(...a),
  },
}));

import NotificationsScreen from '../screens/common/NotificationsScreen';

const ALERTS = [
  {
    id: 1, keywords: 'Java Developer', remote: false, minSalary: 1200000,
    category: 'Technology', active: true, createdAt: '2026-06-01T10:00:00',
  },
  {
    id: 2, keywords: 'Product Manager', remote: true, minSalary: null,
    category: null, active: true, createdAt: '2026-06-03T10:00:00',
  },
];

const NOTIF = {
  id: 10,
  type: 'INTERVIEW_SCHEDULED',
  message: 'Your interview for Senior Engineer is scheduled',
  read: false,
  createdAt: '2026-06-24T10:00:00',
  actor: null,
  postId: null,
};

// Social-layer type — the social feed/chat tab is hidden, so notifications of
// this shape must never render even if the backend still returns legacy rows.
const SOCIAL_NOTIF = {
  id: 11,
  type: 'POST_LIKE',
  message: 'Alice liked your post',
  read: false,
  createdAt: '2026-06-24T10:00:00',
  actor: { id: 99, name: 'Alice', profilePicture: null },
  postId: 5,
};

function makeStore(preloaded?: any) {
  return configureStore({
    reducer: { socialNotifications: socialNotificationReducer },
    preloadedState: {
      socialNotifications: { notifications: [], unreadCount: 0, hasMore: true, page: 0, ...preloaded },
    } as any,
  });
}

function renderScreen(store = makeStore()) {
  return render(
    <Provider store={store}>
      <NotificationsScreen />
    </Provider>
  );
}

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation((url: string) => {
      if (url === '/api/alerts') return Promise.resolve({ data: ALERTS });
      return Promise.resolve({ data: { content: [NOTIF], last: true } });
    });
    mockPost.mockResolvedValue({ data: {} });
    mockPatch.mockResolvedValue({ data: {} });
  });

  it('shows alert-derived rows after load', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/Job Alert: Java Developer/i)).toBeTruthy();
      expect(screen.getByText(/Job Alert: Product Manager/i)).toBeTruthy();
    });
  });

  it('shows real dynamic notifications from the backend, not static tips', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Your interview for Senior Engineer is scheduled')).toBeTruthy();
    });
    expect(screen.queryByText('Complete your profile')).toBeNull();
    expect(screen.queryByText('Tailor your resume')).toBeNull();
    expect(screen.queryByText('Practice mock interviews')).toBeNull();
    expect(screen.queryByText('Check your ATS score')).toBeNull();
  });

  it('filters out social-layer notifications (feed/chat is hidden, their tap targets no longer exist)', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/api/alerts') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: { content: [NOTIF, SOCIAL_NOTIF], last: true } });
    });
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Your interview for Senior Engineer is scheduled')).toBeTruthy();
    });
    expect(screen.queryByText('Alice liked your post')).toBeNull();
  });

  it('shows salary filter in alert body', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/Min ₹12L/i)).toBeTruthy();
    });
  });

  it('shows Remote only label for remote alerts', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText(/Remote only/i)).toBeTruthy();
    });
  });

  it('shows empty state when there are no alerts and no notifications', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/api/alerts') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: { content: [], last: true } });
    });
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeTruthy();
    });
  });

  it('calls both the alerts and social notifications endpoints on mount', async () => {
    renderScreen();
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/api/alerts');
      expect(mockGet).toHaveBeenCalledWith('/api/notifications/social', { params: { page: 0, size: 20 } });
    });
  });

  it('renders gracefully when both endpoints fail', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeTruthy();
    });
  });

  it('marks a job notification read on tap (no navigation — job notifications carry no feed/chat target)', async () => {
    // Auto-mark-all-read fires on load; make it fail here so this item stays
    // unread and the individual tap-to-read fallback path is actually exercised.
    mockPost.mockRejectedValueOnce(new Error('network error'));
    const store = makeStore();
    mockGet.mockImplementation((url: string) => {
      if (url === '/api/alerts') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: { content: [NOTIF], last: true } });
    });
    renderScreen(store);

    await waitFor(() => expect(screen.getByTestId('notif-item-10')).toBeTruthy());
    fireEvent.press(screen.getByTestId('notif-item-10'));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith('/api/notifications/social/10/read');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('automatically marks all read once the list loads (opening the screen is the "seen it" signal)', async () => {
    const store = makeStore({ notifications: [NOTIF], unreadCount: 1 });
    renderScreen(store);

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/api/notifications/social/read-all'));
  });
});
