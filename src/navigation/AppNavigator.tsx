import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { View, ActivityIndicator } from 'react-native';
import { RootStackParamList } from './types';
import { RootState, AppDispatch } from '../store';
import { setAuth, clearAuth } from '../store/slices/authSlice';
import { setResumes } from '../store/slices/resumeSlice';
import { setApplications } from '../store/slices/applicationSlice';
import { setHistory } from '../store/slices/interviewSlice';
import { getJwt, clearJwt } from '../utils/auth';
import * as SecureStorage from '../utils/secureStorage';
import apiClient, { setUnauthorizedHandler } from '../api/apiClient';
import { COLORS, API_ENDPOINTS, SECURE_STORE_KEYS } from '../constants';
import { useFcmDeepLink } from '../hooks/useFcmDeepLink';
import { useExtensionInstalled } from '../hooks/useExtensionInstalled';
import { initRevenueCat } from '../services/revenueCat';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import ExtensionPromptScreen from '../screens/auth/ExtensionPromptScreen';
import { linking } from './linking';

const Root = createNativeStackNavigator<RootStackParamList>();

// New/incomplete users are gated into ProfileSetupScreen right after sign-in —
// job matching, top-20 feed, and auto-apply are all built around targetRole/
// targetLocation being set, so collecting it immediately (rather than leaving
// users to discover Profile Settings on their own) is core to the MVP flow.
export function needsProfileSetup(user: { targetRole?: string | null; targetLocation?: string | null } | null): boolean {
  if (!user) return false;
  return !user.targetRole || !user.targetLocation;
}

// Second onboarding gate, right after ProfileSetupScreen — the extension is
// what actually submits applications, so a fresh account with nothing queued
// yet should be pointed at it immediately rather than discovering the (easy
// to miss) hint banner deep in Auto Apply Queue on their own.
export function needsExtensionPrompt(extensionInstalled: boolean, dismissed: boolean): boolean {
  return !extensionInstalled && !dismissed;
}

export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const jwt = useSelector((state: RootState) => state.auth.jwt);
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  // Persisted (SecureStore native / localStorage web) — a real dismissal must
  // survive a page refresh, not just last for the current in-memory session.
  // Still re-prompts on a fresh sign-in on a NEW device/browser, since this
  // is local-only and never synced to the account.
  const [extensionPromptDismissed, setExtensionPromptDismissed] = useState(false);
  const extensionInstalled = useExtensionInstalled();

  async function dismissExtensionPrompt() {
    setExtensionPromptDismissed(true);
    await SecureStorage.setItemAsync(SECURE_STORE_KEYS.EXTENSION_PROMPT_DISMISSED, 'true');
  }
  const navRef = useRef<NavigationContainerRef<any>>(null);
  const { onNavigationReady } = useFcmDeepLink(navRef, !!jwt);

  useEffect(() => {
    (async () => {
      const dismissed = await SecureStorage.getItemAsync(SECURE_STORE_KEYS.EXTENSION_PROMPT_DISMISSED);
      if (dismissed === 'true') setExtensionPromptDismissed(true);

      const token = await getJwt();
      if (!token) {
        dispatch(clearAuth());
        setIsBootstrapping(false);
        return;
      }
      try {
        // Restore auth from stored JWT
        const { data: user } = await apiClient.get('/api/auth/me');
        dispatch(setAuth({ jwt: token, user }));

        // Preload all dashboard data in parallel — makes HomeScreen instant
        await Promise.allSettled([
          apiClient.get(API_ENDPOINTS.RESUMES).then(r => {
            const d = r.data;
            dispatch(setResumes(Array.isArray(d) ? d : (d?.content ?? [])));
          }),
          apiClient.get(`${API_ENDPOINTS.APPLICATIONS}?page=0&size=50`).then(r => {
            dispatch(setApplications(r.data.content ?? []));
          }),
          apiClient.get(API_ENDPOINTS.INTERVIEW_HISTORY).then(r => {
            const d = r.data;
            dispatch(setHistory(Array.isArray(d) ? d : (d?.content ?? [])));
          }),
        ]);
      } catch {
        await clearJwt();
        dispatch(clearAuth());
      }
      setIsBootstrapping(false);
    })();
  }, []);

  useEffect(() => {
    if (jwt && authUser?.email) {
      initRevenueCat(authUser.email);
    }
  }, [jwt, authUser?.email]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await clearJwt();
      dispatch(clearAuth());
    });
  }, [dispatch]);

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navRef} onReady={onNavigationReady} linking={linking}>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {jwt && needsProfileSetup(authUser) ? (
          <Root.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        ) : jwt && needsExtensionPrompt(extensionInstalled, extensionPromptDismissed) ? (
          <Root.Screen name="ExtensionPrompt">
            {() => <ExtensionPromptScreen onDone={dismissExtensionPrompt} />}
          </Root.Screen>
        ) : jwt ? (
          <Root.Screen name="Main" component={MainNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
