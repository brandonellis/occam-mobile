/**
 * Ionicons → MaterialCommunityIcons mapping.
 *
 * React Native Paper uses MaterialCommunityIcons by default.
 * This map provides the equivalent Material icon name for every
 * Ionicon currently used in the codebase.
 *
 * Browse available icons: https://materialdesignicons.com
 */

export const ICON_MAP = {
  // Navigation / Chrome
  'arrow-back': 'arrow-left',
  'chevron-back': 'chevron-left',
  'chevron-forward': 'chevron-right',
  'chevron-down': 'chevron-down',
  'close': 'close',
  'close-circle': 'close-circle',
  'close-circle-outline': 'close-circle-outline',
  'search': 'magnify',
  'refresh': 'refresh',
  'refresh-outline': 'refresh',
  'notifications-outline': 'bell-outline',
  'send': 'send',

  // Status / Feedback
  'checkmark': 'check',
  'checkmark-circle': 'check-circle',
  'checkmark-circle-outline': 'check-circle-outline',
  'alert-circle-outline': 'alert-circle-outline',

  // Media / Video
  'videocam': 'video',
  'videocam-outline': 'video-outline',
  'videocam-off-outline': 'video-off-outline',
  'play': 'play',
  'play-circle': 'play-circle',
  'play-circle-outline': 'play-circle-outline',
  'brush-outline': 'brush',
  'cloud-upload-outline': 'cloud-upload-outline',
  'musical-note-outline': 'music-note-outline',

  // People / Social
  'people-outline': 'account-group-outline',
  'person-outline': 'account-outline',
  'chatbubble-outline': 'chat-outline',
  'share-outline': 'share-variant-outline',

  // Documents / Content
  'document-outline': 'file-document-outline',
  'document-text-outline': 'file-document-outline',
  'documents-outline': 'file-multiple-outline',
  'book-outline': 'book-outline',
  'newspaper-outline': 'newspaper-variant-outline',
  'folder-open-outline': 'folder-open-outline',

  // Scheduling / Time
  'calendar-outline': 'calendar-outline',
  'time-outline': 'clock-outline',

  // Actions
  'add': 'plus',
  'add-circle-outline': 'plus-circle-outline',
  'trash-outline': 'trash-can-outline',
  'flag-outline': 'flag-outline',
  'pin-outline': 'pin-outline',

  // Business / Finance
  'analytics-outline': 'chart-line',
  'bar-chart-outline': 'chart-bar',
  'business-outline': 'domain',
  'card-outline': 'credit-card-outline',
  'pricetag-outline': 'tag-outline',
  'location-outline': 'map-marker-outline',

  // Education / Training
  'school-outline': 'school-outline',
  'cube-outline': 'cube-outline',
  'golf-outline': 'golf',

  // Misc — used in EmptyState, ActivityCard, etc.
  'cloud-offline-outline': 'cloud-off-outline',
  'ellipse-outline': 'circle-outline',
  'image-outline': 'image-outline',

  // Document type helpers (used in getDocIcon)
  'document-text': 'file-document',
  'grid': 'grid',
  'easel': 'presentation',
  'document': 'file-document-outline',
};
