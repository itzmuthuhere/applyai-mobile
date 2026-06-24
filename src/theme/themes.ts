export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink';

export const ACCENT_PRESETS: Record<AccentColor, { label: string; primary: string; primaryLight: string }> = {
  blue:   { label: 'Blue',   primary: '#2563EB', primaryLight: '#DBEAFE' },
  purple: { label: 'Purple', primary: '#7C3AED', primaryLight: '#EDE9FE' },
  green:  { label: 'Green',  primary: '#059669', primaryLight: '#D1FAE5' },
  orange: { label: 'Orange', primary: '#EA580C', primaryLight: '#FFEDD5' },
  pink:   { label: 'Pink',   primary: '#DB2777', primaryLight: '#FCE7F3' },
};

export function buildTheme(mode: ThemeMode, accent: AccentColor) {
  const { primary, primaryLight } = ACCENT_PRESETS[accent];
  const common = { primary, primaryLight, secondary: '#10B981', error: '#EF4444', warning: '#F59E0B', success: '#10B981' };

  if (mode === 'dark') {
    return {
      ...common,
      background: '#0F172A',
      surface: '#1E293B',
      surfaceAlt: '#273549',
      textPrimary: '#F1F5F9',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      border: '#334155',
    };
  }
  return {
    ...common,
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
  };
}

export type AppColors = ReturnType<typeof buildTheme>;
