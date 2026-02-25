export const BOOKING_ACTIONS = {
  SET_SERVICES: 'SET_SERVICES',
  SELECT_SERVICE: 'SELECT_SERVICE',
  SET_COACHES: 'SET_COACHES',
  SELECT_COACH: 'SELECT_COACH',
  SET_AVAILABLE_DATES: 'SET_AVAILABLE_DATES',
  SELECT_DATE: 'SELECT_DATE',
  SET_TIME_SLOTS: 'SET_TIME_SLOTS',
  SELECT_TIME_SLOT: 'SELECT_TIME_SLOT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET: 'RESET',
  SET_STEP: 'SET_STEP',
};

export const BOOKING_STEPS = {
  SERVICE: 0,
  COACH: 1,
  TIME: 2,
  CONFIRM: 3,
};

export const initialBookingState = {
  step: BOOKING_STEPS.SERVICE,
  isLoading: false,
  error: null,

  services: [],
  selectedService: null,

  coaches: [],
  selectedCoach: null,

  availableDates: [],
  selectedDate: null,

  timeSlots: [],
  selectedTimeSlot: null,
};

export const bookingReducer = (state, action) => {
  switch (action.type) {
    case BOOKING_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload, error: null };

    case BOOKING_ACTIONS.SET_ERROR:
      return { ...state, isLoading: false, error: action.payload };

    case BOOKING_ACTIONS.SET_STEP:
      return { ...state, step: action.payload };

    case BOOKING_ACTIONS.SET_SERVICES:
      return { ...state, services: action.payload, isLoading: false };

    case BOOKING_ACTIONS.SELECT_SERVICE:
      return {
        ...state,
        selectedService: action.payload,
        selectedCoach: null,
        selectedDate: null,
        selectedTimeSlot: null,
        step: BOOKING_STEPS.COACH,
      };

    case BOOKING_ACTIONS.SET_COACHES:
      return { ...state, coaches: action.payload, isLoading: false };

    case BOOKING_ACTIONS.SELECT_COACH:
      return {
        ...state,
        selectedCoach: action.payload,
        selectedDate: null,
        selectedTimeSlot: null,
        step: BOOKING_STEPS.TIME,
      };

    case BOOKING_ACTIONS.SET_AVAILABLE_DATES:
      return { ...state, availableDates: action.payload, isLoading: false };

    case BOOKING_ACTIONS.SELECT_DATE:
      return {
        ...state,
        selectedDate: action.payload,
        selectedTimeSlot: null,
      };

    case BOOKING_ACTIONS.SET_TIME_SLOTS:
      return { ...state, timeSlots: action.payload, isLoading: false };

    case BOOKING_ACTIONS.SELECT_TIME_SLOT:
      return {
        ...state,
        selectedTimeSlot: action.payload,
        step: BOOKING_STEPS.CONFIRM,
      };

    case BOOKING_ACTIONS.RESET:
      return { ...initialBookingState };

    default:
      return state;
  }
};
