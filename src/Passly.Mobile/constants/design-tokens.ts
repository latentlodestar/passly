import { StyleSheet } from 'react-native';

/**
 * Passly Design Tokens — Mobile
 *
 * Semantic token system powering both dark and light themes.
 * Values are defined in raw numbers for React Native's StyleSheet system.
 *
 * WCAG-adapted palette:
 * - Accent cyan (#13A5E3) as primary brand color.
 * - Dark (#0A0A0A) on-cyan text for 7:1+ contrast on filled buttons.
 * - All text tokens pass 4.5:1 (AA) on their intended backgrounds.
 * - All interactive UI boundaries meet 3:1 minimum.
 *
 * Semantic mapping:
 *   bg            → color.bg.app
 *   surface       → color.bg.surface
 *   surface2      → color.bg.surfaceAlt
 *   fg            → color.text.primary
 *   fg2           → color.text.secondary
 *   border        → color.border.default
 *   borderAccent  → color.border.accent
 *   primary       → color.accent.primary
 *   primaryFg     → color.accent.onPrimary
 *   btnPrimary    → color.button.primaryBg
 *   btnSecondary  → color.button.secondaryBg
 *   btnSecondaryFg→ color.button.secondaryFg
 *   outlineFg     → color.button.outlineFg
 *   outlineBorder → color.button.outlineBorder
 */

export const colors = {
  dark: {
    bg: '#0A0A0A',
    surface: '#232528',
    surface2: '#2E3136',
    surface3: '#363A42',

    fg: '#FFFFFF',
    fg2: '#8B96A8',
    muted: '#626D7D',

    border: '#3A3F47',
    borderStrong: '#627080',
    borderAccent: '#13A5E3',

    primary: '#13A5E3',
    primaryFg: '#0A0A0A',
    primaryHover: '#0F8EC5',
    primaryMuted: 'rgba(19, 165, 227, 0.14)',

    btnPrimary: '#13A5E3',
    btnPrimaryHover: '#0F8EC5',

    btnSecondary: '#182D5E',
    btnSecondaryFg: '#FFFFFF',

    outlineBorder: '#13A5E3',
    outlineFg: '#13A5E3',

    accent: '#13A5E3',
    navy: '#182D5E',

    danger: '#C4342E',
    dangerFg: '#FFFFFF',
    dangerSubtle: 'rgba(229, 83, 75, 0.12)',
    dangerText: '#F08882',

    success: '#1A7F37',
    successFg: '#FFFFFF',
    successSubtle: 'rgba(63, 185, 80, 0.12)',
    successText: '#7EE787',

    warning: '#9A6700',
    warningFg: '#FFFFFF',
    warningSubtle: 'rgba(210, 153, 34, 0.12)',
    warningText: '#E3B341',
  },
  light: {
    bg: '#FFFFFF',
    surface: '#F5F7FA',
    surface2: '#EFF1F5',
    surface3: '#E5E8EE',

    fg: '#0A0A0A',
    fg2: '#4B5563',
    muted: '#9CA3AF',

    border: '#D8DDE5',
    borderStrong: '#7B8799',
    borderAccent: '#13A5E3',

    // Darker cyan for text legibility on white (5.5:1 AA)
    primary: '#0B6E99',
    primaryFg: '#0A0A0A',
    primaryHover: '#0A6082',
    primaryMuted: 'rgba(19, 165, 227, 0.08)',

    btnPrimary: '#13A5E3',
    btnPrimaryHover: '#0F8EC5',

    btnSecondary: '#182D5E',
    btnSecondaryFg: '#FFFFFF',

    outlineBorder: '#0B6E99',
    outlineFg: '#0B6E99',

    accent: '#13A5E3',
    navy: '#182D5E',

    danger: '#B42318',
    dangerFg: '#FFFFFF',
    dangerSubtle: '#FEF2F2',
    dangerText: '#991B1B',

    success: '#166534',
    successFg: '#FFFFFF',
    successSubtle: '#ECFDF5',
    successText: '#166534',

    warning: '#854D0E',
    warningFg: '#FFFFFF',
    warningSubtle: '#FFFBEB',
    warningText: '#92400E',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof (typeof colors)['dark'];

export const fontFamily = {
  display: 'LeagueSpartan',
  body: 'System',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
  // Semantic aliases
  card: 12,
  button: 6,
  pill: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
} as const;

/** Consistent border widths — `accent` is halfway between hairline and 1pt */
export const borderWidth = {
  hairline: StyleSheet.hairlineWidth,
  accent: (StyleSheet.hairlineWidth + 1) / 2,
  default: 1,
};
