/**
 * Passly Design Tokens — Mobile
 *
 * Mirrors the web design system (tokens.css) so both platforms
 * share a single visual language. Values are defined in raw numbers
 * for React Native's StyleSheet system.
 */

export const colors = {
  dark: {
    bg: '#0c0f16',
    surface: '#141822',
    surface2: '#1c2030',
    surface3: '#232838',

    fg: '#e4e7ec',
    fg2: '#a0a7b5',
    muted: '#6b7280',

    border: '#232838',
    borderStrong: '#343b4e',

    primary: '#4a8af4',
    primaryFg: '#ffffff',
    primaryHover: '#3b7ae5',
    primaryMuted: 'rgba(74, 138, 244, 0.14)',

    danger: '#e5534b',
    dangerFg: '#ffffff',
    dangerSubtle: 'rgba(229, 83, 75, 0.12)',
    dangerText: '#f08882',

    success: '#3fb950',
    successFg: '#ffffff',
    successSubtle: 'rgba(63, 185, 80, 0.12)',
    successText: '#7ee787',

    warning: '#d29922',
    warningFg: '#ffffff',
    warningSubtle: 'rgba(210, 153, 34, 0.12)',
    warningText: '#e3b341',
  },
  light: {
    bg: '#f5f6f8',
    surface: '#ffffff',
    surface2: '#f0f1f4',
    surface3: '#e8eaef',

    fg: '#111827',
    fg2: '#4b5563',
    muted: '#9ca3af',

    border: '#e2e5ea',
    borderStrong: '#d1d5db',

    primary: '#2556c4',
    primaryFg: '#ffffff',
    primaryHover: '#1d4aa8',
    primaryMuted: 'rgba(37, 86, 196, 0.08)',

    danger: '#c4342e',
    dangerFg: '#ffffff',
    dangerSubtle: '#fef2f2',
    dangerText: '#991b1b',

    success: '#1a7f37',
    successFg: '#ffffff',
    successSubtle: '#ecfdf5',
    successText: '#166534',

    warning: '#9a6700',
    warningFg: '#ffffff',
    warningSubtle: '#fffbeb',
    warningText: '#92400e',
  },
} as const;

export type ColorScheme = keyof typeof colors;
export type ColorToken = keyof (typeof colors)['dark'];

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
} as const;
