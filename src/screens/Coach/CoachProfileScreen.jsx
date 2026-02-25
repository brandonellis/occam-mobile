import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuth from '../../hooks/useAuth';
import RoleSwitcher from '../../components/RoleSwitcher';
import { globalStyles } from '../../styles/global.styles';
import { colors, spacing } from '../../theme';

const CoachProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      <View style={[globalStyles.screenPadding, { flex: 1, paddingTop: spacing.xl }]}>
        <View style={globalStyles.card}>
          <Text style={globalStyles.heading2}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={[globalStyles.secondaryText, { marginTop: 4 }]}>
            {user?.email}
          </Text>
        </View>

        <RoleSwitcher />

        <TouchableOpacity
          style={[
            globalStyles.buttonSecondary,
            { marginTop: spacing.xl, borderColor: colors.error },
          ]}
          onPress={logout}
          activeOpacity={0.7}
        >
          <Text style={[globalStyles.buttonSecondaryText, { color: colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CoachProfileScreen;
