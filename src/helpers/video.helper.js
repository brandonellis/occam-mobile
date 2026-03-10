import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Standard 16:9 video height based on screen width.
 */
export const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

/**
 * Format seconds into a human-readable "m:ss" timestamp string.
 * @param {number} seconds - Time in seconds.
 * @returns {string} Formatted timestamp (e.g. "1:05").
 */
export const formatVideoTimestamp = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
