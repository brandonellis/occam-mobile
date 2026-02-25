import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Surface, Text, Icon } from 'react-native-paper';
import useAuth from '../hooks/useAuth';
import { roleSwitcherStyles as styles } from '../styles/roleSwitcher.styles';
import { colors } from '../theme';

const ICON_MAP = {
  coach: { target: 'account-outline', swap: 'swap-horizontal' },
  client: { target: 'briefcase-outline', swap: 'swap-horizontal' },
};

const RoleSwitcher = () => {
  const { activeRole, isDualRole, switchRole } = useAuth();

  if (!isDualRole) return null;

  const isCoachView = activeRole === 'coach' || activeRole === 'admin';
  const targetRole = isCoachView ? 'client' : 'coach';
  const targetLabel = isCoachView ? 'Client View' : 'Coach View';
  const icons = isCoachView ? ICON_MAP.coach : ICON_MAP.client;

  return (
    <Surface style={styles.container} elevation={1}>
      <TouchableOpacity
        style={styles.content}
        onPress={() => switchRole(targetRole)}
        activeOpacity={0.7}
      >
        <Surface style={styles.iconWrapper} elevation={0}>
          <Icon source={icons.target} size={18} color={colors.accent} />
        </Surface>
        <Surface style={styles.textContent} elevation={0}>
          <Text variant="labelLarge" style={styles.label}>
            Switch to {targetLabel}
          </Text>
          <Text variant="bodySmall" style={styles.hint}>
            You're currently in {isCoachView ? 'Coach' : 'Client'} mode
          </Text>
        </Surface>
        <Icon source={icons.swap} size={20} color={colors.accent} />
      </TouchableOpacity>
    </Surface>
  );
};

export default RoleSwitcher;
