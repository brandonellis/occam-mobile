import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushToken } from '../services/notifications.api';
import { navigate } from '../helpers/navigation.helper';
import { SCREENS, NOTIFICATION_SCREEN_MAP } from '../constants/navigation.constants';
import logger from '../helpers/logger.helper';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      logger.warn('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('Push notification permission not granted');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return token;
  };

  const registerToken = async () => {
    try {
      const token = await registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        await registerPushToken(token, Platform.OS);
      }
    } catch (error) {
      logger.warn('Failed to register push token:', error.message);
    }
  };

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notif) => {
        setNotification(notif);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.screen) {
          const targetScreen = NOTIFICATION_SCREEN_MAP[data.screen] || SCREENS.NOTIFICATIONS;

          // Build params from common notification payload fields
          const params = {};
          if (data.booking_id) params.bookingId = data.booking_id;
          if (data.report_id) params.reportId = data.report_id;
          if (data.client_id) params.clientId = data.client_id;

          navigate(targetScreen, Object.keys(params).length > 0 ? params : undefined);
        }
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    registerToken,
  };
};

export default usePushNotifications;
