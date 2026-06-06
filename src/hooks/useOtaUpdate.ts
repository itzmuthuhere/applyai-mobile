import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error';

export function useOtaUpdate() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run in production (not dev mode)
    if (__DEV__) return;
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      setStatus('checking');
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        setStatus('available');
      } else {
        setStatus('idle');
      }
    } catch (e: any) {
      setStatus('error');
      setError(e.message);
    }
  };

  const downloadAndApply = async () => {
    try {
      setStatus('downloading');
      await Updates.fetchUpdateAsync();
      setStatus('ready');
      await Updates.reloadAsync();
    } catch (e: any) {
      setStatus('error');
      setError(e.message);
    }
  };

  const dismiss = () => {
    setStatus('idle');
  };

  return { status, error, downloadAndApply, dismiss };
}
