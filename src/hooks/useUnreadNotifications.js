import { useContext, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import NotificationBadgeContext from '../context/NotificationBadge.context';

const useUnreadNotifications = () => {
  const { unreadCount, refresh } = useContext(NotificationBadgeContext);
  const navigation = useNavigation();

  // Refresh on mount and every time the screen comes into focus (throttled)
  useEffect(() => {
    refresh({ force: true });
    const unsubscribe = navigation.addListener('focus', () => refresh());
    return unsubscribe;
  }, [navigation, refresh]);

  return { unreadCount, refresh };
};

export default useUnreadNotifications;
