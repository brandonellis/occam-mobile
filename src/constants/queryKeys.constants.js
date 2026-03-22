// Centralized query key constants for React Query cache management.
// Mirrors occam-client's queryKeys.constants.js for the keys relevant to mobile.
// All useQuery / invalidateQueries calls should reference these keys
// to ensure mutations invalidate every consumer of the affected data.

export const QUERY_KEYS = {
  // ── Bookings ──────────────────────────────────────────────────────
  BOOKINGS: {
    all: ['bookings'],
    list: (params) => ['bookings', params],
    detail: (id) => ['bookings', id],
  },

  // ── Availability ──────────────────────────────────────────────────
  AVAILABILITY: {
    all: ['availability'],
    forDate: (params) => ['availability', params],
    monthly: (params) => ['monthlyAvailability', params],
  },

  // ── Services ──────────────────────────────────────────────────────
  SERVICES: {
    all: ['services'],
  },

  // ── Locations ─────────────────────────────────────────────────────
  LOCATIONS: {
    all: ['locations'],
  },

  // ── Coaches ───────────────────────────────────────────────────────
  COACHES: {
    all: ['coaches'],
  },

  // ── Clients / Accounts ────────────────────────────────────────────
  CLIENTS: {
    all: ['clients'],
    detail: (id) => ['client', id],
  },

  // ── Membership Plans ──────────────────────────────────────────────
  MEMBERSHIPS: {
    plans: ['membershipPlans'],
    my: ['myMembership'],
  },

  // ── Packages ──────────────────────────────────────────────────────
  PACKAGES: {
    all: ['packages'],
    my: ['myPackages'],
    myBookingBenefits: (serviceId) => ['myBookingBenefits', serviceId],
  },

  // ── Notifications ─────────────────────────────────────────────────
  NOTIFICATIONS: {
    all: ['notifications'],
    list: (params) => ['notifications', params],
    unreadCount: ['notifications', 'unreadCount'],
  },

  // ── Activities ────────────────────────────────────────────────────
  ACTIVITIES: {
    client: (clientId, params) => ['clientActivities', clientId, params],
    tags: ['activityTags'],
  },
};
