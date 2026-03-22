export const BOOKING_SUBMISSION_ACTIONS = {
  SUBMIT_START: 'SUBMIT_START',
  SET_LOADING_MESSAGE: 'SET_LOADING_MESSAGE',
  SUBMIT_SUCCESS: 'SUBMIT_SUCCESS',
  SUBMIT_END: 'SUBMIT_END',
};

export const initialBookingSubmissionState = {
  isSubmitting: false,
  loadingMessage: '',
  showSuccess: false,
  createdBookingData: null,
};

export const bookingSubmissionReducer = (state, action) => {
  switch (action.type) {
    case BOOKING_SUBMISSION_ACTIONS.SUBMIT_START:
      return {
        ...state,
        isSubmitting: true,
        loadingMessage: action.payload || 'Processing...',
        showSuccess: false,
        createdBookingData: null,
      };
    case BOOKING_SUBMISSION_ACTIONS.SET_LOADING_MESSAGE:
      return {
        ...state,
        loadingMessage: action.payload || '',
      };
    case BOOKING_SUBMISSION_ACTIONS.SUBMIT_SUCCESS:
      return {
        ...state,
        showSuccess: true,
        createdBookingData: action.payload || null,
      };
    case BOOKING_SUBMISSION_ACTIONS.SUBMIT_END:
      return {
        ...state,
        isSubmitting: false,
        loadingMessage: '',
      };
    default:
      return state;
  }
};
