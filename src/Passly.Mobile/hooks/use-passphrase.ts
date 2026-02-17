import { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const PASSPHRASE_KEY = 'passly_passphrase';

export function usePassphrase() {
  const [passphrase, setPassphraseState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(PASSPHRASE_KEY);
      setPassphraseState(stored);
      setIsLoaded(true);
    })();
  }, []);

  const setPassphrase = useCallback(async (value: string) => {
    await SecureStore.setItemAsync(PASSPHRASE_KEY, value);
    setPassphraseState(value);
  }, []);

  return { passphrase, isLoaded, setPassphrase };
}
