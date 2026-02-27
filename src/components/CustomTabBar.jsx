import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const INDICATOR_WIDTH_RATIO = 0.5;

const CustomTabBar = ({ state, descriptors, navigation, tabIcons }) => {
  const insets = useSafeAreaInsets();
  const contentPaddingTop = insets.bottom > 0 ? 8 : 0;
  const tabCount = state.routes.length;

  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const tabWidth = containerWidth / tabCount;
  const indicatorWidth = tabWidth * INDICATOR_WIDTH_RATIO;
  const indicatorOffset = (tabWidth - indicatorWidth) / 2;

  useEffect(() => {
    if (containerWidth === 0) return;
    const targetX = state.index * tabWidth + indicatorOffset;
    Animated.spring(translateX, {
      toValue: targetX,
      useNativeDriver: true,
      damping: 18,
      stiffness: 160,
      mass: 0.8,
    }).start();
  }, [state.index, containerWidth, tabWidth, indicatorOffset, translateX]);

  const handleLayout = (e) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth(width);
    const initialX = state.index * (width / tabCount) + ((width / tabCount) - (width / tabCount * INDICATOR_WIDTH_RATIO)) / 2;
    translateX.setValue(initialX);
  };

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      onLayout={handleLayout}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: indicatorWidth,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      <View style={[styles.tabRow, { paddingTop: contentPaddingTop }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;
          const icons = tabIcons[route.name];
          const iconName = isFocused ? icons?.focused : icons?.unfocused;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
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
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <Ionicons
                name={iconName}
                size={24}
                color={isFocused ? colors.accent : colors.textInverseMuted}
                style={styles.icon}
              />
              <Animated.Text
                style={[
                  styles.label,
                  { color: isFocused ? colors.accent : colors.textInverseMuted },
                ]}
                numberOfLines={1}
              >
                {label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderTopColor: colors.gray800,
    borderTopWidth: 1,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent,
  },
  tabRow: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 6,
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0,
  },
});

export default CustomTabBar;
