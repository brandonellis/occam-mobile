import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SCREENS } from '../constants/navigation.constants';
import { clientDetailStyles as styles } from '../styles/clientDetail.styles';
import { colors } from '../theme';
import { resolveMediaUrl } from '../helpers/media.helper';
import AuthImage from './AuthImage';

const getDocIcon = (mime) => {
  if (mime.startsWith('application/pdf')) return 'file-document';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'grid';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
  return 'file-document-outline';
};

const SharedMediaCard = ({ item, navigation, onUnshare, clientId }) => {
  const mime = item.mime_type || '';
  const isVideo = mime.startsWith('video/');
  const isImage = mime.startsWith('image/');
  const mediaUrl = resolveMediaUrl(item.url);
  const thumbUrl = resolveMediaUrl(item.thumbnail_url);

  const handleVideoPress = () => {
    if (item.url) {
      navigation.navigate(SCREENS.VIDEO_PLAYER, {
        videoUrl: item.url,
        videoTitle: item.title || item.filename || 'Video',
        uploadId: item.upload_id,
        targetType: 'client',
        targetId: clientId,
      });
    }
  };

  return (
    <View style={styles.sharedMediaCard}>
      {isImage && mediaUrl && (
        <AuthImage
          uri={mediaUrl}
          style={styles.sharedMediaPreview}
          resizeMode="cover"
        />
      )}

      {isVideo && mediaUrl && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleVideoPress}
          accessibilityLabel={`Play ${item.title || item.filename || 'video'}`}
          accessibilityRole="button"
        >
          {thumbUrl ? (
            <View>
              <AuthImage
                uri={thumbUrl}
                style={styles.sharedMediaVideoContainer}
                resizeMode="cover"
              />
              <View style={styles.sharedMediaPlayOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color={colors.textInverse} />
              </View>
            </View>
          ) : (
            <View style={styles.sharedMediaVideoPlaceholder}>
              <MaterialCommunityIcons name="video" size={28} color={colors.textTertiary} />
              <View style={styles.sharedMediaPlayOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color={colors.textInverseSecondary} />
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {!isImage && !isVideo && (
        <View style={styles.sharedMediaDocPlaceholder}>
          <MaterialCommunityIcons name={getDocIcon(mime)} size={28} color={colors.textTertiary} />
          <Text style={styles.sharedMediaDocType}>
            {mime.split('/').pop()?.toUpperCase() || 'FILE'}
          </Text>
        </View>
      )}

      <View style={styles.sharedMediaInfoRow}>
        <View style={styles.sharedMediaInfo}>
          <Text style={styles.sharedItemName} numberOfLines={1}>
            {item.title || item.filename || 'Resource'}
          </Text>
          {item.notes && (
            <Text style={styles.sharedItemNotes} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
        </View>
        <View style={styles.sharedMediaActions}>
          {isVideo && mediaUrl && (
            <>
              <IconButton
                icon="play-circle-outline"
                size={20}
                iconColor={colors.accent}
                onPress={handleVideoPress}
                accessibilityLabel="Play video"
                style={styles.sharedMediaActionButton}
              />
              <IconButton
                icon="brush"
                size={18}
                iconColor={colors.accent}
                onPress={() =>
                  navigation.navigate(SCREENS.VIDEO_ANNOTATION, {
                    uploadId: item.upload_id,
                    videoUrl: item.url,
                    videoTitle: item.title || item.filename || 'Video',
                    targetType: 'client',
                    targetId: clientId,
                  })
                }
                accessibilityLabel="Annotate video"
                style={styles.sharedMediaActionButton}
              />
            </>
          )}
          <IconButton
            icon="close-circle-outline"
            size={20}
            iconColor={colors.error}
            onPress={() => onUnshare(item.id)}
            accessibilityLabel="Remove shared media"
            style={styles.sharedMediaActionButton}
          />
        </View>
      </View>
    </View>
  );
};

export default SharedMediaCard;
