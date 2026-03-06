import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { activityFeedStyles as styles } from '../styles/activityFeed.styles';
import { ACTIVITY_TYPE_CONFIG } from '../constants/activity.constants';
import { formatDateTimeInTz } from '../helpers/timezone.helper';
import AuthenticatedImage from './AuthenticatedImage';
import AuthenticatedVideo from './AuthenticatedVideo';
import { colors } from '../theme';
import { parseReportPayload } from '../helpers/report.helper';
import { reportCardStyles } from '../styles/reportSummary.styles';

const getCoachName = (item) => {
  const coach = item?.coach || item?.coaches?.[0] || item?.shared_by;
  if (!coach) return null;
  return `${coach.first_name || ''} ${coach.last_name || ''}`.trim();
};

const getServiceName = (item) => {
  const service = item?.service || item?.services?.[0];
  return service?.name || null;
};

const getThumbnailUrl = (item) => {
  if (item?.type === 'resource' && item?.resource_data) {
    const mime = item.resource_data.mime_type || '';
    if (mime.startsWith('image/')) {
      return item.resource_data.thumbnail_url || item.resource_data.url;
    }
    if (mime.startsWith('video/')) {
      return item.resource_data.thumbnail_url || null;
    }
  }
  return null;
};

const getVideoUrl = (item) => {
  if (item?.type === 'resource' && item?.resource_data) {
    const mime = item.resource_data.mime_type || '';
    if (mime.startsWith('video/')) {
      return item.resource_data.url || null;
    }
  }
  return null;
};

const isVideoResource = (item) => {
  if (item?.type !== 'resource') return false;
  const mime = item?.resource_data?.mime_type || '';
  return mime.startsWith('video/');
};

const ReportSummary = ({ payload, accentColor }) => {
  const { totalLessons, completedLessons, curriculumPct, scoreEntries } = parseReportPayload(payload);
  const displayScores = scoreEntries.slice(0, 4);

  if (totalLessons === 0 && displayScores.length === 0) return null;

  return (
    <View style={reportCardStyles.container}>
      {totalLessons > 0 && (
        <View style={reportCardStyles.section}>
          <View style={reportCardStyles.row}>
            <MaterialCommunityIcons name="school-outline" size={14} color={accentColor} />
            <Text style={reportCardStyles.label}>Curriculum</Text>
            <Text style={reportCardStyles.value}>{completedLessons}/{totalLessons} lessons</Text>
          </View>
          <View style={reportCardStyles.progressTrack}>
            <View style={[reportCardStyles.progressFill, { width: `${Math.round(curriculumPct * 100)}%`, backgroundColor: accentColor }]} />
          </View>
        </View>
      )}
      {displayScores.length > 0 && (
        <View style={reportCardStyles.section}>
          <View style={reportCardStyles.row}>
            <MaterialCommunityIcons name="chart-line" size={14} color={accentColor} />
            <Text style={reportCardStyles.label}>Assessment</Text>
          </View>
          <View style={reportCardStyles.scoresGrid}>
            {displayScores.map(([key, val]) => (
              <View key={key} style={reportCardStyles.scoreChip}>
                <Text style={reportCardStyles.scoreLabel} numberOfLines={1}>{key}</Text>
                <Text style={[reportCardStyles.scoreValue, { color: accentColor }]}>{typeof val === 'number' ? val.toFixed(1) : val}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};


const ActivityCard = ({ item, onPress, company }) => {
  const typeConfig = ACTIVITY_TYPE_CONFIG[item?.type];
  const accentColor = typeConfig?.color || colors.accent;
  const coachName = useMemo(() => getCoachName(item), [item]);
  const serviceName = useMemo(() => getServiceName(item), [item]);
  const thumbnailUrl = useMemo(() => getThumbnailUrl(item), [item]);
  const videoUrl = useMemo(() => getVideoUrl(item), [item]);
  const isVideo = useMemo(() => isVideoResource(item), [item]);
  const notesCount = item?.notes_count || 0;
  const tagsArray = Array.isArray(item?.tags) ? item.tags : [];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(item)}
    >
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

      <View style={styles.cardBody}>
        {/* Header row: icon + title + type badge */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardIconContainer, { backgroundColor: `${accentColor}15` }]}>
              <MaterialCommunityIcons
                name={typeConfig?.icon || 'circle-outline'}
                size={18}
                color={accentColor}
              />
            </View>
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item?.title || 'Untitled'}
              </Text>
              {item?.start_time && (
                <Text style={styles.cardMeta}>
                  {formatDateTimeInTz(item.start_time, company)}
                  {item?.status ? ` · ${item.status}` : ''}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.cardTypeBadge, { backgroundColor: `${accentColor}15` }]}>
            <Text style={[styles.cardTypeBadgeText, { color: accentColor }]}>
              {typeConfig?.singular || item?.type}
            </Text>
          </View>
        </View>

        {/* Description (truncated) */}
        {item?.description ? (
          <View style={styles.cardContent}>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        ) : null}

        {/* Progress report summary */}
        {item?.type === 'report' && item?.report_data?.payload ? (
          <ReportSummary payload={item.report_data.payload} accentColor={accentColor} />
        ) : null}

        {/* Service badge */}
        {serviceName ? (
          <View style={styles.cardServiceBadge}>
            <MaterialCommunityIcons name="tag-outline" size={12} color={colors.accent} />
            <Text style={styles.cardServiceText}>{serviceName}</Text>
          </View>
        ) : null}

        {/* Coach info */}
        {coachName ? (
          <View style={styles.coachRow}>
            <View style={styles.coachAvatar}>
              <Text style={styles.coachAvatarText}>
                {coachName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.coachName}>{coachName}</Text>
          </View>
        ) : null}

        {/* Media preview for resources */}
        {isVideo && videoUrl ? (
          <View style={styles.mediaPreview}>
            <AuthenticatedVideo
              uri={videoUrl}
              posterUri={thumbnailUrl}
              style={styles.mediaThumbnail}
              borderRadius={12}
            />
          </View>
        ) : thumbnailUrl ? (
          <View style={styles.mediaPreview}>
            <AuthenticatedImage
              uri={thumbnailUrl}
              style={styles.mediaThumbnail}
              resizeMode="cover"
              placeholderIcon="image-outline"
            />
          </View>
        ) : null}

        {/* Tags */}
        {tagsArray.length > 0 ? (
          <View style={styles.tagsRow}>
            {tagsArray.slice(0, 4).map((tag) => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>{tag.name}</Text>
              </View>
            ))}
            {tagsArray.length > 4 ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>+{tagsArray.length - 4}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Footer: notes count + time */}
        <View style={styles.cardFooter}>
          {notesCount > 0 ? (
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="chat-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.footerText}>
                {notesCount} {notesCount === 1 ? 'note' : 'notes'}
              </Text>
            </View>
          ) : null}
          {(videoUrl || thumbnailUrl) ? (
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name={isVideo ? 'video-outline' : 'image-outline'} size={14} color={colors.textTertiary} />
              <Text style={styles.footerText}>{isVideo ? 'Video' : 'Media'}</Text>
            </View>
          ) : null}
          <View style={styles.footerSpacer} />
          {item?.created_at ? (
            <Text style={styles.footerTime}>{formatDateTimeInTz(item.created_at, company)}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

export default React.memo(ActivityCard);
