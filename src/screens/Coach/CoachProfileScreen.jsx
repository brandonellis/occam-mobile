import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button as PaperButton } from 'react-native-paper';
import useAuth from '../../hooks/useAuth';
import RoleSwitcher from '../../components/RoleSwitcher';
import { globalStyles } from '../../styles/global.styles';
import { colors, spacing } from '../../theme';

const CoachProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={globalStyles.container} edges={['top']}>
      <View style={globalStyles.screenHeader}>
        <Text style={globalStyles.screenHeaderTitle}>Profile</Text>
      </View>
      <View style={[globalStyles.screenPadding, { flex: 1, paddingBottom: spacing.tabBarClearance }]}>
        <View style={globalStyles.card}>
          <Text style={globalStyles.heading2}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={[globalStyles.secondaryText, { marginTop: 4 }]}>
            {user?.email}
          </Text>
        </View>

        <RoleSwitcher />

        <PaperButton
          testID="sign-out-button"
          mode="text"
          textColor={colors.error}
          onPress={logout}
          style={{ marginTop: spacing.xl }}
        >
          Sign Out
        </PaperButton>
      </View>
    </SafeAreaView>
  );
};

export default CoachProfileScreen;
