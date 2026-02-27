import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  Text as RNText,
} from 'react-native';
import {
  Text,
  Searchbar,
  TextInput,
  ActivityIndicator,
  Badge,
  Button,
  Icon,
  ProgressBar,
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getUploads, uploadFile } from '../services/uploads.api';
import { mediaPickerStyles as styles } from '../styles/mediaPicker.styles';
import { colors } from '../theme';
import AuthImage from './AuthImage';

const MIME_ICON_MAP = {
  video: 'video',
  audio: 'music-note',
  default: 'file-document-outline',
};

const getMimeIcon = (mimeType) => {
  if (mimeType?.startsWith('video/')) return MIME_ICON_MAP.video;
  if (mimeType?.startsWith('audio/')) return MIME_ICON_MAP.audio;
  return MIME_ICON_MAP.default;
};

const MediaPickerModal = ({
  visible,
  onClose,
  onSelect,
  alreadySharedIds = [],
  isSharing = false,
}) => {
  const [uploads, setUploads] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackMessage, setSnackMessage] = useState('');

  const loadUploads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { is_library: 1, per_page: 50 };
      if (search.trim()) params.search = search.trim();
      const res = await getUploads(params);
      setUploads(res.data || []);
    } catch {
      setUploads([]);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (visible) {
      loadUploads();
      setSelectedUpload(null);
      setNotes('');
    }
  }, [visible, loadUploads]);

  const handleConfirm = useCallback(() => {
    if (!selectedUpload) return;
    onSelect({ upload_id: selectedUpload.id, notes: notes.trim() || null });
  }, [selectedUpload, notes, onSelect]);

  const handleUploadFromDevice = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload media.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        videoMaxDuration: 300,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const fileName = asset.fileName || asset.uri.split('/').pop() || 'upload';
      const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');

      setIsUploading(true);
      setUploadProgress(0);

      await uploadFile(asset.uri, {
        uploadableType: 'media_library',
        isLibrary: true,
        filename: fileName,
        mimeType,
        onProgress: (progress) => setUploadProgress(progress),
      });

      setSnackMessage('Upload complete');
      loadUploads();
    } catch (err) {
      console.warn('Upload failed:', err.message);
      Alert.alert('Upload Failed', err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [loadUploads]);

  const isAlreadyShared = (uploadId) => alreadySharedIds.includes(uploadId);

  const getThumbnail = (upload) => {
    if (upload.thumb_url) return upload.thumb_url;
    if (upload.url && upload.mime_type?.startsWith('image/')) return upload.url;
    return null;
  };

  const renderItem = ({ item }) => {
    const shared = isAlreadyShared(item.id);
    const selected = selectedUpload?.id === item.id;
    const thumb = getThumbnail(item);

    return (
      <TouchableOpacity
        style={[
          styles.mediaItem,
          selected && styles.mediaItemSelected,
          shared && styles.mediaItemDisabled,
        ]}
        onPress={() => {
          if (shared) return;
          setSelectedUpload(selected ? null : item);
        }}
        activeOpacity={shared ? 1 : 0.7}
        disabled={shared}
      >
        <View style={styles.mediaThumbnail}>
          {thumb ? (
            <AuthImage uri={thumb} style={styles.mediaThumbnailImage} resizeMode="cover" />
          ) : (
            <Icon
              source={getMimeIcon(item.mime_type)}
              size={24}
              color={colors.textTertiary}
            />
          )}
          {selected && (
            <View style={styles.selectedOverlay}>
              <Icon source="check-circle" size={24} color={colors.accent} />
            </View>
          )}
          {shared && (
            <Badge style={styles.sharedBadge} size={20}>
              Shared
            </Badge>
          )}
        </View>
        <Text variant="bodySmall" style={styles.mediaName} numberOfLines={1}>
          {item.original_filename || item.filename || 'Untitled'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={onClose}
            disabled={isSharing}
            compact
            labelStyle={styles.headerCancel}
          >
            Cancel
          </Button>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Media Library
          </Text>
          {isSharing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Button
              mode="text"
              onPress={handleConfirm}
              disabled={!selectedUpload}
              compact
              labelStyle={styles.headerDone}
            >
              Share
            </Button>
          )}
        </View>

        {/* Search + Upload row */}
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Search media..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchBarFlex}
            inputStyle={styles.searchInput}
            elevation={0}
          />
          <TouchableOpacity
            style={[styles.uploadButton, (isUploading || isSharing) && styles.uploadButtonDisabled]}
            onPress={handleUploadFromDevice}
            disabled={isUploading || isSharing}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Upload progress */}
        {isUploading && (
          <View style={styles.uploadProgressRow}>
            <RNText style={styles.uploadProgressText}>
              Uploading... {Math.round(uploadProgress * 100)}%
            </RNText>
            <ProgressBar
              progress={uploadProgress}
              color={colors.accent}
              style={styles.uploadProgressBar}
            />
          </View>
        )}

        {/* Notes input (when item selected) */}
        {selectedUpload && (
          <View style={styles.notesRow}>
            <TextInput
              mode="outlined"
              placeholder="Add a note (optional)..."
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
              dense
              style={styles.notesInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.accent}
            />
          </View>
        )}

        {/* Grid */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={uploads}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon source="image-multiple-outline" size={40} color={colors.textTertiary} />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No media found
                </Text>
              </View>
            }
          />
        )}

        <Snackbar
          visible={!!snackMessage}
          onDismiss={() => setSnackMessage('')}
          duration={2500}
          style={styles.snackbar}
        >
          {snackMessage}
        </Snackbar>
      </View>
    </Modal>
  );
};

export default MediaPickerModal;
