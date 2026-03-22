export const SCREENS = {
  // Auth
  LOGIN: 'Login',

  // Admin tabs
  ADMIN_TABS: 'AdminTabs',
  ADMIN_DASHBOARD: 'AdminDashboard',
  ADMIN_SCHEDULE: 'AdminSchedule',
  ADMIN_CLIENTS: 'AdminClients',
  ADMIN_PROFILE: 'AdminProfile',

  // Coach tabs
  COACH_TABS: 'CoachTabs',
  COACH_DASHBOARD: 'CoachDashboard',
  COACH_SCHEDULE: 'CoachSchedule',
  COACH_CLIENTS: 'CoachClients',
  COACH_PROFILE: 'CoachProfile',

  // Client tabs
  CLIENT_TABS: 'ClientTabs',
  CLIENT_HOME: 'ClientHome',
  CLIENT_BOOKINGS: 'ClientBookings',
  CLIENT_ACTIVITY: 'ClientActivity',
  CLIENT_PROGRESS: 'ClientProgress',
  CLIENT_PROFILE: 'ClientProfile',
  CADDIE: 'Caddie',
  MARSHAL: 'Marshal',

  // Booking flow
  LOCATION_SELECTION: 'LocationSelection',
  CLIENT_SELECTION: 'ClientSelection',
  SERVICE_SELECTION: 'ServiceSelection',
  DURATION_SELECTION: 'DurationSelection',
  COACH_SELECTION: 'CoachSelection',
  TIME_SLOT_SELECTION: 'TimeSlotSelection',
  BOOKING_CONFIRMATION: 'BookingConfirmation',

  // Membership flow
  MEMBERSHIP_PLANS: 'MembershipPlans',
  MEMBERSHIP_CHECKOUT: 'MembershipCheckout',

  // Package flow
  PACKAGE_LIST: 'PackageList',
  PACKAGE_CHECKOUT: 'PackageCheckout',

  // Coach detail screens
  CLIENT_DETAIL: 'ClientDetail',
  CLIENT_SHARED_MEDIA: 'ClientSharedMedia',
  CLIENT_ACTIVITY_FEED: 'ClientActivityFeed',

  // Curriculum
  CURRICULUM_EDITOR: 'CurriculumEditor',

  // Progress reports
  PROGRESS_REPORT_DETAIL: 'ProgressReportDetail',

  // Video recording
  VIDEO_RECORDING: 'VideoRecording',
  VIDEO_REVIEW: 'VideoReview',

  // Video annotation
  VIDEO_ANNOTATION: 'VideoAnnotation',

  // Payment link (deep link from email)
  PAYMENT_LINK: 'PaymentLink',

  // Booking detail
  BOOKING_DETAIL: 'BookingDetail',

  // Shared stacks
  VIDEO_PLAYER: 'VideoPlayer',
  NOTIFICATIONS: 'Notifications',
  NOTIFICATION_PREFERENCES: 'NotificationPreferences',
};

/**
 * Maps notification payload `screen` values to actual screen names.
 * Used by usePushNotifications and the deep linking config.
 */
export const NOTIFICATION_SCREEN_MAP = {
  Bookings: SCREENS.CLIENT_BOOKINGS,
  Schedule: SCREENS.COACH_SCHEDULE,
  Resources: SCREENS.CLIENT_PROGRESS,
  Notifications: SCREENS.NOTIFICATIONS,
  BookingDetail: SCREENS.BOOKING_DETAIL,
  CoachDashboard: SCREENS.COACH_DASHBOARD,
  AdminDashboard: SCREENS.ADMIN_DASHBOARD,
  Caddie: SCREENS.CADDIE,
  Marshal: SCREENS.MARSHAL,
};
