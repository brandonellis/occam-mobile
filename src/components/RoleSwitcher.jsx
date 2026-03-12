import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Surface, Text, Icon } from 'react-native-paper';
import useAuth from '../hooks/useAuth';
import { roleSwitcherStyles as styles } from '../styles/roleSwitcher.styles';
import { colors } from '../theme';
import { ADMIN_SHELL_ROLES } from '../constants/auth.constants';

const ICON_MAP = {
  admin: { target: 'shield-account-outline', swap: 'swap-horizontal' },
  coach: { target: 'account-outline', swap: 'swap-horizontal' },
  client: { target: 'briefcase-outline', swap: 'swap-horizontal' },
};

const RoleSwitcher = () => {
  const { activeRole, isDualRole, switchRole, user } = useAuth();

  if (!isDualRole) return null;

  const roleNames = user?.roles?.map((role) => (typeof role === 'string' ? role : role.name)) || [];
  const hasAdminRole = roleNames.some((role) => ADMIN_SHELL_ROLES.includes(role));
  const isStaffView = activeRole === 'coach' || activeRole === 'admin';
  const targetRole = isStaffView ? 'client' : (hasAdminRole ? 'admin' : 'coach');
  const targetLabel = isStaffView ? 'Client View' : (hasAdminRole ? 'Admin View' : 'Coach View');
  const currentLabel = activeRole === 'admin' ? 'Admin' : isStaffView ? 'Coach' : 'Client';
  const icons = isStaffView
    ? (activeRole === 'admin' ? ICON_MAP.admin : ICON_MAP.coach)
    : ICON_MAP.client;

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
            You're currently in {currentLabel} mode
          </Text>
        </Surface>
        <Icon source={icons.swap} size={20} color={colors.accent} />
      </TouchableOpacity>
    </Surface>
  );
};

export default RoleSwitcher;
