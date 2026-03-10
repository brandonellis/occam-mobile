import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { SCREENS } from '../../constants/navigation.constants';
import {
  getClientSharedMedia,
  unshareMediaFromClient,
} from '../../services/accounts.api';
import { clientDetailStyles as styles } from '../../styles/clientDetail.styles';
import { colors } from '../../theme';
import { resolveMediaUrl } from '../../helpers/media.helper';
import AuthImage from '../../components/AuthImage';
import logger from '../../helpers/logger.helper';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    if (mediaUrl) {
      navigation.navigate(SCREENS.VIDEO_PLAYER, {
        videoUrl: mediaUrl,
        videoTitle: item.filename || 'Video',
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
        <TouchableOpacity activeOpacity={0.8} onPress={handleVideoPress}>
          {thumbUrl ? (
            <View>
              <AuthImage
                uri={thumbUrl}
                style={styles.sharedMediaVideoContainer}
                resizeMode="cover"
              />
              <View style={styles.sharedMediaPlayOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          ) : (
            <View style={styles.sharedMediaVideoPlaceholder}>
              <MaterialCommunityIcons name="video" size={28} color={colors.textTertiary} />
              <View style={styles.sharedMediaPlayOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255,255,255,0.7)" />
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
            {item.filename || 'Resource'}
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
                style={{ margin: 0 }}
              />
              <IconButton
                icon="brush"
                size={18}
                iconColor={colors.accent}
                onPress={() =>
                  navigation.navigate(SCREENS.VIDEO_ANNOTATION, {
                    uploadId: item.upload_id,
                    videoUrl: mediaUrl,
                    videoTitle: item.filename || 'Video',
                    targetType: 'client',
                    targetId: clientId,
                  })
                }
                style={{ margin: 0 }}
              />
            </>
          )}
          <IconButton
            icon="close-circle-outline"
            size={20}
            iconColor={colors.error}
            onPress={() => onUnshare(item.id)}
            style={{ margin: 0 }}
          />
        </View>
      </View>
    </View>
  );
};

const ClientSharedMediaScreen = ({ route, navigation }) => {
  const { clientId, clientName } = route.params;
  const [sharedMedia, setSharedMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', undoData: null });
  const undoTimerRef = useRef(null);

  const loadMedia = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      const res = await getClientSharedMedia(clientId);
      setSharedMedia(res.data || []);
    } catch (err) {
      logger.warn('Failed to load shared media:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleUnshare = useCallback((sharedMediaId) => {
    const removedItem = sharedMedia.find((m) => m.id === sharedMediaId);
    if (!removedItem) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSharedMedia((prev) => prev.filter((m) => m.id !== sharedMediaId));

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    setSnackbar({
      visible: true,
      message: 'Resource removed',
      undoData: { sharedMediaId, removedItem },
    });

    undoTimerRef.current = setTimeout(async () => {
      try {
        await unshareMediaFromClient(clientId, sharedMediaId);
      } catch (err) {
        logger.warn('Failed to unshare media:', err.message);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSharedMedia((prev) => [...prev, removedItem].sort((a, b) => b.id - a.id));
        setSnackbar({ visible: false, message: '', undoData: null });
        Alert.alert('Error', 'Failed to remove shared resource.');
      }
    }, 3500);
  }, [clientId, sharedMedia]);

  const handleUndoUnshare = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const { undoData } = snackbar;
    if (undoData?.removedItem) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSharedMedia((prev) =>
        [...prev, undoData.removedItem].sort((a, b) => b.id - a.id)
      );
    }
    setSnackbar({ visible: false, message: '', undoData: null });
  }, [snackbar]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Shared Resources" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={clientName ? `${clientName}'s Resources` : 'Shared Resources'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadMedia(true)} />
        }
      >
        {sharedMedia.length === 0 ? (
          <View style={styles.emptyMini}>
            <Text style={styles.emptyMiniText}>No shared resources.</Text>
          </View>
        ) : (
          sharedMedia.map((item) => (
            <SharedMediaCard
              key={item.id}
              item={item}
              navigation={navigation}
              clientId={clientId}
              onUnshare={handleUnshare}
            />
          ))
        )}
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '', undoData: null })}
        duration={3000}
        action={{ label: 'Undo', onPress: handleUndoUnshare }}
        style={styles.snackbar}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
};

export default ClientSharedMediaScreen;
