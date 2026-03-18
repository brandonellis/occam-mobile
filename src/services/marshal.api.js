import apiClient from './apiClient';

export const sendMarshalMessage = async (message, history = []) => {
  const response = await apiClient.post('/marshal/chat', {
    message,
    history,
  });

  return response.data?.data || response.data;
};

export const confirmMarshalAction = async (tool, args = {}) => {
  const response = await apiClient.post('/marshal/confirm', {
    tool,
    args,
  });

  return response.data?.data || response.data;
};

export const getMarshalInsights = async () => {
  const response = await apiClient.get('/marshal/insights');

  return response.data?.data || response.data;
};
