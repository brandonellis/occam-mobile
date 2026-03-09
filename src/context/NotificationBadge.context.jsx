import { createContext } from 'react';

const NotificationBadgeContext = createContext({
  unreadCount: 0,
  refresh: () => {},
});

export default NotificationBadgeContext;
