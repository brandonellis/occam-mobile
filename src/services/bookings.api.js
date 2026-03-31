import apiClient from './apiClient';

export const getBookings = async (params = {}) => {
  const response = await apiClient.get('/bookings', { params });
  return response.data;
};

export const getBooking = async (bookingId) => {
  const response = await apiClient.get(`/bookings/${bookingId}`);
  return response.data;
};

export const createBooking = async (payload) => {
  const response = await apiClient.post('/bookings', payload);
  return response.data;
};

export const updateBooking = async (bookingId, payload) => {
  const response = await apiClient.put(`/bookings/${bookingId}`, payload);
  return response.data;
};

export const cancelBooking = async (bookingId) => {
  const response = await apiClient.delete(`/bookings/${bookingId}`);
  return response.data;
};

export const getServices = async () => {
  const response = await apiClient.get('/services');
  return response.data;
};

export const getLocations = async () => {
  const response = await apiClient.get('/locations');
  return response.data;
};

export const getCoaches = async () => {
  const response = await apiClient.get('/coaches');
  return response.data;
};

export const getAvailability = async (params) => {
  const response = await apiClient.get('/availability', { params });
  return response.data;
};

export const getAvailabilityMonthlySummary = async (params) => {
  const response = await apiClient.get('/availability/monthly-summary', { params });
  return response.data;
};

/**
 * Fetch generated time slots for a single day from the backend.
 * Replaces client-side slot generation with a single API call.
 *
 * @param {Object} params
 * @param {number} params.service_id
 * @param {number} params.location_id
 * @param {string} params.date - Format: 'YYYY-MM-DD'
 * @param {number[]} [params.coach_ids]
 * @param {number[]} [params.resource_ids]
 * @param {number} [params.duration_minutes]
 * @returns {Promise<Object>} { data: Array, meta: Object }
 */
export const getAvailabilityTimeslots = async (params) => {
  const response = await apiClient.get('/availability/timeslots', { params });
  return response.data;
};

export const getCoachSchedule = async (coachId, params) => {
  const response = await apiClient.get(`/coaches/${coachId}/schedule`, { params });
  return response.data;
};

export const getBookingsCompact = async (params = {}) => {
  const response = await apiClient.get('/bookings/compact', { params });
  return response.data;
};

export const getResources = async (params = {}) => {
  const response = await apiClient.get('/resources', { params });
  return response.data;
};

export const getEcommerceConfig = async () => {
  const response = await apiClient.get('/config/ecommerce');
  return response.data;
};

export const getCompany = async () => {
  const response = await apiClient.get('/company');
  return response.data;
};

/**
 * List available class sessions grouped by coach for booking UI.
 * @param {{service_id:number, location_id:number, after?:string, before?:string, client_id?:number}} params
 * @param {object} [options] - Optional axios config (e.g. { signal })
 */
export const getAvailableClassSessionsByCoach = async (params, options = {}) => {
  const response = await apiClient.get('/class-sessions/available/by-coach', {
    params,
    ...(options.signal ? { signal: options.signal } : {}),
  });
  return response.data;
};

/**
 * Join the waitlist for a full class session.
 * @param {number} classSessionId
 * @param {number} [clientId] - Optional client ID (for coach flow)
 */
export const joinClassSessionWaitlist = async (classSessionId, clientId) => {
  const payload = clientId ? { client_id: clientId } : {};
  const response = await apiClient.post(`/class-sessions/${classSessionId}/waitlist`, payload);
  return response.data;
};

/**
 * Leave the waitlist for a class session.
 * @param {number} classSessionId
 * @param {number} [clientId] - Optional client ID (for coach flow)
 */
export const leaveClassSessionWaitlist = async (classSessionId, clientId) => {
  const response = await apiClient.delete(`/class-sessions/${classSessionId}/waitlist`, {
    data: clientId ? { client_id: clientId } : {},
  });
  return response.data;
};

/**
 * Create a recurring booking series.
 * @param {Object} payload - { client_id, service_ids, location_id, start_time, end_time, frequency, occurrences, booking_type, ... }
 * @returns {Promise<Object>} { series_id, uuid, frequency, created_count, failed_count, bookings, message }
 */
export const createRecurringBooking = async (payload) => {
  const response = await apiClient.post('/bookings/recurring', payload);
  return response.data;
};

/**
 * List recurring booking series for the current user.
 * @param {Object} [params] - { per_page, page }
 */
export const getRecurringSeries = async (params = {}) => {
  const response = await apiClient.get('/bookings/series', { params });
  return response.data;
};

/**
 * Get details of a recurring booking series.
 * @param {number} seriesId
 */
export const getRecurringSeriesDetail = async (seriesId) => {
  const response = await apiClient.get(`/bookings/series/${seriesId}`);
  return response.data;
};

/**
 * Cancel a recurring booking series and all its future bookings.
 * @param {number} seriesId
 */
export const cancelRecurringSeries = async (seriesId) => {
  const response = await apiClient.post(`/bookings/series/${seriesId}/cancel`);
  return response.data;
};

/**
 * Send lesson feedback email to the client.
 * @param {number} bookingId
 * @param {object} payload - { message, include_notes, notes_content, include_curriculum, resource_ids }
 */
export const sendLessonFeedback = async (bookingId, payload) => {
  const response = await apiClient.post(`/bookings/${bookingId}/send-lesson-feedback`, payload);
  return response.data;
};

/**
 * Preview lesson feedback email as rendered HTML.
 * @param {number} bookingId
 * @param {object} payload - same shape as sendLessonFeedback
 * @returns {Promise<string>} Rendered HTML
 */
export const previewLessonFeedback = async (bookingId, payload) => {
  const response = await apiClient.post(`/bookings/${bookingId}/preview-lesson-feedback`, payload);
  return response.data?.html || '';
};
