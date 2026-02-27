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
