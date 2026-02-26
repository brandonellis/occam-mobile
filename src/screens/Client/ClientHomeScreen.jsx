import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import { SCREENS } from '../../constants/navigation.constants';
import { dashboardStyles as styles } from '../../styles/dashboard.styles';
import { colors } from '../../theme';

const ClientHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const firstName = user?.first_name || user?.name?.split(' ')[0] || '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View>
            <Text style={styles.greeting}>Welcome, {firstName}</Text>
            <Text style={styles.subtitle}>Ready to improve your game?</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREENS.NOTIFICATIONS)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREENS.LOCATION_SELECTION, { bookingData: {} })}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="calendar-outline" size={18} color={colors.accent} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>Book Session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.7}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="play-circle-outline" size={18} color={colors.info} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>My Videos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREENS.MEMBERSHIP_PLANS)}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="card-outline" size={18} color={colors.success} />
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>Membership</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No upcoming sessions.{'\n'}Book a session to get started.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Your recent activity will appear here.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClientHomeScreen;
