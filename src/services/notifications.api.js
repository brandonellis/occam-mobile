import apiClient from './apiClient';

export const registerPushToken = async (token, platform) => {
  const response = await apiClient.post('/push-tokens', {
    token,
    platform,
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
  const response = await apiClient.put(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await apiClient.put('/notifications/read-all');
  return response.data;
};
