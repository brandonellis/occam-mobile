import { colors } from '../theme/colors';

export const ACTIVITY_TYPES = {
  ALL: 'all',
  ACTIVITY: 'activity',
  BOOKING: 'booking',
  RESOURCE: 'resource',
  REPORT: 'report',
};

export const ACTIVITY_TYPE_CONFIG = {
  [ACTIVITY_TYPES.ACTIVITY]: {
    label: 'Activities',
    singular: 'Activity',
    icon: 'flask-outline',
    color: colors.aqua,
  },
  [ACTIVITY_TYPES.BOOKING]: {
    label: 'Bookings',
    singular: 'Booking',
    icon: 'calendar-outline',
    color: colors.accent,
  },
  [ACTIVITY_TYPES.RESOURCE]: {
    label: 'Resources',
    singular: 'Resource',
    icon: 'share-variant-outline',
    color: colors.lavenderMist,
  },
  [ACTIVITY_TYPES.REPORT]: {
    label: 'Reports',
    singular: 'Report',
    icon: 'chart-line',
    color: colors.peachGlow,
  },
};

export const TYPE_FILTER_OPTIONS = [
  { value: ACTIVITY_TYPES.ALL, label: 'All', icon: 'view-grid-outline' },
  { value: ACTIVITY_TYPES.ACTIVITY, label: 'Activities', icon: 'flask-outline' },
  { value: ACTIVITY_TYPES.BOOKING, label: 'Bookings', icon: 'calendar-outline' },
  { value: ACTIVITY_TYPES.RESOURCE, label: 'Resources', icon: 'share-variant-outline' },
  { value: ACTIVITY_TYPES.REPORT, label: 'Reports', icon: 'chart-line' },
];

export const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
];

export const ACTIVITY_PAGE_SIZE = 20;

export const LAST_SEEN_STORAGE_KEY = 'activity_feed_last_seen';
