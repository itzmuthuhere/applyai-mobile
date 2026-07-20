import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const PING_TIMEOUT_MS = 400;

// Web only — pings the ApplyAI extension's content script (src/content/webapp.ts
// in D:\applyai-extension, which only runs on our own origin) and waits for a
// reply. Native has no browser/extension concept, so it always reports
// not-installed there — the "install the extension" hint stays relevant on
// native since it's telling the user to switch to desktop Chrome.
export function useExtensionInstalled(): boolean {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let responded = false;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.data?.type !== 'APPLYAI_EXTENSION_PONG') return;
      responded = true;
      setInstalled(true);
    };
    window.addEventListener('message', onMessage);
    window.postMessage({ type: 'APPLYAI_EXTENSION_PING' }, window.location.origin);

    const timeout = setTimeout(() => {
      if (!responded) setInstalled(false);
    }, PING_TIMEOUT_MS);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeout);
    };
  }, []);

  return installed;
}
