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
 *     │    ├─ ActivityTab (ClientProgressStack — feed + progress sub-tabs)
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
 *     │    ├─ ClientsTab (AdminClientsStack)
 *     │    ├─ Marshal
 *     │    └─ AdminProfile
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
              [SCREENS.MEMBERSHIP_CHECKOUT]: 'memberships/checkout',
              [SCREENS.PACKAGE_LIST]: 'packages',
              [SCREENS.PACKAGE_CHECKOUT]: 'packages/checkout',
            },
          },
          [SCREENS.CLIENT_BOOKINGS]: 'bookings',
          ActivityTab: {
            screens: {
              [SCREENS.CLIENT_PROGRESS]: 'activity',
              [SCREENS.PROGRESS_REPORT_DETAIL]: 'activity/report/:reportId',
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
              [SCREENS.VIDEO_RECORDING]: 'coach/video/record',
              [SCREENS.VIDEO_REVIEW]: 'coach/video/review',
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
          ClientsTab: {
            screens: {
              [SCREENS.ADMIN_CLIENTS]: 'admin/clients',
              [SCREENS.CLIENT_DETAIL]: 'admin/clients/:clientId',
            },
          },
          [SCREENS.MARSHAL]: 'admin/marshal',
          [SCREENS.ADMIN_PROFILE]: 'admin/profile',
        },
      },

      // ----- Root-level stack screens -----
      [SCREENS.PAYMENT_LINK]: 'pay/:token',
      [SCREENS.BOOKING_DETAIL]: 'bookings/:bookingId',
      [SCREENS.NOTIFICATIONS]: 'notifications',
      [SCREENS.NOTIFICATION_PREFERENCES]: 'notifications/preferences',
      [SCREENS.VIDEO_RECORDING]: 'video/record',
      [SCREENS.VIDEO_REVIEW]: 'video/review',
    },
  },
};

export default linking;
