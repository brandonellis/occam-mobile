import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';
import { typography } from './typography';
import { borderRadius } from './spacing';

export const paperTheme = {
  ...MD3LightTheme,
  roundness: borderRadius.md,
  colors: {
    ...MD3LightTheme.colors,
    // Primary
    primary: colors.primary,
    onPrimary: colors.textInverse,
    primaryContainer: colors.primaryLight,
    onPrimaryContainer: colors.textInverse,

    // Secondary (accent)
    secondary: colors.accent,
    onSecondary: colors.textInverse,
    secondaryContainer: colors.accentLight,
    onSecondaryContainer: colors.textPrimary,

    // Tertiary
    tertiary: colors.aqua,
    onTertiary: colors.textPrimary,
    tertiaryContainer: colors.aquaLight,
    onTertiaryContainer: colors.textPrimary,

    // Error
    error: colors.error,
    onError: colors.textInverse,
    errorContainer: colors.errorLight,
    onErrorContainer: colors.error,

    // Backgrounds & surfaces
    background: colors.background,
    onBackground: colors.textPrimary,
    surface: colors.surface,
    onSurface: colors.textPrimary,
    surfaceVariant: colors.gray100,
    onSurfaceVariant: colors.textSecondary,
    surfaceDisabled: colors.gray200,
    onSurfaceDisabled: colors.disabled,

    // Outlines
    outline: colors.border,
    outlineVariant: colors.borderLight,

    // Inverse
    inverseSurface: colors.primary,
    inverseOnSurface: colors.textInverse,
    inversePrimary: colors.accent,

    // Elevation / overlays
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.gray50,
      level3: colors.gray100,
      level4: colors.gray100,
      level5: colors.gray200,
    },

    // Backdrop
    backdrop: colors.overlay,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: { ...MD3LightTheme.fonts.displayLarge, fontFamily: typography.fontFamily },
    displayMedium: { ...MD3LightTheme.fonts.displayMedium, fontFamily: typography.fontFamily },
    displaySmall: { ...MD3LightTheme.fonts.displaySmall, fontFamily: typography.fontFamily },
    headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, fontFamily: typography.fontFamily, ...typography.h1 },
    headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, fontFamily: typography.fontFamily, ...typography.h2 },
    headlineSmall: { ...MD3LightTheme.fonts.headlineSmall, fontFamily: typography.fontFamily, ...typography.h3 },
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontFamily: typography.fontFamily, fontSize: 18, fontWeight: '600' },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, fontFamily: typography.fontFamily, ...typography.label },
    titleSmall: { ...MD3LightTheme.fonts.titleSmall, fontFamily: typography.fontFamily, ...typography.labelSmall },
    bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, fontFamily: typography.fontFamily, ...typography.bodyLarge },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, fontFamily: typography.fontFamily, ...typography.body },
    bodySmall: { ...MD3LightTheme.fonts.bodySmall, fontFamily: typography.fontFamily, ...typography.bodySmall },
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontFamily: typography.fontFamily, ...typography.button },
    labelMedium: { ...MD3LightTheme.fonts.labelMedium, fontFamily: typography.fontFamily, ...typography.label },
    labelSmall: { ...MD3LightTheme.fonts.labelSmall, fontFamily: typography.fontFamily, ...typography.labelSmall },
  },
};
