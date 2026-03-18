import * as Linking from 'expo-linking';
import { SCREENS } from '../constants/navigation.constants';

/**
 * Deep linking configuration for React Navigation.
 *
 * Supports two prefixes:
 *   - occamgolf://  (custom URL scheme, registered in app.json)
 *   - https://occam.golf  (universal / web links)
 *
 * The screen map mirrors the RootNavigator structure:
 *   Root Stack
 *     ├─ ClientTabs  (Tab navigator)
 *     │    ├─ HomeTab (ClientHomeStack)
 *     │    ├─ ClientBookings
 *     │    ├─ ClientActivity
 *     │    ├─ ProgressTab (ClientProgressStack)
 *     │    ├─ Caddie
 *     │    └─ ClientProfile
 *     ├─ CoachTabs  (Tab navigator)
 *     │    ├─ CoachDashboard
 *     │    ├─ ScheduleTab (CoachScheduleStack)
 *     │    ├─ ClientsTab (CoachClientsStack)
 *     │    ├─ Marshal
 *     │    └─ CoachProfile
 *     ├─ AdminTabs  (Tab navigator)
 *     │    ├─ AdminDashboard
 *     │    ├─ ScheduleTab (AdminScheduleStack)
 *     │    ├─ ClientsTab (CoachClientsStack)
 *     │    ├─ Marshal
 *     │    └─ CoachProfile
 *     ├─ BookingDetail
 *     ├─ Notifications
 *     └─ ... (booking flow, video screens)
 */

const linking = {
  prefixes: [Linking.createURL('/'), 'occamgolf://', 'https://occam.golf'],
  config: {
    screens: {
      // ----- Client tab navigator -----
      [SCREENS.CLIENT_TABS]: {
        screens: {
          HomeTab: {
            screens: {
              [SCREENS.CLIENT_HOME]: 'home',
              [SCREENS.MEMBERSHIP_PLANS]: 'memberships',
              [SCREENS.PACKAGE_LIST]: 'packages',
            },
          },
          [SCREENS.CLIENT_BOOKINGS]: 'bookings',
          [SCREENS.CLIENT_ACTIVITY]: 'activity',
          ProgressTab: {
            screens: {
              [SCREENS.CLIENT_PROGRESS]: 'progress',
              [SCREENS.PROGRESS_REPORT_DETAIL]: 'progress/:reportId',
            },
          },
          [SCREENS.CADDIE]: 'caddie',
          [SCREENS.CLIENT_PROFILE]: 'profile',
        },
      },

      // ----- Coach tab navigator -----
      [SCREENS.COACH_TABS]: {
        screens: {
          [SCREENS.COACH_DASHBOARD]: 'coach/dashboard',
          ScheduleTab: {
            screens: {
              [SCREENS.COACH_SCHEDULE]: 'coach/schedule',
            },
          },
          ClientsTab: {
            screens: {
              [SCREENS.COACH_CLIENTS]: 'coach/clients',
              [SCREENS.CLIENT_DETAIL]: 'coach/clients/:clientId',
            },
          },
          [SCREENS.MARSHAL]: 'marshal',
          [SCREENS.COACH_PROFILE]: 'coach/profile',
        },
      },

      // ----- Admin tab navigator -----
      [SCREENS.ADMIN_TABS]: {
        screens: {
          [SCREENS.ADMIN_DASHBOARD]: 'admin/dashboard',
          ScheduleTab: {
            screens: {
              [SCREENS.ADMIN_SCHEDULE]: 'admin/schedule',
            },
          },
          [SCREENS.MARSHAL]: 'admin/marshal',
        },
      },

      // ----- Root-level stack screens -----
      [SCREENS.BOOKING_DETAIL]: 'bookings/:bookingId',
      [SCREENS.NOTIFICATIONS]: 'notifications',
    },
  },
};

export default linking;
