import { SCREENS } from '../constants/navigation.constants';
import { ROLES } from '../constants/auth.constants';
import { getSessionCoaches, getSessionServices } from './booking.helper';
import { isClassLike } from './normalizers.helper';

const STAFF_ROLE_NAMES = [ROLES.ADMIN, 'owner', 'staff'];

const getUserRoleNames = (user, activeRole) => {
  const explicitRoles = Array.isArray(user?.roles)
    ? user.roles.map((role) => (typeof role === 'string' ? role : role?.name)).filter(Boolean)
    : [];

  return Array.from(new Set([activeRole, ...explicitRoles].filter(Boolean)));
};

export const isPastBooking = (booking) => {
  const startTime = booking?.start_time || booking?.start;
  if (!startTime) return true;
  const start = new Date(startTime).getTime();
  return Number.isNaN(start) || start < Date.now();
};

export const getBookingCoachIds = (booking) => {
  return getSessionCoaches(booking)
    .map((coach) => coach?.id || coach?.coach_id)
    .filter(Boolean);
};

export const canEditBooking = ({ booking, activeRole, user }) => {
  const bookingId = booking?.id || booking?.booking_id;
  const roleNames = getUserRoleNames(user, activeRole);
  const userIsStaff = roleNames.some((roleName) => STAFF_ROLE_NAMES.includes(roleName));
  const userIsCoach = roleNames.includes(ROLES.COACH);
  const bookingService = getSessionServices(booking)?.[0] || booking?.service || null;

  if (!bookingId || isClassLike(bookingService) || isPastBooking(booking)) {
    return false;
  }

  if (userIsStaff) {
    return true;
  }

  if (userIsCoach) {
    return getBookingCoachIds(booking).includes(user?.id);
  }

  return false;
};

export const isStaffBookingRole = (activeRole) => STAFF_ROLE_NAMES.includes(activeRole);

export const getBookingEditEntryScreen = (activeRole) => {
  return isStaffBookingRole(activeRole) ? SCREENS.CLIENT_SELECTION : SCREENS.TIME_SLOT_SELECTION;
};

export const buildBookingEditData = (booking) => {
  const service = getSessionServices(booking)?.[0] || booking?.service || null;
  const coach = getSessionCoaches(booking)?.[0] || booking?.coach || null;
  const selectedResource = Array.isArray(booking?.resources) && booking.resources.length > 0
    ? booking.resources[0]
    : null;

  return {
    editMode: true,
    bookingId: booking?.id || booking?.booking_id || null,
    client: booking?.client || null,
    service,
    coach,
    location: booking?.location || null,
    date: booking?.start_time || null,
    timeSlot: booking?.start_time
      ? {
          id: booking?.id || booking?.booking_id || null,
          start_time: booking.start_time,
          end_time: booking.end_time,
        }
      : null,
    selectedResource,
    notes: booking?.notes || '',
    status: booking?.status || 'confirmed',
  };
};
