import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppSelector } from '@/store';

export function useColorScheme() {
  const appearance = useAppSelector((state) => state.theme.appearance);
  const systemScheme = useRNColorScheme();

  if (appearance === 'system') {
    return systemScheme;
  }

  return appearance;
}
