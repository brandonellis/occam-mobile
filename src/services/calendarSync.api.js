import apiClient from './apiClient';

export const getCalendarSyncStatus = async () => {
  const response = await apiClient.get('/calendar-sync/status');
  return response.data;
};

export const enableCalendarFeed = async () => {
  const response = await apiClient.post('/calendar-sync/feed/enable');
  return response.data;
};

export const disableCalendarFeed = async () => {
  const response = await apiClient.post('/calendar-sync/feed/disable');
  return response.data;
};

export const regenerateCalendarFeed = async () => {
  const response = await apiClient.post('/calendar-sync/feed/regenerate');
  return response.data;
};

export const getGoogleCalendarRedirectUrl = async (params = {}) => {
  const response = await apiClient.get('/calendar-sync/google/redirect', { params });
  return response.data;
};

export const connectGoogleCalendar = async (code, state) => {
  const response = await apiClient.post('/calendar-sync/google/callback', { code, state });
  return response.data;
};

export const disconnectGoogleCalendar = async () => {
  const response = await apiClient.post('/calendar-sync/google/disconnect');
  return response.data;
};

export const syncAllToGoogleCalendar = async () => {
  const response = await apiClient.post('/calendar-sync/google/sync-all');
  return response.data;
};
