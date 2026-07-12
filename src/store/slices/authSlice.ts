import { Platform } from 'react-native';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { User, AuthResponse } from '../../types/api.types';
import apiClient from '../../api/apiClient';
import { saveJwt, clearJwt } from '../../utils/auth';
import { API_ENDPOINTS } from '../../constants';
import { signInWithGoogleWeb } from '../../utils/googleWebAuth';

// ─── Configure Google Sign-In (call once at app start) ───────────────────────
// Native-only — @react-native-google-signin/google-signin has zero web support
// (its web build is a stub that warns "not implemented" on every call). Web
// uses Google Identity Services instead — see googleWebAuth.ts.
export const configureGoogleSignIn = () => {
  if (Platform.OS === 'web') return;
  GoogleSignin.configure({
    webClientId:
      '966711636721-o7k3vn52bimi3j9mtdgttalckc8v13a6.apps.googleusercontent.com',
    offlineAccess: false,
  });
};

// ─── Thunk: Google Sign-In → Backend Auth ────────────────────────────────────
export const signInWithGoogle = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: string }
>('auth/signInWithGoogle', async (_, { rejectWithValue }) => {
  try {
    let idToken: string | null;

    if (Platform.OS === 'web') {
      idToken = await signInWithGoogleWeb();
    } else {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // v16+: signIn() returns { type, data } — read idToken directly so we always
      // get a fresh token, not a stale cached one from getTokens()
      const signInResult = await GoogleSignin.signIn();

      if (signInResult.type === 'cancelled') {
        return rejectWithValue('Sign-in cancelled');
      }

      idToken = (signInResult as any).data?.idToken ?? null;
    }

    if (!idToken) {
      return rejectWithValue('Failed to get ID token from Google');
    }

    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH_GOOGLE,
      { idToken }
    );

    await saveJwt(response.data.jwt);
    return response.data;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return rejectWithValue('Sign-in cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return rejectWithValue('Sign-in already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return rejectWithValue('Google Play Services not available');
    }
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Sign-in failed';
    return rejectWithValue(message);
  }
});

// ─── Thunk: Sign Out ──────────────────────────────────────────────────────────
export const signOut = createAsyncThunk('auth/signOut', async () => {
  await clearJwt();
  if (Platform.OS === 'web') return;
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore — clear local state regardless
  }
});

// ─── Slice ────────────────────────────────────────────────────────────────────
interface AuthState {
  jwt: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  jwt: null,
  user: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ jwt: string; user: User }>) {
      state.jwt = action.payload.jwt;
      state.user = action.payload.user;
      state.isLoading = false;
      state.error = null;
    },
    clearAuth(state) {
      state.jwt = null;
      state.user = null;
      state.isLoading = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // signInWithGoogle
      .addCase(signInWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.jwt = action.payload.jwt;
        state.user = action.payload.user;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Sign-in failed';
      })
      // signOut
      .addCase(signOut.fulfilled, (state) => {
        state.jwt = null;
        state.user = null;
      });
  },
});

export const { setAuth, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
