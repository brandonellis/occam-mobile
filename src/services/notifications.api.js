import apiClient from './apiClient';

export const registerPushToken = async (token, deviceType) => {
  const response = await apiClient.post('/push-tokens', {
    token,
    device_type: deviceType,
  });
  return response.data;
};

export const unregisterPushToken = async (token) => {
  const response = await apiClient.delete('/push-tokens', {
    data: { token },
  });
  return response.data;
};

export const getNotifications = async (params = {}) => {
  const response = await apiClient.get('/notifications', { params });
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const response = await apiClient.post(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await apiClient.post('/notifications/read-all');
  return response.data;
};

export const getUnreadNotificationCount = async () => {
  const response = await apiClient.get('/notifications', { params: { per_page: 1 } });
  return response.data?.unread_count ?? 0;
};

export const getNotificationPreferences = async () => {
  const response = await apiClient.get('/notification-preferences');
  return response.data;
};

export const updateNotificationPreferences = async (preferences) => {
  const response = await apiClient.put('/notification-preferences', { preferences });
  return response.data;
};
