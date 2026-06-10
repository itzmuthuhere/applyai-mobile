import { useEffect, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { registerFcmToken } from '../store/notificationSlice';

// FCM notification types sent by backend
export type FcmPayload = {
  type: 'NEW_JOBS' | 'FOLLOW_UP_REMINDER' | 'DAILY_DIGEST';
  jobId?: string;
  applicationId?: string;
  count?: string;
};

function navigateFromPayload(
  nav: NavigationContainerRef<any>,
  data: FcmPayload
) {
  if (!data?.type) return;

  switch (data.type) {
    case 'NEW_JOBS':
      // Tap → open job feed
      nav.navigate('Main', { screen: 'JobsTab', params: { screen: 'JobFeed' } });
      break;
    case 'FOLLOW_UP_REMINDER':
      // Tap → open the specific application if id provided, otherwise list
      if (data.applicationId) {
        nav.navigate('Main', {
          screen: 'ApplicationsTab',
          params: { screen: 'ApplicationDetail', params: { applicationId: Number(data.applicationId) } },
        });
      } else {
        nav.navigate('Main', { screen: 'ApplicationsTab', params: { screen: 'ApplicationsList' } });
      }
      break;
    case 'DAILY_DIGEST':
      nav.navigate('Main', { screen: 'JobsTab', params: { screen: 'JobFeed' } });
      break;
  }
}

export function useFcmDeepLink(
  navRef: React.RefObject<NavigationContainerRef<any>>,
  isAuthenticated: boolean
) {
  const dispatch = useDispatch<AppDispatch>();
  const pendingNavigation = useRef<FcmPayload | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let messaging: any;
    try {
      messaging = require('@react-native-firebase/messaging').default;
    } catch {
      // Firebase messaging not available in test/web env
      return;
    }

    // Register FCM token with backend
    messaging().getToken().then((token: string | null) => {
      if (token) dispatch(registerFcmToken(token));
    }).catch(() => {/* token may not be available on first launch */});

    // Token refresh — re-register when FCM rotates the token
    const unsubscribeTokenRefresh = messaging().onTokenRefresh((token: string) => {
      dispatch(registerFcmToken(token));
    });

    // Foreground notification — show an alert or silent badge update
    const unsubscribeForeground = messaging().onMessage(async () => {
      // Foreground: no-op — user is already in the app
    });

    // Background/quit tap — called when user taps a notification while app was in background
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp((remoteMessage: any) => {
      const data = remoteMessage?.data as FcmPayload;
      if (data && navRef.current) {
        navigateFromPayload(navRef.current, data);
      } else if (data) {
        pendingNavigation.current = data;
      }
    });

    // App opened from quit state by tapping notification
    messaging().getInitialNotification().then((remoteMessage: any) => {
      if (!remoteMessage?.data) return;
      const data = remoteMessage.data as FcmPayload;
      // Nav may not be ready yet — store and navigate once ready
      pendingNavigation.current = data;
    });

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
      unsubscribeOpenedApp();
    };
  }, [isAuthenticated, dispatch]);

  // Called by NavigationContainer once nav is ready
  function onNavigationReady() {
    if (pendingNavigation.current && navRef.current) {
      navigateFromPayload(navRef.current, pendingNavigation.current);
      pendingNavigation.current = null;
    }
  }

  return { onNavigationReady };
}
