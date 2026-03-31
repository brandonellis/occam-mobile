import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, TextInput, Switch, Text, Divider, Card, Chip, Searchbar, ActivityIndicator } from 'react-native-paper';
import ScreenHeader from '../../components/ScreenHeader';
import { sendLessonFeedback } from '../../services/bookings.api';
import { getUploads } from '../../services/uploads.api';
import { getClientPerformanceCurriculum } from '../../services/accounts.api';
import { formatTimeInTz, formatDateInTz } from '../../helpers/timezone.helper';
import useAuth from '../../hooks/useAuth';
import { colors } from '../../theme';
import { lessonFeedbackStyles as styles } from '../../styles/lessonFeedback.styles';
import logger from '../../helpers/logger.helper';

const LessonFeedbackScreen = ({ navigation, route }) => {
  const { booking } = route.params || {};
  const { company } = useAuth();

  const [coachMessage, setCoachMessage] = useState('');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [notesContent, setNotesContent] = useState('');
  const [includeCurriculum, setIncludeCurriculum] = useState(false);
  const [selectedResources, setSelectedResources] = useState([]);
  const [resourceSearch, setResourceSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [curriculumData, setCurriculumData] = useState(null);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const clientId = booking?.client?.id || booking?.client_id;
  const clientName = booking?.client
    ? `${booking.client.first_name} ${booking.client.last_name}`
    : 'the client';

  // Pre-populate notes from existing booking notes
  useEffect(() => {
    if (booking) {
      const notes = booking.notes || [];
      const textNotes = Array.isArray(notes)
        ? notes
            .filter(n => typeof n === 'object' && n.note && n.note_type !== 'voice')
            .map(n => n.note)
            .join('\n\n')
        : '';

      if (textNotes) {
        setNotesContent(textNotes);
        setIncludeNotes(true);
      }
    }
  }, [booking]);

  // Load curriculum data
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    setCurriculumLoading(true);
    getClientPerformanceCurriculum(clientId)
      .then(data => {
        if (!cancelled) {
          setCurriculumData(data);
          const hasPrograms = data?.programs?.length > 0;
          setIncludeCurriculum(hasPrograms);
        }
      })
      .catch((err) => { logger.warn('Failed to load curriculum:', err?.message); })
      .finally(() => { if (!cancelled) setCurriculumLoading(false); });
    return () => { cancelled = true; };
  }, [clientId]);

  const curriculumSummary = useMemo(() => {
    const program = curriculumData?.programs?.[0];
    if (!program) return null;
    const total = program.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
    const completed = program.modules?.reduce(
      (sum, m) => sum + (m.lessons?.filter(l => l.completed)?.length || 0), 0
    ) || 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: program.name, total, completed, pct };
  }, [curriculumData]);

  // Search uploads from media library (debounced)
  const [rawSearchResults, setRawSearchResults] = useState([]);
  useEffect(() => {
    if (!resourceSearch.trim()) {
      setRawSearchResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await getUploads({ search: resourceSearch, per_page: 15 });
        if (!cancelled) setRawSearchResults(data?.data || []);
      } catch {
        if (!cancelled) setRawSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [resourceSearch]);

  // Filter out already-selected resources without re-triggering the search
  const searchResults = useMemo(() => {
    const selectedIds = selectedResources.map(r => r.id);
    return rawSearchResults.filter(u => !selectedIds.includes(u.id));
  }, [rawSearchResults, selectedResources]);

  const handleSelectResource = useCallback((upload) => {
    setSelectedResources(prev => [...prev, upload]);
    setResourceSearch('');
  }, []);

  const handleRemoveResource = useCallback((uploadId) => {
    setSelectedResources(prev => prev.filter(r => r.id !== uploadId));
  }, []);

  const handleSend = useCallback(async () => {
    if (!booking?.id || !coachMessage.trim()) return;

    Alert.alert(
      'Send Lesson Recap',
      `Send lesson recap email to ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              await sendLessonFeedback(booking.id, {
                message: coachMessage.trim(),
                include_notes: includeNotes,
                notes_content: includeNotes ? notesContent : null,
                include_curriculum: includeCurriculum,
                resource_ids: selectedResources.map(r => r.id),
              });
              Alert.alert('Success', 'Lesson recap sent!', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              const msg = error?.response?.data?.message || 'Failed to send lesson recap.';
              Alert.alert('Error', msg);
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  }, [booking, coachMessage, includeNotes, notesContent, includeCurriculum, selectedResources, clientName, navigation]);

  const service = booking?.services?.[0];
  const coach = booking?.coaches?.[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Send Lesson Recap" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Session Details */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>Session Details</Text>
            {booking?.start_time && (
              <Text variant="bodyMedium" style={styles.detailText}>
                {formatDateInTz(booking.start_time, company, 'long')}
              </Text>
            )}
            {booking?.start_time && (
              <Text variant="bodyMedium" style={styles.detailText}>
                {formatTimeInTz(booking.start_time, company)}
                {booking.end_time ? ` - ${formatTimeInTz(booking.end_time, company)}` : ''}
              </Text>
            )}
            {service && (
              <Text variant="bodyMedium" style={styles.detailText}>{service.name}</Text>
            )}
            {coach && (
              <Text variant="bodySmall" style={styles.secondaryText}>
                Coach: {coach.first_name} {coach.last_name}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Message */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Message to Client *</Text>
        <TextInput
          mode="outlined"
          multiline
          numberOfLines={5}
          placeholder="Write a personalized message about the session..."
          value={coachMessage}
          onChangeText={setCoachMessage}
          maxLength={5000}
          style={styles.textInput}
        />

        <Divider style={styles.divider} />

        {/* Notes toggle */}
        <View style={styles.toggleRow}>
          <Text variant="bodyLarge">Include Session Notes</Text>
          <Switch value={includeNotes} onValueChange={setIncludeNotes} />
        </View>
        {includeNotes && (
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Session notes..."
            value={notesContent}
            onChangeText={setNotesContent}
            maxLength={10000}
            style={styles.textInput}
          />
        )}

        <Divider style={styles.divider} />

        {/* Attach Resources */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Attach Resources</Text>
        <Searchbar
          placeholder="Search media library..."
          value={resourceSearch}
          onChangeText={setResourceSearch}
          style={styles.searchbar}
          loading={searchLoading}
        />
        {searchResults.length > 0 && (
          <Card style={styles.searchResultsCard} mode="outlined">
            <FlatList
              data={searchResults}
              keyExtractor={item => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => handleSelectResource(item)}
                >
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {item.title || item.original_filename || item.filename}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Card>
        )}
        {selectedResources.length > 0 && (
          <View style={styles.chipRow}>
            {selectedResources.map(r => (
              <Chip
                key={r.id}
                onClose={() => handleRemoveResource(r.id)}
                style={styles.chip}
              >
                {r.title || r.original_filename || r.filename}
              </Chip>
            ))}
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Curriculum Progress */}
        {curriculumLoading && <ActivityIndicator style={styles.loader} />}
        {curriculumSummary && !curriculumLoading && (
          <>
            <View style={styles.toggleRow}>
              <Text variant="bodyLarge">Include Curriculum Progress</Text>
              <Switch value={includeCurriculum} onValueChange={setIncludeCurriculum} />
            </View>
            {includeCurriculum && (
              <Card style={styles.card} mode="outlined">
                <Card.Content>
                  <Text variant="bodySmall" style={styles.secondaryText}>{curriculumSummary.name}</Text>
                  <Text variant="bodyMedium" style={styles.detailText}>
                    {curriculumSummary.completed}/{curriculumSummary.total} lessons completed ({curriculumSummary.pct}%)
                  </Text>
                </Card.Content>
              </Card>
            )}
            <Divider style={styles.divider} />
          </>
        )}

        {/* Send button */}
        <Button
          mode="contained"
          icon="send"
          onPress={handleSend}
          loading={sending}
          disabled={sending || !coachMessage.trim()}
          buttonColor={colors.accent}
          textColor={colors.textInverse}
          style={styles.sendButton}
        >
          Send Recap
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LessonFeedbackScreen;
