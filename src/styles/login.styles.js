import { StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 220,
    height: 70,
    resizeMode: 'contain',
  },
  form: {
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldHint: {
    ...typography.bodySmall,
    color: colors.textInverseHint,
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    ...typography.label,
    color: colors.textInverseSecondary,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.whiteOverlay08,
    borderWidth: 1,
    borderColor: colors.whiteOverlay15,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 18,
    ...typography.body,
    lineHeight: undefined,
    textAlignVertical: 'center',
    color: colors.textInverse,
    minHeight: 56,
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.whiteOverlay12,
  },
  inputError: {
    borderColor: colors.error,
  },
  loginButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: spacing.sm,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  forgotPasswordText: {
    ...typography.body,
    color: colors.textInverseMuted,
    fontSize: 14,
  },
  // Organization search field
  orgInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orgInputSelected: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successSubtle,
  },
  orgTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textInverse,
    includeFontPadding: false,
    padding: 0,
    margin: 0,
    textAlignVertical: 'center',
  },
  orgDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.dropdownSurface,
    borderWidth: 1,
    borderColor: colors.whiteOverlay15,
    borderRadius: borderRadius.md,
    marginTop: 4,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 10,
  },
  orgResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteOverlay06,
  },
  orgResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  orgResultText: {
    flex: 1,
  },
  orgResultName: {
    ...typography.label,
    color: colors.textInverse,
    fontSize: 14,
  },
  orgResultDomain: {
    ...typography.bodySmall,
    color: colors.textInverseSubdued,
    fontSize: 12,
    marginTop: 1,
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.whiteOverlay15,
  },
  dividerText: {
    ...typography.bodySmall,
    color: colors.textInverseHint,
    fontSize: 13,
    paddingHorizontal: spacing.md,
  },
  // Google Sign-In
  googleButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 56,
  },
  googleButtonDisabled: {
    opacity: 0.4,
  },
  googleIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  googleButtonText: {
    ...typography.button,
    color: colors.gray900,
    fontSize: 15,
    fontWeight: '600',
  },
  googleHint: {
    ...typography.bodySmall,
    color: colors.textInverseDisabled,
    fontSize: 12,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.errorSubtle,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.errorSoft,
    textAlign: 'center',
    fontSize: 14,
  },
  forgotPasswordDescription: {
    ...typography.body,
    color: colors.textInverseSecondary,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
});
