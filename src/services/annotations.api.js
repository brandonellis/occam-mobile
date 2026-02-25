import apiClient from './apiClient';

export const getAnnotations = async (uploadId) => {
  const response = await apiClient.get(`/uploads/${uploadId}/annotations`);
  return response.data;
};

export const createAnnotation = async (uploadId, payload) => {
  const response = await apiClient.post(
    `/uploads/${uploadId}/annotations`,
    payload
  );
  return response.data;
};

export const updateAnnotation = async (uploadId, annotationId, payload) => {
  const response = await apiClient.put(
    `/uploads/${uploadId}/annotations/${annotationId}`,
    payload
  );
  return response.data;
};

export const deleteAnnotation = async (uploadId, annotationId) => {
  const response = await apiClient.delete(
    `/uploads/${uploadId}/annotations/${annotationId}`
  );
  return response.data;
};
