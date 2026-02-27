import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { skeletonStyles as styles } from '../styles/skeleton.styles';

const SkeletonBlock = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, style, { opacity }]} />;
};

/**
 * Dashboard skeleton — used for ClientHomeScreen and CoachDashboardScreen.
 * Mimics: greeting, quick actions row, and 3 booking cards.
 */
export const DashboardSkeleton = () => (
  <View style={styles.container}>
    {/* Greeting area */}
    <View style={styles.headerArea}>
      <View>
        <SkeletonBlock style={styles.greetingLine} />
        <SkeletonBlock style={styles.subtitleLine} />
      </View>
      <SkeletonBlock style={styles.iconCircle} />
    </View>

    {/* Quick actions */}
    <SkeletonBlock style={styles.sectionTitleLine} />
    <View style={styles.quickActionsRow}>
      <SkeletonBlock style={styles.quickActionCard} />
      <SkeletonBlock style={styles.quickActionCard} />
      <SkeletonBlock style={styles.quickActionCard} />
    </View>

    {/* Section title */}
    <View style={styles.sectionHeaderRow}>
      <SkeletonBlock style={styles.sectionTitleLine} />
      <SkeletonBlock style={styles.seeAllLine} />
    </View>

    {/* Booking cards */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.bookingCard}>
        <View style={styles.bookingCardRow}>
          <View style={styles.timeBlock}>
            <SkeletonBlock style={styles.timeLine} />
            <SkeletonBlock style={styles.dateLine} />
          </View>
          <View style={styles.bookingContent}>
            <SkeletonBlock style={styles.serviceLine} />
            <SkeletonBlock style={styles.coachLine} />
            <SkeletonBlock style={styles.locationLine} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

/**
 * Coach dashboard skeleton — includes stats row.
 * Rendered inline inside the ScrollView below the real header, so no container padding.
 */
export const CoachDashboardSkeleton = () => (
  <View>
    {/* Stats row */}
    <View style={styles.statsRow}>
      <SkeletonBlock style={styles.statCard} />
      <SkeletonBlock style={styles.statCard} />
    </View>

    {/* Quick actions */}
    <SkeletonBlock style={styles.sectionTitleLine} />
    <View style={styles.quickActionsRow}>
      <SkeletonBlock style={styles.quickActionCard} />
      <SkeletonBlock style={styles.quickActionCard} />
      <SkeletonBlock style={styles.quickActionCard} />
    </View>

    {/* Section title */}
    <View style={styles.sectionHeaderRow}>
      <SkeletonBlock style={styles.sectionTitleLine} />
      <SkeletonBlock style={styles.seeAllLine} />
    </View>

    {/* Booking cards */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.bookingCard}>
        <View style={styles.bookingCardRow}>
          <View style={styles.timeBlock}>
            <SkeletonBlock style={styles.timeLine} />
          </View>
          <View style={styles.bookingContent}>
            <SkeletonBlock style={styles.serviceLine} />
            <SkeletonBlock style={styles.coachLine} />
            <SkeletonBlock style={styles.locationLine} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

/**
 * Generic list skeleton — used for flat lists (clients, bookings, notifications).
 */
export const ListSkeleton = ({ count = 4 }) => (
  <View style={styles.listContainer}>
    {Array.from({ length: count }, (_, i) => (
      <View key={i} style={styles.listItem}>
        <SkeletonBlock style={styles.listAvatar} />
        <View style={styles.listContent}>
          <SkeletonBlock style={styles.listPrimaryLine} />
          <SkeletonBlock style={styles.listSecondaryLine} />
        </View>
      </View>
    ))}
  </View>
);

export default SkeletonBlock;
