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

// Google's own SDK — script load, One Tap's prompt(), and the underlying FedCM
// call it now makes — has multiple stages that can each silently hang forever
// instead of calling back at all (observed live: "FedCM get() rejects with
// AbortError: signal is aborted without reason" with no notification ever
// delivered). Any of these leaves the sign-in button spinning indefinitely with
// no way to recover short of reloading the page. This timeout wraps the WHOLE
// flow — script load included — so the promise always settles no matter which
// stage stalls.
const SIGN_IN_TIMEOUT_MS = 8000;

function signInWithGoogleWebInner(): Promise<string> {
  return loadGisScript().then(() => new Promise<string>((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: WEB_CLIENT_ID,
      // Chrome now routes One Tap through FedCM regardless of this flag, but
      // omitting it leaves the SDK in an unsupported transitional state where
      // a FedCM abort produces no notification at all instead of a clean
      // isNotDisplayed/isSkippedMoment callback — this opts fully into the
      // FedCM path so failures are at least reported back to us.
      use_fedcm_for_prompt: true,
      callback: (response: { credential?: string }) => {
        if (response.credential) resolve(response.credential);
        else reject(new Error('Google sign-in did not return a credential'));
      },
    });
    window.google.accounts.id.prompt((notification: any) => {
      // Only a real user dismissal (closed an actually-shown prompt) should be
      // silent/"cancelled" — isNotDisplayed/isSkippedMoment mean Google never
      // showed anything at all (e.g. FedCM declined), which is a real failure
      // the user needs to see, not something they chose.
      if (notification?.isDismissedMoment?.()) {
        reject(new Error('Sign-in cancelled'));
      } else if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
        reject(new Error(
          "Google didn't show a sign-in prompt. Check that pop-ups and third-party " +
          'cookies are allowed for this site, then try again.'
        ));
      }
    });
  }));
}

export function signInWithGoogleWeb(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      fn();
    };

    const timeoutId = setTimeout(() => {
      settle(() => reject(new Error(
        "Google Sign-In didn't respond. Check that pop-ups and third-party cookies " +
        'are allowed for this site, then try again.'
      )));
    }, SIGN_IN_TIMEOUT_MS);

    signInWithGoogleWebInner().then(
      (token) => settle(() => resolve(token)),
      (err) => settle(() => reject(err)),
    );
  });
}
