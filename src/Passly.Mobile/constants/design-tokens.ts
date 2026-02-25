/**
 * Passly Design Tokens — Mobile
 *
 * Mirrors the web design system (tokens.css) so both platforms
 * share a single visual language. Values are defined in raw numbers
 * for React Native's StyleSheet system.
 *
 * WCAG-adapted palette:
 * - Two-tier blue: primary (#4A9EFF) for text/links, btnPrimary (#0078D4) for filled buttons.
 * - All text tokens pass 4.5:1 (AA) on their intended backgrounds.
 * - All interactive UI boundaries meet 3:1 minimum.
 */

export const colors = {
  dark: {
    bg: '#232528',
    surface: '#272A30',
    surface2: '#2A2E35',
    surface3: '#2C303B',

    fg: '#FFFFFF',
    fg2: '#8F9BB0',
    muted: '#6B7585',

    border: '#3D4555',
    borderStrong: '#627080',

    primary: '#4A9EFF',
    primaryFg: '#FFFFFF',
    primaryHover: '#3B8EEF',
    primaryMuted: 'rgba(74, 158, 255, 0.14)',

    btnPrimary: '#0078D4',
    btnPrimaryHover: '#006BBD',

    accent: '#13A5E3',

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
    bg: '#F5F7FA',
    surface: '#FFFFFF',
    surface2: '#EFF1F5',
    surface3: '#E5E8EE',

    fg: '#1A1D21',
    fg2: '#4B5563',
    muted: '#9CA3AF',

    border: '#D8DDE5',
    borderStrong: '#7B8799',

    primary: '#0065B3',
    primaryFg: '#FFFFFF',
    primaryHover: '#004E8C',
    primaryMuted: 'rgba(0, 101, 179, 0.08)',

    btnPrimary: '#0065B3',
    btnPrimaryHover: '#004E8C',

    accent: '#0E7FAD',

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
