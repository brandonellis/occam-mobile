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
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    ...typography.label,
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    ...typography.body,
    color: colors.textInverse,
    minHeight: 56,
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  inputError: {
    borderColor: colors.error,
  },
  loginButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
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
    paddingVertical: spacing.sm,
  },
  forgotPasswordText: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  // Organization search field
  orgInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orgInputSelected: {
    borderColor: 'rgba(52, 199, 89, 0.4)',
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
  },
  orgTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: colors.textInverse,
    includeFontPadding: false,
    paddingVertical: 4,
    margin: 0,
    textAlignVertical: 'center',
  },
  orgDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(33, 37, 41, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
    marginTop: 4,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 10,
  },
  orgResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  orgResultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 172, 213, 0.15)',
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
    fontSize: 15,
  },
  orgResultDomain: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerText: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    paddingHorizontal: spacing.md,
  },
  // Google Sign-In
  googleButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
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
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 77, 79, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 79, 0.3)',
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
});
