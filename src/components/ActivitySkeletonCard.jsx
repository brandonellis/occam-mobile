import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { activityFeedStyles as styles } from '../styles/activityFeed.styles';

const ActivitySkeletonCard = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonCircle} />
        <View style={{ flex: 1 }}>
          <View style={[styles.skeletonLine, { width: '65%' }]} />
          <View style={styles.skeletonLineShort} />
        </View>
      </View>
      <View style={styles.skeletonBody} />
      <View style={styles.skeletonBodyShort} />
    </Animated.View>
  );
};

export default React.memo(ActivitySkeletonCard);
