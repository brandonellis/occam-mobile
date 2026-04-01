import { StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export const richTextEditorStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  containerFocused: {
    borderColor: colors.accent,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.gray50,
  },
  toolbarButton: {
    margin: 0,
  },
  toolbarButtonActive: {
    backgroundColor: colors.accentSubtle,
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.border,
  },
  editorContainer: {
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
