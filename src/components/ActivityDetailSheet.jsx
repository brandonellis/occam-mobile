import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activityFeedStyles as styles } from '../styles/activityFeed.styles';
import { ACTIVITY_TYPE_CONFIG } from '../constants/activity.constants';
import AuthenticatedImage from './AuthenticatedImage';
import AuthenticatedVideo from './AuthenticatedVideo';
import { getFeedItemNotes, addFeedItemNote } from '../services/activity.api';
import useAuth from '../hooks/useAuth';
import { colors } from '../theme';
import { spacing } from '../theme/spacing';
import { parseReportPayload } from '../helpers/report.helper';
import { reportDetailStyles } from '../styles/reportSummary.styles';
import { SCREENS } from '../constants/navigation.constants';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = mins < 10 ? `0${mins}` : mins;
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${h}:${m} ${ampm}`;
};

const extractNumericId = (itemId) => {
  const str = String(itemId);
  const parts = str.split('_');
  return parts.length > 1 ? Number(parts[parts.length - 1]) : Number(str);
};

const isUrl = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /^https?:\/\//i.test(text.trim()) || /^www\./i.test(text.trim());
};

const resolveUploadUrl = (upload) => {
  return upload?.file_url || upload?.url || null;
};

const isImageUpload = (upload) => {
  const mime = upload?.mime_type || '';
  return mime.startsWith('image/');
};

const isVideoUpload = (upload) => {
  const mime = upload?.mime_type || '';
  return mime.startsWith('video/');
};

const isAudioUpload = (upload) => {
  const mime = upload?.mime_type || '';
  return mime.startsWith('audio/');
};

const NoteItem = ({ note }) => {
  const authorName = note?.created_by_name || 'Coach';
  const initials = authorName.charAt(0).toUpperCase();
  const noteText = (note?.note || '').trim();
  const isPlaceholder = noteText && ['voice note', 'image', 'video'].includes(noteText.toLowerCase());
  const uploads = Array.isArray(note?.uploads) ? note.uploads : [];

  return (
    <View style={styles.noteItem}>
      <View style={styles.noteAvatar}>
        <Text style={styles.noteAvatarText}>{initials}</Text>
      </View>
      <View style={styles.noteBubble}>
        <Text style={styles.noteAuthor}>{authorName}</Text>
        {noteText && !isPlaceholder && !isUrl(noteText) ? (
          <Text style={styles.noteText}>{noteText}</Text>
        ) : null}
        {noteText && isUrl(noteText) ? (
          <TouchableOpacity onPress={() => Linking.openURL(noteText.match(/^https?:\/\//i) ? noteText : `https://${noteText}`)}>
            <Text style={[styles.noteText, { color: colors.accent, textDecorationLine: 'underline' }]} numberOfLines={2}>
              {noteText}
            </Text>
          </TouchableOpacity>
        ) : null}
        {uploads.filter(isImageUpload).map((upload) => (
          <AuthenticatedImage
            key={upload.id}
            uri={resolveUploadUrl(upload)}
            style={{ width: '100%', height: 180, borderRadius: 8, marginTop: spacing.sm }}
            resizeMode="cover"
          />
        ))}
        {uploads.filter(isVideoUpload).map((upload) => (
          <TouchableOpacity
            key={upload.id}
            style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.gray100, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              const url = resolveUploadUrl(upload);
              if (url) Linking.openURL(url);
            }}
          >
            <MaterialCommunityIcons name="video-outline" size={18} color={colors.accent} />
            <Text style={[styles.noteText, { marginTop: 0, marginLeft: spacing.sm, color: colors.accent }]}>
              {upload?.file_name || 'Video'}
            </Text>
          </TouchableOpacity>
        ))}
        {uploads.filter(isAudioUpload).map((upload) => (
          <TouchableOpacity
            key={upload.id}
            style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.gray100, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => {
              const url = resolveUploadUrl(upload);
              if (url) Linking.openURL(url);
            }}
          >
            <MaterialCommunityIcons name="music-note-outline" size={18} color={colors.accent} />
            <Text style={[styles.noteText, { marginTop: 0, marginLeft: spacing.sm, color: colors.accent }]}>
              Voice note
            </Text>
          </TouchableOpacity>
        ))}
        {note?.created_at ? (
          <Text style={styles.noteTime}>{formatDateTime(note.created_at)}</Text>
        ) : null}
      </View>
    </View>
  );
};

