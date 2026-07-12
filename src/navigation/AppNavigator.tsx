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
import apiClient, { setUnauthorizedHandler } from '../api/apiClient';
import { COLORS, API_ENDPOINTS } from '../constants';
import { useFcmDeepLink } from '../hooks/useFcmDeepLink';
import { initRevenueCat } from '../services/revenueCat';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { linking } from './linking';

const Root = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const jwt = useSelector((state: RootState) => state.auth.jwt);
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const navRef = useRef<NavigationContainerRef<any>>(null);
  const { onNavigationReady } = useFcmDeepLink(navRef, !!jwt);

  useEffect(() => {
    (async () => {
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
            dispatch(setResumes(r.data));
          }),
          apiClient.get(`${API_ENDPOINTS.APPLICATIONS}?page=0&size=50`).then(r => {
            dispatch(setApplications(r.data.content ?? []));
          }),
          apiClient.get(API_ENDPOINTS.INTERVIEW_HISTORY).then(r => {
            dispatch(setHistory(r.data ?? []));
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
        {jwt ? (
          <Root.Screen name="Main" component={MainNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
        )}
      </Root.Navigator>
    </NavigationContainer>
  );
}
