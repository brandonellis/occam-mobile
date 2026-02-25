/**
 * Extract a user-friendly error message from an API error response.
 * Handles Laravel validation errors, general error messages, and fallbacks.
 *
 * @param {Error} error - The caught error object (typically from axios)
 * @param {string} [fallback='Something went wrong.'] - Default message if no specific message found
 * @returns {string} Human-readable error message
 */
export const extractErrorMessage = (error, fallback = 'Something went wrong.') => {
  let msg =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallback;

  const validationErrors = error.response?.data?.errors;
  if (validationErrors && typeof validationErrors === 'object') {
    const firstField = Object.keys(validationErrors)[0];
    if (firstField && Array.isArray(validationErrors[firstField])) {
      msg = validationErrors[firstField][0];
    }
  }
  return msg;
};
