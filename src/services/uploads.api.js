import apiClient from './apiClient';

/**
 * Upload a file to the media library.
 * @param {string} fileUri - Local file URI (e.g. from camera)
 * @param {object} options
 * @param {string} options.uploadableType - e.g. 'media_library'
 * @param {boolean} options.isLibrary - Store as library item
 * @param {string} [options.filename] - Override filename
 * @param {string} [options.mimeType] - Override MIME type
 * @param {function} [options.onProgress] - Upload progress callback (0-1)
 * @returns {Promise<object>} Upload record
 */
export const uploadFile = async (fileUri, options = {}) => {
  const {
    uploadableType = 'media_library',
    isLibrary = true,
    filename = 'recording.mp4',
    mimeType = 'video/mp4',
    onProgress,
  } = options;

  const formData = new FormData();
  formData.append('file_upload', {
    uri: fileUri,
    name: filename,
    type: mimeType,
  });
  formData.append('uploadable_type', uploadableType);
  formData.append('is_library', isLibrary ? '1' : '0');

  const response = await apiClient.post('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onProgress
      ? (event) => {
          const progress = event.loaded / (event.total || event.loaded);
          onProgress(progress);
        }
      : undefined,
  });

  return response.data;
};

/**
 * Get uploads from the media library.
 * @param {object} params - Query params (search, page, per_page, etc.)
 * @returns {Promise<object>}
 */
export const getUploads = async (params = {}) => {
  const response = await apiClient.get('/uploads', { params });
  return response.data;
};
