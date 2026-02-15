import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppSelector } from '@/store';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const appearance = useAppSelector((state) => state.theme.appearance);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const systemScheme = useRNColorScheme();

  if (!hasHydrated) {
    return 'light';
  }

  if (appearance === 'system') {
    return systemScheme;
  }

  return appearance;
}
