/**
 * Pure helper functions for building booking API payloads.
 * Extracted from useBookingSubmission to enable reuse and testing.
 */

/**
 * Build the payload for creating a new booking.
 *
 * @param {Object} params - All data needed to construct the payload
 * @param {string} [status='confirmed'] - Booking status ('confirmed' | 'pending')
 * @returns {Object} Booking creation payload
 */
export const buildBookingPayload = (
  { clientId, isMembershipBooking, isPackageBooking, location, service, coach, timeSlot, bookingData, membershipStatus, packageBenefit, bookingNotes, selectedResource, sendPaymentLink },
  status = 'confirmed',
) => {
  let bookingType = 'one_off';
  if (isMembershipBooking) bookingType = 'membership';
  else if (isPackageBooking) bookingType = 'package';

  const payload = {
    client_id: clientId,
    booking_type: bookingType,
    location_id: location?.id,
    service_ids: [service?.id],
    start_time: timeSlot?.start_time,
    end_time: timeSlot?.end_time,
    status,
    notes: bookingNotes || '',
  };

  if (coach?.id) {
    payload.bookable_type = 'App\\Models\\User';
    payload.bookable_id = coach.id;
  } else {
    payload.bookable_type = 'App\\Models\\Service';
    payload.bookable_id = service?.id;
  }

  if (selectedResource?.id) {
    payload.resource_ids = [selectedResource.id];
  }

  if (bookingData.duration_minutes && service?.is_variable_duration) {
    payload.duration_minutes = bookingData.duration_minutes;
  }

  if (isMembershipBooking && membershipStatus) {
    payload.membership_subscription_id = membershipStatus.membershipId;
    payload.membership_plan_service_id = membershipStatus.membershipPlanServiceId;
  }

  if (isPackageBooking && packageBenefit?.client_package_id) {
    payload.client_package_id = packageBenefit.client_package_id;
  }

  if (bookingData.selectedClassSession?.id) {
    payload.class_session_id = bookingData.selectedClassSession.id;
  }

  if (sendPaymentLink) {
    payload.send_payment_link = true;
  }

  return payload;
};

/**
 * Build the payload for updating an existing booking.
 *
 * @param {Object} params - All data needed to construct the update payload
 * @returns {Object} Booking update payload
 */
export const buildUpdatePayload = ({ bookingNotes, bookingStatus, timeSlot, selectedResource, isStaffEditor, service, location, client, coach }) => {
  const payload = {
    notes: bookingNotes || '',
    status: bookingStatus,
    start_time: timeSlot?.start_time,
    end_time: timeSlot?.end_time,
    resource_ids: selectedResource?.id ? [selectedResource.id] : [],
  };

  if (isStaffEditor) {
    if (service?.id) {
      payload.service_ids = [service.id];
    }
    payload.location_id = location?.id || null;
    payload.client_id = client?.id || null;
    payload.coach_ids = coach?.id ? [coach.id] : [];
  }

  return payload;
};
