import React, { useState, useEffect, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { Text, Button, Chip, Divider, Searchbar, ActivityIndicator } from 'react-native-paper';
import PropTypes from 'prop-types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Avatar from '../Avatar';
import {
  getClassSession,
  getClassSessionWaitlist,
  cancelClassSession,
  createBooking,
  joinClassSessionWaitlist,
} from '../../services/bookings.api';
import { getClients } from '../../services/accounts.api';
import { bookingDetailStyles as styles } from '../../styles/bookingDetail.styles';
import { colors } from '../../theme';
import logger from '../../helpers/logger.helper';

/**
 * Class session detail section for BookingDetailScreen.
 * Shows capacity, attendees, waitlist, and staff actions (enroll, cancel).
 */
const ClassSessionSection = ({
  classSessionId,
  isStaffView,
  onSessionCancelled,
  onEnrollmentChanged,
}) => {
  const [session, setSession] = useState(null);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showEnrollSearch, setShowEnrollSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      const [sessionResult, waitlistResult] = await Promise.all([
        getClassSession(classSessionId),
        isStaffView ? getClassSessionWaitlist(classSessionId).catch(() => []) : Promise.resolve([]),
      ]);
      setSession(sessionResult?.data || sessionResult);
      setWaitlist(Array.isArray(waitlistResult?.data) ? waitlistResult.data : waitlistResult || []);
    } catch (err) {
      logger.warn('Failed to load class session details', err.message);
    } finally {
      setLoading(false);
    }
  }, [classSessionId, isStaffView]);

  useEffect(() => {
    if (classSessionId) loadSession();
  }, [classSessionId, loadSession]);

  const handleSearchClients = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const result = await getClients({ search: query, per_page: 10 });
      const clients = result?.data || [];
      // Filter out already enrolled attendees
      const attendeeIds = (session?.attendees || []).map((a) => a.client_id);
      setSearchResults(clients.filter((c) => !attendeeIds.includes(c.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [session?.attendees]);

  const handleEnrollClient = useCallback(async (client) => {
    if (!session) return;
    setEnrolling(true);
    const cap = session.capacity ?? session.service?.capacity;
    const avail = cap != null ? cap - (session.active_attendees ?? 0) : null;
    const classFull = avail != null && avail <= 0;
    try {
      if (classFull) {
        // Class is full — add to waitlist instead of creating a booking
        await joinClassSessionWaitlist(classSessionId, client.id);
        Alert.alert('Waitlisted', `${client.first_name} ${client.last_name} has been added to the waitlist.`);
      } else {
        await createBooking({
          client_id: client.id,
          class_session_id: classSessionId,
          service_ids: [session.service_id || session.service?.id],
          location_id: session.location_id || session.location?.id,
          start_time: session.start_at,
          end_time: session.end_at,
          status: 'confirmed',
          booking_type: 'one_off',
          bookable_type: 'App\\Models\\User',
          bookable_id: session.coach_id || session.coach?.id,
        });
        Alert.alert('Enrolled', `${client.first_name} ${client.last_name} has been enrolled.`);
      }
      setShowEnrollSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      loadSession();
      onEnrollmentChanged?.();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to enroll client.';
      Alert.alert('Enrollment Failed', msg);
    } finally {
      setEnrolling(false);
    }
  }, [classSessionId, session, loadSession, onEnrollmentChanged]);

  const handleCancelSession = useCallback(() => {
    const attendeeCount = session?.active_attendees || 0;
    Alert.alert(
      'Cancel Class Session',
      attendeeCount > 0
        ? `This will cancel the session and notify ${attendeeCount} enrolled client${attendeeCount !== 1 ? 's' : ''}. Continue?`
        : 'This will cancel the entire class session. Continue?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelClassSession(classSessionId, { notify: true });
              Alert.alert('Cancelled', 'Class session has been cancelled and attendees notified.');
              onSessionCancelled?.();
            } catch (err) {
              const msg = err?.response?.data?.message || err?.message || 'Failed to cancel session.';
              Alert.alert('Error', msg);
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    );
  }, [classSessionId, session, onSessionCancelled]);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (!session) return null;

  const capacity = session.capacity ?? session.service?.capacity;
  const enrolled = session.active_attendees ?? 0;
  const available = capacity != null ? capacity - enrolled : null;
  const isFull = available != null && available <= 0;
  const attendees = session.attendees || [];

  return (
    <>
      {/* Capacity */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.cardTitle}>Class Session</Text>
        </View>
        <View style={styles.capacityRow}>
          <Text style={styles.secondaryText}>Capacity</Text>
          <View style={styles.capacityBadges}>
            <Chip compact mode="flat" icon="account-check">{enrolled} enrolled</Chip>
            {available != null && (
              <Chip compact mode="flat" icon={isFull ? 'alert-circle' : 'account-plus'}
                style={isFull ? styles.chipFull : undefined}
                accessibilityLabel={isFull ? 'Class is full' : `${available} spots available`}
              >
                {isFull ? 'Full' : `${available} available`}
              </Chip>
            )}
          </View>
        </View>

        {/* Attendees list */}
        {attendees.length > 0 && (
          <>
            <Divider style={styles.sectionDivider} />
            <Text style={styles.subsectionLabel}>Attendees</Text>
            {attendees.map((attendee) => (
              <View key={attendee.id} style={styles.attendeeRow}>
                <Avatar
                  name={`${attendee.first_name} ${attendee.last_name}`}
                  size={32}
                />
                <Text style={styles.attendeeName}>
                  {attendee.first_name} {attendee.last_name}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Waitlist */}
        {waitlist.length > 0 && (
          <>
            <Divider style={styles.sectionDivider} />
            <Text style={styles.subsectionLabel}>Waitlist</Text>
            {waitlist.map((entry) => (
              <View key={entry.id} style={styles.attendeeRow}>
                <Chip compact mode="outlined" style={styles.waitlistPosition}>#{entry.position}</Chip>
                <Text style={styles.attendeeName}>
                  {entry.client?.first_name} {entry.client?.last_name}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* Staff actions */}
      {isStaffView && (
        <View style={styles.card}>
          {/* Enroll client */}
          {!showEnrollSearch ? (
            <Button
              mode="outlined"
              icon={isFull ? 'account-clock' : 'account-plus'}
              onPress={() => setShowEnrollSearch(true)}
              contentStyle={styles.enrollResultContent}
            >
              {isFull ? 'Add to Waitlist' : 'Enroll Client'}
            </Button>
          ) : (
            <View>
              <Searchbar
                placeholder="Search clients..."
                value={searchQuery}
                onChangeText={handleSearchClients}
                style={styles.enrollSearchbar}
                loading={searching}
              />
              {searchResults.map((client) => (
                <Button
                  key={client.id}
                  mode="text"
                  icon="account-plus"
                  onPress={() => handleEnrollClient(client)}
                  loading={enrolling}
                  disabled={enrolling}
                  contentStyle={styles.enrollResultContent}
                >
                  {client.first_name} {client.last_name}
                </Button>
              ))}
              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <Text style={styles.noResultsText}>No matching clients found</Text>
              )}
              <Button
                mode="text"
                onPress={() => { setShowEnrollSearch(false); setSearchQuery(''); setSearchResults([]); }}
              >
                Cancel
              </Button>
            </View>
          )}

          {/* Cancel session */}
          <Button
            mode="outlined"
            icon="calendar-remove"
            onPress={handleCancelSession}
            loading={cancelling}
            disabled={cancelling}
            textColor={colors.error}
            style={styles.cancelSessionButton}
            contentStyle={styles.enrollResultContent}
          >
            Cancel Class Session
          </Button>
        </View>
      )}
    </>
  );
};

ClassSessionSection.propTypes = {
  classSessionId: PropTypes.number.isRequired,
  isStaffView: PropTypes.bool,
  onSessionCancelled: PropTypes.func,
  onEnrollmentChanged: PropTypes.func,
};

export default ClassSessionSection;
