import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { colors, spacing, fontSize, fontWeight, radius } from '@/constants/design-tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppSelector, useAppDispatch } from '@/store';
import { dismissToast } from '@/store/toast-slice';

const AUTO_DISMISS_MS = 3500;

export function Toast() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const message = useAppSelector((s) => s.toast.message);
  const variant = useAppSelector((s) => s.toast.variant);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => dispatch(dismissToast()), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, dispatch]);

  if (!message) return null;

  const isSuccess = variant === 'success';
  const bg = isSuccess ? t.successSubtle : t.dangerSubtle;
  const accent = isSuccess ? t.success : t.danger;
  const icon = isSuccess ? 'check-circle' : 'error';

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[styles.wrapper, { top: insets.top + spacing.sm }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => dispatch(dismissToast())}
        style={[styles.toast, { backgroundColor: bg, borderColor: accent }]}
      >
        <MaterialIcons name={icon} size={20} color={accent} />
        <Text style={[styles.text, { color: t.fg }]}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
});
