import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, Alert, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Switch, Text, Divider, Card, Chip, Searchbar, ActivityIndicator } from 'react-native-paper';
import RichTextEditor from '../../components/RichTextEditor';
import { isHtmlEmpty } from '../../helpers/html.helper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import ScreenHeader from '../../components/ScreenHeader';
import { sendLessonFeedback, previewLessonFeedback } from '../../services/bookings.api';
import { getUploads } from '../../services/uploads.api';
import { getClientPerformanceCurriculum } from '../../services/accounts.api';
import { formatTimeInTz, formatDateInTz } from '../../helpers/timezone.helper';
import useAuth from '../../hooks/useAuth';
import { resolveMediaUrl } from '../../helpers/media.helper';
import AuthImage from '../../components/AuthImage';
import { colors } from '../../theme';
import { lessonFeedbackStyles as styles } from '../../styles/lessonFeedback.styles';
import logger from '../../helpers/logger.helper';

const MAX_WEBVIEW_HEIGHT = 500;

const getDocIcon = (mime) => {
  if (mime.startsWith('application/pdf')) return 'file-document';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'grid';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
  return 'file-document-outline';
};

const LessonFeedbackScreen = ({ navigation, route }) => {
  const { booking } = route.params || {};
  const { company } = useAuth();

  const [mode, setMode] = useState('compose');
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
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(300);
  const webViewRef = useRef(null);

  const clientId = booking?.client?.id || booking?.client_id;
  const clientName = booking?.client
    ? `${booking.client.first_name} ${booking.client.last_name}`
    : 'the client';

  useEffect(() => {
    if (booking) {
      const notes = booking.notes || [];
      const textNotes = Array.isArray(notes)
        ? notes.filter(n => typeof n === 'object' && n.note && n.note_type !== 'voice').map(n => n.note).join('\n\n')
        : '';
      if (textNotes) { setNotesContent(textNotes); setIncludeNotes(true); }
    }
  }, [booking]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    setCurriculumLoading(true);
    getClientPerformanceCurriculum(clientId)
      .then(data => {
        if (!cancelled) { setCurriculumData(data); setIncludeCurriculum(data?.programs?.length > 0); }
      })
      .catch((err) => { logger.warn('Failed to load curriculum:', err?.message); })
      .finally(() => { if (!cancelled) setCurriculumLoading(false); });
    return () => { cancelled = true; };
  }, [clientId]);

  const curriculumSummary = useMemo(() => {
    const program = curriculumData?.programs?.[0];
    if (!program) return null;
    const total = program.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
    const completed = program.modules?.reduce((sum, m) => sum + (m.lessons?.filter(l => l.completed)?.length || 0), 0) || 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: program.name, total, completed, pct };
  }, [curriculumData]);

  const [rawSearchResults, setRawSearchResults] = useState([]);
  useEffect(() => {
    if (!resourceSearch.trim()) { setRawSearchResults([]); return; }
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await getUploads({ search: resourceSearch, per_page: 15 });
        if (!cancelled) setRawSearchResults(data?.data || []);
      } catch { if (!cancelled) setRawSearchResults([]); }
      finally { if (!cancelled) setSearchLoading(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [resourceSearch]);

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

  const buildPayload = useCallback(() => ({
    message: coachMessage,
    include_notes: includeNotes,
    notes_content: includeNotes ? notesContent : null,
    include_curriculum: includeCurriculum,
    resource_ids: selectedResources.map(r => r.id),
  }), [coachMessage, includeNotes, notesContent, includeCurriculum, selectedResources]);

  const injectedJS = `
    (function() {
      var height = document.documentElement.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
      var observer = new ResizeObserver(function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ height: document.documentElement.scrollHeight }));
      });
      observer.observe(document.body);
    })();
    true;
  `;

  const handleWebViewMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.height) setWebViewHeight(Math.min(data.height, MAX_WEBVIEW_HEIGHT));
    } catch {}
  }, []);

  const handlePreview = useCallback(async () => {
    if (!booking?.id || isHtmlEmpty(coachMessage)) return;
    setPreviewLoading(true);
    try {
      const html = await previewLessonFeedback(booking.id, buildPayload());
      setPreviewHtml(html);
      setMode('preview');
    } catch { Alert.alert('Error', 'Failed to load preview.'); }
    finally { setPreviewLoading(false); }
  }, [booking, coachMessage, buildPayload]);

  const handleSend = useCallback(async () => {
    if (!booking?.id || isHtmlEmpty(coachMessage)) return;
    Alert.alert('Send Lesson Recap', `Send lesson recap email to ${clientName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          setSending(true);
          try {
            await sendLessonFeedback(booking.id, buildPayload());
            Alert.alert('Success', 'Lesson recap sent!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to send lesson recap.');
          } finally { setSending(false); }
        },
      },
    ]);
  }, [booking, coachMessage, buildPayload, clientName, navigation]);

  const service = booking?.services?.[0];
  const coach = booking?.coaches?.[0];

  const renderSearchResultItem = useCallback(({ item }) => {
    const mime = item.mime_type || '';
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');
    const thumbUrl = resolveMediaUrl(item.thumb_url || (isImage ? item.url : null));
    const title = item.title || item.original_filename || item.filename;

    return (
      <TouchableOpacity style={styles.searchResultItem} onPress={() => handleSelectResource(item)}>
        {isImage && thumbUrl ? (
          <AuthImage uri={thumbUrl} style={styles.searchResultThumb} resizeMode="cover" />
        ) : isVideo ? (
          <View style={[styles.searchResultIcon, styles.searchResultIconVideo]}>
            <MaterialCommunityIcons name="play-circle" size={20} color={colors.accent} />
          </View>
        ) : (
          <View style={styles.searchResultIcon}>
            <MaterialCommunityIcons name={getDocIcon(mime)} size={20} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.searchResultInfo}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.searchResultTitle}>{title}</Text>
          <Text variant="bodySmall" style={styles.searchResultType}>
            {isImage ? 'Image' : isVideo ? 'Video' : mime.split('/').pop()?.toUpperCase() || 'File'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleSelectResource]);

  // Preview mode
  if (mode === 'preview') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Preview Lesson Recap" onBack={() => setMode('compose')} />
        <View style={[styles.webViewContainer, { height: webViewHeight }]}>
          <WebView
            ref={webViewRef}
            source={{ html: previewHtml }}
            style={styles.webView}
            scrollEnabled
            injectedJavaScript={injectedJS}
            onMessage={handleWebViewMessage}
            originWhitelist={['https:', 'http:', 'about:']}
            onShouldStartLoadWithRequest={(req) => req.url === 'about:blank' || req.url.startsWith('data:')}
            showsVerticalScrollIndicator={false}
            javaScriptEnabled
          />
        </View>
        <View style={styles.previewActions}>
          <Button mode="outlined" icon="pencil-outline" onPress={() => setMode('compose')} style={styles.previewActionButton}>
            Back to Edit
          </Button>
          <Button mode="contained" icon="send" onPress={handleSend} loading={sending} disabled={sending} buttonColor={colors.accent} textColor={colors.textInverse} style={styles.previewActionButton}>
            Send Recap
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Compose mode
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Send Lesson Recap" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Session Details */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>Session Details</Text>
            {booking?.start_time && (
              <Text variant="bodyMedium" style={styles.detailText}>{formatDateInTz(booking.start_time, company, 'long')}</Text>
            )}
            {booking?.start_time && (
              <Text variant="bodyMedium" style={styles.detailText}>
                {formatTimeInTz(booking.start_time, company)}{booking.end_time ? ` - ${formatTimeInTz(booking.end_time, company)}` : ''}
              </Text>
            )}
            {service && <Text variant="bodyMedium" style={styles.detailText}>{service.name}</Text>}
            {coach && <Text variant="bodySmall" style={styles.secondaryText}>Coach: {coach.first_name} {coach.last_name}</Text>}
          </Card.Content>
        </Card>

        {/* Personal Feedback */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Personal Feedback *</Text>
        <Text variant="bodySmall" style={styles.helperText}>
          Your personalized message to the client. This is the main body of the email.
        </Text>
        <RichTextEditor
          value={coachMessage}
          onChange={setCoachMessage}
          placeholder="Write about what you worked on, what went well, and what to focus on next..."
          minHeight={160}
        />

        <Divider style={styles.divider} />

        {/* Notes toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabel}>
            <Text variant="bodyLarge">Include Session Notes</Text>
            <Text variant="bodySmall" style={styles.helperText}>
              Pre-filled from notes added during the lesson. Shown as a separate section.
            </Text>
          </View>
          <Switch value={includeNotes} onValueChange={setIncludeNotes} />
        </View>
        {includeNotes && (
          <RichTextEditor
            value={notesContent}
            onChange={setNotesContent}
            placeholder="Session notes..."
            minHeight={120}
          />
        )}

        <Divider style={styles.divider} />

        {/* Attach Resources */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Attach Resources</Text>
        <Text variant="bodySmall" style={styles.helperText}>
          Share drill videos, documents, or images for your client to review. Resources are automatically added to their profile.
        </Text>
        <Searchbar
          placeholder="Search media library..."
          value={resourceSearch}
          onChangeText={setResourceSearch}
          style={styles.searchbar}
          loading={searchLoading}
        />
        {!resourceSearch && selectedResources.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="folder-open-outline" size={28} color={colors.textTertiary} />
            <Text variant="bodySmall" style={styles.emptyStateText}>Search your media library to attach resources</Text>
          </View>
        )}
        {searchResults.length > 0 && (
          <Card style={styles.searchResultsCard} mode="outlined">
            <FlatList
              data={searchResults}
              keyExtractor={item => String(item.id)}
              scrollEnabled={false}
              renderItem={renderSearchResultItem}
            />
          </Card>
        )}
        {selectedResources.length > 0 && (
          <View style={styles.chipRow}>
            {selectedResources.map(r => (
              <Chip key={r.id} onClose={() => handleRemoveResource(r.id)} style={styles.chip}>
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
              <View style={styles.toggleLabel}>
                <Text variant="bodyLarge">Include Curriculum Progress</Text>
                <Text variant="bodySmall" style={styles.helperText}>
                  Shows the client their overall program completion and recently completed lessons.
                </Text>
              </View>
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

        {/* Action buttons */}
        <View style={styles.composeActions}>
          <Button mode="outlined" icon="eye-outline" onPress={handlePreview} loading={previewLoading} disabled={previewLoading || isHtmlEmpty(coachMessage)} style={styles.composeActionButton}>
            Preview
          </Button>
          <Button mode="contained" icon="send" onPress={handleSend} loading={sending} disabled={sending || isHtmlEmpty(coachMessage)} buttonColor={colors.accent} textColor={colors.textInverse} style={styles.composeActionButton}>
            Send Recap
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LessonFeedbackScreen;
