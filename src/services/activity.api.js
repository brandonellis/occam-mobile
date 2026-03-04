import apiClient from './apiClient';

export const getActivityTags = async () => {
  const response = await apiClient.get('/activity-tags');
  return response.data || [];
};

export const getClientActivities = async (clientId, params = {}) => {
  const response = await apiClient.get(`/clients/${clientId}/activities`, { params });
  return response.data;
};

export const getFeedItemNotes = async (type, id) => {
  const response = await apiClient.get('/feed-notes', { params: { type, id } });
  return response.data?.data || [];
};

/**
 * Add a note/comment to a feed item.
 * Routes to the correct backend endpoint based on item type.
 */
export const addFeedItemNote = async (itemType, itemId, data) => {
  if (itemType === 'resource' || itemType === 'report') {
    const response = await apiClient.post('/feed-notes', {
      noteable_type: itemType,
      noteable_id: itemId,
      ...data,
    });
    return response.data;
  }
  if (itemType === 'booking') {
    const response = await apiClient.post(`/bookings/${itemId}/notes`, data);
    return response.data;
  }
  // activity (default)
  const response = await apiClient.post(`/activities/${itemId}/notes`, data);
  return response.data;
};
