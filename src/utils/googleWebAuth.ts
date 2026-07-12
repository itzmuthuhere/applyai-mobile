// Google Identity Services (GIS) — web-only sign-in path. Native platforms use
// @react-native-google-signin/google-signin instead (see authSlice.ts), which has
// zero web support. Resolves with a raw Google ID token, the same shape the
// backend's POST /api/auth/google already expects from the native flow, so no
// backend change is needed here — only an allow-listed audience.
//
// Reuses the "ApplyAI Chrome Extension" OAuth client (Google Cloud Console →
// Credentials, project applyai-499114) — it's a "Web application" type client,
// already allow-listed on the backend (application.properties
// `google.oauth.client-ids`, first id in the list), and already has
// http://localhost:8090 under "Authorized JavaScript origins" (added for local
// web dev — add the Vercel domain there too once deployed). See
// actions/ACTION_REQUIRED_004.md.
const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  '1008203537522-5dg9nnn9kf4dfmlbhe592fu6rhppmu4s.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: any;
  }
}

let gisScriptPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (gisScriptPromise) return gisScriptPromise;
  gisScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return gisScriptPromise;
}

export async function signInWithGoogleWeb(): Promise<string> {
  await loadGisScript();
  return new Promise<string>((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: WEB_CLIENT_ID,
      callback: (response: { credential?: string }) => {
        if (response.credential) resolve(response.credential);
        else reject(new Error('Google sign-in did not return a credential'));
      },
    });
    window.google.accounts.id.prompt((notification: any) => {
      if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
        reject(new Error('Sign-in cancelled'));
      }
    });
  });
}
