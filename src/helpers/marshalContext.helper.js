/**
 * Build page context for Marshal API requests based on the current
 * React Navigation route name and params.
 */

const SCREEN_LABELS = {
  AdminDashboard: 'Dashboard',
  CoachDashboard: 'Dashboard',
  AdminSchedule: 'Schedule',
  CoachSchedule: 'Schedule',
  AdminClients: 'Clients',
  CoachClients: 'Clients',
  ClientDetail: 'Client Profile',
  BookingDetail: 'Booking Detail',
  ClassSessionDetail: 'Class Session Detail',
  ServiceDetail: 'Service Detail',
  CoachDetail: 'Coach Profile',
  LocationDetail: 'Location Detail',
  ResourceDetail: 'Resource Detail',
  Marshal: 'Marshal',
  Caddie: 'Caddie',
  AdminProfile: 'Settings',
  CoachProfile: 'Settings',
  Calendar: 'Calendar',
  Analytics: 'Analytics',
  Memberships: 'Memberships',
  Curriculum: 'Curriculum',
  Assessments: 'Assessments',
};

export const buildMarshalScreenContext = (routeName, params = {}) => {
  if (!routeName) return {};

  const context = {
    current_route: routeName,
    current_page: SCREEN_LABELS[routeName] || routeName,
    platform: 'mobile',
  };

  // Extract entity IDs from route params
  if (params?.clientId) context.client_id = params.clientId;
  if (params?.bookingId) context.booking_id = params.bookingId;
  if (params?.serviceId) context.service_id = params.serviceId;
  if (params?.coachId) context.coach_id = params.coachId;
  if (params?.locationId) context.location_id = params.locationId;
  if (params?.resourceId) context.resource_id = params.resourceId;
  if (params?.classSessionId) context.class_session_id = params.classSessionId;

  return context;
};
