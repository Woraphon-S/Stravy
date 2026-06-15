import { TextStyle } from 'react-native';

export const colors = {
  background: '#0F1115',
  surface: '#171A21',
  surfaceAlt: '#1F232C',
  border: '#272B34',
  primary: '#FC4C02',
  primaryDark: '#C53C02',
  text: '#F5F7FA',
  textMuted: '#9AA4B2',
  textFaint: '#5B6472',
  success: '#2FBF71',
  danger: '#F0524B',
  warning: '#F2B84B',
  overlay: 'rgba(0,0,0,0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const typography: Record<string, TextStyle> = {
  display: { fontSize: 44, fontWeight: '800', color: colors.text },
  h1: { fontSize: 28, fontWeight: '700', color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', color: colors.text },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: '400', color: colors.textFaint },
};

export const theme = { colors, spacing, radius, typography };
