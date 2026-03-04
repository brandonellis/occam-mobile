import * as SecureStore from 'expo-secure-store';
import { LAST_SEEN_STORAGE_KEY } from '../constants/activity.constants';

/**
 * Get a human-readable date label for grouping (Today, Yesterday, or formatted date).
 */
export const getDateLabel = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const now = new Date();

  const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = stripTime(now);
  const target = stripTime(date);
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/**
 * Group a flat array of activity items by date label.
 * Items should already be sorted newest-first.
 */
export const groupByDate = (items) => {
  const groups = [];
  let currentLabel = null;
  let currentItems = [];

  items.forEach((item) => {
    const label = getDateLabel(item.start_time || item.created_at);
    if (label !== currentLabel) {
      if (currentItems.length) {
        groups.push({ label: currentLabel, items: currentItems });
      }
      currentLabel = label;
      currentItems = [];
    }
    currentItems.push(item);
  });

  if (currentItems.length) {
    groups.push({ label: currentLabel, items: currentItems });
  }

  return groups;
};

/**
 * Convert a date filter preset value into start_date / end_date API params.
 */
export const getDateBoundsFromPreset = (preset) => {
  if (!preset || preset === 'all') return {};

  const now = new Date();
  const startOfDay = (d) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  const endOfDay = (d) => {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
  };

  let start;
  let end = endOfDay(now);

  switch (preset) {
    case 'this_week': {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1; // Monday start
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff));
      break;
    }
    case 'this_month':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      break;
    case 'last_month':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      break;
    case 'last_3_months':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()));
      break;
    case 'last_6_months':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()));
      break;
    default:
      return {};
  }

  return {
    start_date: start.toISOString(),
    end_date: end.toISOString(),
  };
};

/**
 * Sort activities newest-first by start_time (fallback created_at).
 */
export const sortNewestFirst = (a, b) => {
  const timeA = new Date(a.start_time || a.created_at || 0).valueOf();
  const timeB = new Date(b.start_time || b.created_at || 0).valueOf();
  return timeB - timeA;
};

/**
 * Get the last-seen timestamp from storage.
 */
export const getLastSeenTimestamp = async () => {
  try {
    const value = await SecureStore.getItemAsync(LAST_SEEN_STORAGE_KEY);
    return value ? new Date(value) : null;
  } catch {
    return null;
  }
};

/**
 * Save the current timestamp as last-seen.
 */
export const setLastSeenTimestamp = async () => {
  try {
    await SecureStore.setItemAsync(LAST_SEEN_STORAGE_KEY, new Date().toISOString());
  } catch {
    // silent
  }
};

/**
 * Count items newer than the last-seen timestamp.
 */
export const countUnreadItems = (items, lastSeen) => {
  if (!lastSeen || !Array.isArray(items) || items.length === 0) return 0;
  const threshold = new Date(lastSeen).valueOf();
  return items.filter((item) => {
    const itemTime = new Date(item.start_time || item.created_at || 0).valueOf();
    return itemTime > threshold;
  }).length;
};
