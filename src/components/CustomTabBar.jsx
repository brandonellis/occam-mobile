import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useBadges } from '../context/BadgeContext';
import { haptic } from '../helpers/haptic.helper';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { SCREENS } from '../constants/navigation.constants';

const BETA_TABS = new Set([SCREENS.CADDIE, SCREENS.MARSHAL]);

const PILL_PADDING_H = 2;
const PILL_PADDING_V = 2;
const BAR_MARGIN_H = spacing.lg;
const BAR_MARGIN_BOTTOM = 8;

// Badge dimensions and offsets — badge is 16px anchored to top-right of 24px icon
const BADGE_SIZE = 16;
const BADGE_TOP = -4;    // overlaps 4px above the icon
const BADGE_RIGHT = -10; // extends 10px past the icon's trailing edge

// Exported so tab navigators can add matching bottom padding to their sceneStyle
export const TAB_BAR_HEIGHT = 80;

const CustomTabBar = ({ state, descriptors, navigation, tabIcons }) => {
  const badges = useBadges();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom - 8, BAR_MARGIN_BOTTOM);
  const tabCount = state.routes.length;

  const [containerWidth, setContainerWidth] = useState(0);
  const pillTranslateX = useRef(new Animated.Value(0)).current;

  const tabWidth = containerWidth > 0 ? containerWidth / tabCount : 0;

  useEffect(() => {
    if (containerWidth === 0) return;
    const targetX = state.index * tabWidth + PILL_PADDING_H;
    Animated.spring(pillTranslateX, {
      toValue: targetX,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
      mass: 0.6,
    }).start();
  }, [state.index, containerWidth, tabWidth, pillTranslateX]);

  // Hide tab bar when a nested stack navigator is deeper than its root screen
  const focusedRoute = state.routes[state.index];
  const nestedState = focusedRoute?.state;
  const isNestedDeep = nestedState && nestedState.index > 0;
  if (isNestedDeep) return null;

  const handleLayout = (e) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth(width);
    const initialX = state.index * (width / tabCount) + PILL_PADDING_H;
    pillTranslateX.setValue(initialX);
  };

  const pillWidth = tabWidth > 0 ? tabWidth - PILL_PADDING_H * 2 : 0;

  return (
    <View style={[styles.outerWrap, { paddingBottom: bottomOffset }]} pointerEvents="box-none">
      {/* Opaque backdrop so scrolling content doesn't show through */}
      <View style={styles.backdrop} pointerEvents="none" />
      <View style={styles.shadowWrap}>
      <View style={styles.container} onLayout={handleLayout}>
        {containerWidth > 0 && pillWidth > 0 && (
          <Animated.View
            style={[
              styles.activePill,
              {
                width: pillWidth,
                transform: [{ translateX: pillTranslateX }],
              },
            ]}
          />
        )}
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const isFocused = state.index === index;
            const icons = tabIcons[route.name];
            const iconName = isFocused ? icons?.focused : icons?.unfocused;
            const badgeCount = (badges && badges[route.name]) || 0;
            const isBeta = BETA_TABS.has(route.name);

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                haptic.light();
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={`tab-${label.toString().toLowerCase().replace(/\s+/g, '-')}`}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.7}
                style={styles.tabItem}
              >
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons
                    name={iconName}
                    size={22}
                    color={isFocused ? colors.accent : colors.textInverseSecondary}
                    style={styles.icon}
                  />
                  {badgeCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText} numberOfLines={1}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.labelRow}>
                  <Text
                    style={[
                      styles.label,
                      isFocused ? styles.labelFocused : styles.labelUnfocused,
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {isBeta && (
                    <Text style={[styles.betaLabel, isFocused ? styles.betaLabelFocused : styles.betaLabelUnfocused]}>
                      Beta
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: BAR_MARGIN_H,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  shadowWrap: {
    borderRadius: borderRadius.full,
    ...shadows.xl,
    pointerEvents: 'auto',
  },
  container: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  activePill: {
    position: 'absolute',
    top: PILL_PADDING_V,
    bottom: PILL_PADDING_V,
    borderRadius: borderRadius.full,
    backgroundColor: colors.whiteOverlay12,
  },
  tabRow: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 56,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 2,
  },
  badge: {
    position: 'absolute',
    top: BADGE_TOP,
    right: BADGE_RIGHT,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  labelFocused: {
    color: colors.accent,
    fontWeight: '700',
  },
  labelUnfocused: {
    color: colors.textInverseSecondary,
    fontWeight: '500',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  betaLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  betaLabelFocused: {
    color: colors.accent,
  },
  betaLabelUnfocused: {
    color: colors.textInverseSecondary,
  },
});

export default CustomTabBar;
