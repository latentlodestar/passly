/**
 * Theme constants — re-exports design tokens and provides
 * backward-compatible Colors/Fonts objects for existing components.
 */

import { Platform } from 'react-native';
import { colors } from './design-tokens';

export { colors, fontFamily, spacing, radius, fontSize, fontWeight, shadow, borderWidth } from './design-tokens';
export type { ColorScheme, ColorToken } from './design-tokens';

/** Backward-compatible color map used by ThemedView/ThemedText/tab layout */
export const Colors = {
  light: {
    text: colors.light.fg,
    background: colors.light.bg,
    tint: colors.light.primary,
    icon: colors.light.muted,
    tabIconDefault: colors.light.muted,
    tabIconSelected: colors.light.primary,
  },
  dark: {
    text: colors.dark.fg,
    background: colors.dark.bg,
    tint: colors.dark.primary,
    icon: colors.dark.muted,
    tabIconDefault: colors.dark.muted,
    tabIconSelected: colors.dark.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    display: 'LeagueSpartan-Bold',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    display: 'LeagueSpartan-Bold',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "'League Spartan', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
