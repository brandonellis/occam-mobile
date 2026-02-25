import React from 'react';
import { StyleSheet } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { colors } from '../theme/colors';

const ScreenHeader = ({ title, subtitle, onBack, rightAction }) => {
  return (
    <Appbar.Header style={styles.header} statusBarHeight={0}>
      {onBack ? (
        <Appbar.BackAction onPress={onBack} color={colors.textPrimary} />
      ) : (
        <Appbar.Action icon={() => null} disabled style={styles.placeholder} />
      )}
      <Appbar.Content
        title={title}
        titleStyle={styles.title}
        subtitle={subtitle}
        subtitleStyle={styles.subtitle}
      />
      {rightAction || (
        <Appbar.Action icon={() => null} disabled style={styles.placeholder} />
      )}
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    elevation: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  placeholder: {
    opacity: 0,
  },
});

export default ScreenHeader;
