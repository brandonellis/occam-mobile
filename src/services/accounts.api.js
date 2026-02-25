import apiClient from './apiClient';

export const getMembershipPlans = async () => {
  const response = await apiClient.get('/membership-plans');
  return response.data;
};

export const purchaseMembership = async (payload) => {
  const response = await apiClient.post('/memberships', payload);
  return response.data;
};

export const getClientProfile = async () => {
  const response = await apiClient.get('/client/profile');
  return response.data;
};

export const updateClientProfile = async (payload) => {
  const response = await apiClient.put('/client/profile', payload);
  return response.data;
};

export const getClients = async (params = {}) => {
  const response = await apiClient.get('/clients', { params });
  return response.data;
};

export const getClient = async (clientId) => {
  const response = await apiClient.get(`/clients/${clientId}`);
  return response.data;
};

export const getClientPerformanceCurriculum = async (clientId, params = {}) => {
  const response = await apiClient.get(
    `/clients/${clientId}/performance/curriculum`,
    { params }
  );
  return response.data;
};

export const getClientPerformanceSnapshots = async (clientId) => {
  const response = await apiClient.get(
    `/clients/${clientId}/performance/snapshots`
  );
  return response.data;
};

export const getClientSharedMedia = async (clientId) => {
  const response = await apiClient.get(
    `/clients/${clientId}/performance/shared-media`
  );
  return response.data;
};

export const shareMediaWithClient = async (clientId, payload) => {
  const response = await apiClient.post(
    `/clients/${clientId}/performance/shared-media`,
    payload
  );
  return response.data;
};

export const unshareMediaFromClient = async (clientId, sharedMediaId) => {
  const response = await apiClient.delete(
    `/clients/${clientId}/performance/shared-media/${sharedMediaId}`
  );
  return response.data;
};

export const createPerformanceSnapshot = async (clientId, payload = {}) => {
  const response = await apiClient.post(
    `/clients/${clientId}/performance/snapshots`,
    payload
  );
  return response.data;
};

export const deletePerformanceSnapshot = async (clientId, snapshotId) => {
  const response = await apiClient.delete(
    `/clients/${clientId}/performance/snapshots/${snapshotId}`
  );
  return response.data;
};

// Curriculum module management
export const storeClientModule = async (clientId, payload) => {
  const response = await apiClient.post(
    `/clients/${clientId}/performance/modules`,
    payload
  );
  return response.data;
};

export const updateClientModule = async (clientId, moduleId, payload) => {
  const response = await apiClient.put(
    `/clients/${clientId}/performance/modules/${moduleId}`,
    payload
  );
  return response.data;
};

export const deleteClientModule = async (clientId, moduleId) => {
  const response = await apiClient.delete(
    `/clients/${clientId}/performance/modules/${moduleId}`
  );
  return response.data;
};

export const toggleLesson = async (clientId, lessonId, completed) => {
  const response = await apiClient.post(
    `/clients/${clientId}/performance/lessons/${lessonId}/toggle`,
    { completed }
  );
  return response.data;
};

// Module templates
export const getModuleTemplates = async () => {
  const response = await apiClient.get('/performance/module-templates');
  return response.data;
};

// Curriculum packages
export const getCurriculumPackages = async () => {
  const response = await apiClient.get('/performance/curriculum-packages');
  return response.data;
};

export const applyPackageToClient = async (clientId, packageId) => {
  const response = await apiClient.post(
    `/clients/${clientId}/performance/apply-package/${packageId}`
  );
  return response.data;
};

export const getCurrentClientMembership = async (clientId) => {
  const response = await apiClient.get(
    `/clients/${clientId}/current-membership`
  );
  return response.data;
};
