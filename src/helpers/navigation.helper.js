import { createRef } from 'react';

export const navigationRef = createRef();

export const navigate = (name, params) => {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate(name, params);
  }
};

/**
 * Creates a tabPress listener that resets a nested stack to its root screen
 * when the tab is already focused.
 *
 * @param {string} tabName - The tab route name (e.g. 'HomeTab', 'ScheduleTab')
 * @param {string} rootScreen - The root screen name inside the stack
 * @returns {function} A listener factory compatible with Tab.Screen `listeners` prop
 */
export const createTabResetListener = (tabName, rootScreen) => ({ navigation }) => ({
  tabPress: (e) => {
    const state = navigation.getState();
    const tabRoute = state.routes.find((r) => r.name === tabName);
    const isNested = tabRoute?.state?.routes?.length > 1;

    if (isNested) {
      e.preventDefault();
      navigation.navigate(tabName, { screen: rootScreen });
    }
  },
});