const ReportDetailSection = ({ reportData, accentColor, title }) => {
  const {
    modules,
    totalLessons,
    completedLessons,
    curriculumPct,
    latestAssessment: latest,
    scoreEntries,
  } = parseReportPayload(reportData?.payload);

  return (
    <View style={reportDetailStyles.container}>
      {/* Header */}
      <View style={reportDetailStyles.header}>
        <MaterialCommunityIcons name="chart-line" size={22} color={accentColor} />
        <Text style={reportDetailStyles.headerTitle}>{title || 'Progress Report'}</Text>
      </View>
      {reportData.coach ? (
        <Text style={reportDetailStyles.coachText}>
          By {reportData.coach.first_name} {reportData.coach.last_name}
        </Text>
      ) : null}

      {/* Curriculum progress */}
      {totalLessons > 0 && (
        <View style={reportDetailStyles.section}>
          <View style={reportDetailStyles.sectionHeader}>
            <MaterialCommunityIcons name="school-outline" size={16} color={accentColor} />
            <Text style={reportDetailStyles.sectionTitle}>Curriculum Progress</Text>
            <Text style={reportDetailStyles.sectionValue}>{completedLessons}/{totalLessons}</Text>
          </View>
          <View style={reportDetailStyles.progressTrack}>
            <View style={[reportDetailStyles.progressFill, { width: `${Math.round(curriculumPct * 100)}%`, backgroundColor: accentColor }]} />
          </View>
          {/* Module breakdown */}
          {modules.map((mod, idx) => {
            const lessons = Array.isArray(mod?.lessons) ? mod.lessons : [];
            const done = lessons.filter((l) => l?.completed).length;
            return (
              <View key={mod?.id || `module-${idx}`} style={reportDetailStyles.moduleRow}>
                <Text style={reportDetailStyles.moduleTitle} numberOfLines={1}>{mod?.title || 'Module'}</Text>
                <Text style={reportDetailStyles.moduleCount}>{done}/{lessons.length}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Assessment scores */}
      {scoreEntries.length > 0 && (
        <View style={reportDetailStyles.section}>
          <View style={reportDetailStyles.sectionHeader}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={16} color={accentColor} />
            <Text style={reportDetailStyles.sectionTitle}>Latest Assessment</Text>
          </View>
          {latest?.assessed_at ? (
            <Text style={reportDetailStyles.assessmentDate}>
              {new Date(latest.assessed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          ) : null}
          <View style={reportDetailStyles.scoresGrid}>
            {scoreEntries.map(([key, val]) => (
              <View key={key} style={reportDetailStyles.scoreCard}>
                <Text style={reportDetailStyles.scoreLabel} numberOfLines={1}>{key}</Text>
                <Text style={[reportDetailStyles.scoreValue, { color: accentColor }]}>
                  {typeof val === 'number' ? val.toFixed(1) : val}
                </Text>
                <View style={reportDetailStyles.scoreBar}>
                  <View style={[reportDetailStyles.scoreBarFill, { width: `${Math.min(100, (typeof val === 'number' ? val : 0) * 10)}%`, backgroundColor: accentColor }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Fallback when no structured data */}
      {totalLessons === 0 && scoreEntries.length === 0 && (
        <Text style={reportDetailStyles.emptyText}>No detailed data available for this report.</Text>
      )}
    </View>
  );
};


const ActivityDetailSheet = ({ item, visible, onClose }) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef(null);

  const typeConfig = ACTIVITY_TYPE_CONFIG[item?.type];
  const accentColor = typeConfig?.color || colors.accent;

  const loadNotes = useCallback(async () => {
    if (!item?.id || !item?.type) return;
    setLoadingNotes(true);
    try {
      const numericId = extractNumericId(item.id);
      const fetched = await getFeedItemNotes(item.type, numericId);
      setNotes(Array.isArray(fetched) ? fetched : []);
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, [item?.id, item?.type]);

  useEffect(() => {
    if (visible && item) {
      loadNotes();
    }
    if (!visible) {
      setNotes([]);
      setCommentText('');
    }
  }, [visible, item, loadNotes]);

  const handleSubmitComment = useCallback(async () => {
    const text = commentText.trim();
    if (!text || submitting || !item?.id || !item?.type) return;

    setSubmitting(true);
    try {
      const numericId = extractNumericId(item.id);
      const savedNote = await addFeedItemNote(item.type, numericId, { note: text });

      // Optimistic: add the new note to the list immediately
      const optimisticNote = {
        id: savedNote?.id || Date.now(),
        note: text,
        created_by_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'You',
        created_at: new Date().toISOString(),
        uploads: [],
        ...savedNote,
      };
      setNotes((prev) => [...prev, optimisticNote]);
      setCommentText('');

      // Scroll to bottom after adding
      setTimeout(() => {
        scrollRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    } catch {
      // silently fail — user can retry
    } finally {
      setSubmitting(false);
    }
  }, [commentText, submitting, item?.id, item?.type, user]);

  if (!item) return null;

  const coachName = (() => {
    const coach = item?.coach || item?.coaches?.[0] || item?.shared_by;
    if (!coach) return null;
    return `${coach.first_name || ''} ${coach.last_name || ''}`.trim();
  })();

  const serviceName = item?.service?.name || item?.services?.[0]?.name || null;
  const tagsArray = Array.isArray(item?.tags) ? item.tags : [];
  const resourceData = item?.resource_data;
  const reportData = item?.report_data;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: `${accentColor}15`, marginRight: spacing.md }]}>
            <MaterialCommunityIcons name={typeConfig?.icon || 'circle-outline'} size={20} color={accentColor} />
          </View>
          <Text style={styles.sheetTitle} numberOfLines={2}>{item.title || 'Activity'}</Text>
          <TouchableOpacity style={styles.sheetClose} onPress={onClose} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: spacing.xxxl * 2 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sheetBody}>
            {/* Meta info */}
            <View style={styles.sheetSection}>
              {item.start_time ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textTertiary} />
                  <Text style={[styles.cardMeta, { marginLeft: spacing.sm, marginTop: 0 }]}>
                    {formatDateTime(item.start_time)}
                  </Text>
                </View>
              ) : null}
              {item.created_at && !item.start_time ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textTertiary} />
                  <Text style={[styles.cardMeta, { marginLeft: spacing.sm, marginTop: 0 }]}>
                    {formatDateTime(item.created_at)}
                  </Text>
                </View>
              ) : null}
              {coachName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <MaterialCommunityIcons name="account-outline" size={16} color={colors.textTertiary} />
                  <Text style={[styles.cardMeta, { marginLeft: spacing.sm, marginTop: 0, fontWeight: '500' }]}>
                    {coachName}
                  </Text>
                </View>
              ) : null}
              {serviceName ? (
                <View style={styles.cardServiceBadge}>
                  <MaterialCommunityIcons name="tag-outline" size={12} color={colors.accent} />
                  <Text style={styles.cardServiceText}>{serviceName}</Text>
                </View>
              ) : null}
              {item.status ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
                  <Text style={[styles.cardMeta, { marginLeft: spacing.sm, marginTop: 0, color: colors.success }]}>
                    {item.status}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Description */}
            {item.description ? (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>DESCRIPTION</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
              </View>
            ) : null}

            {/* Resource media */}
            {resourceData?.url ? (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>MEDIA</Text>
                {resourceData.mime_type?.startsWith('image/') ? (
                  <AuthenticatedImage
                    uri={resourceData.url}
                    style={{ width: '100%', height: 240, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : resourceData.mime_type?.startsWith('video/') ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      onClose();
                      setTimeout(() => {
                        navigation.navigate(SCREENS.VIDEO_PLAYER, {
                          videoUrl: resourceData.url,
                          videoTitle: resourceData.filename || 'Video',
                          uploadId: resourceData.upload_id || undefined,
                        });
                      }, 300);
                    }}
                  >
                    <AuthenticatedVideo
                      uri={resourceData.url}
                      posterUri={resourceData.thumbnail_url || undefined}
                      style={{ width: '100%', height: 240 }}
                      borderRadius={12}
                    />
                    <View style={styles.videoFullscreenBadge}>
                      <MaterialCommunityIcons name="fullscreen" size={16} color={colors.white} />
                      <Text style={styles.videoFullscreenBadgeText}>Full Screen</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={{ backgroundColor: colors.gray100, borderRadius: 12, padding: spacing.lg, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => Linking.openURL(resourceData.url)}
                  >
                    <MaterialCommunityIcons name="file-document-outline" size={24} color={colors.accent} />
                    <View style={{ marginLeft: spacing.md, flex: 1 }}>
                      <Text style={styles.cardTitle}>{resourceData.filename || 'File'}</Text>
                      <Text style={styles.cardMeta}>Tap to open</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* Report data */}
            {reportData ? (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>PROGRESS REPORT</Text>
                <ReportDetailSection reportData={reportData} accentColor={accentColor} title={item.title} />
              </View>
            ) : null}

            {/* Tags */}
            {tagsArray.length > 0 ? (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>TAGS</Text>
                <View style={styles.tagsRow}>
                  {tagsArray.map((tag) => (
                    <View key={tag.id} style={styles.tag}>
                      <Text style={styles.tagText}>{tag.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Notes */}
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionTitle}>
                NOTES {notes.length > 0 ? `(${notes.length})` : ''}
              </Text>
              {loadingNotes ? (
                <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : notes.length > 0 ? (
                notes.map((note) => <NoteItem key={note.id || note.uuid} note={note} />)
              ) : (
                <Text style={[styles.cardDescription, { fontStyle: 'italic' }]}>
                  No notes yet
                </Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Comment composer bar */}
        <SafeAreaView edges={['bottom']} style={styles.composerSafeArea}>
          <View style={styles.composerBar}>
            <TextInput
              style={styles.composerInput}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textTertiary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={2000}
              editable={!submitting}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.composerSend,
                (!commentText.trim() || submitting) && styles.composerSendDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color={colors.textInverse} />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default React.memo(ActivityDetailSheet);
