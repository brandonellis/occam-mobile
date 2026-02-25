import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import {
  Text,
  Searchbar,
  TextInput,
  ActivityIndicator,
  Badge,
  Button,
  Icon,
} from 'react-native-paper';
import { getUploads } from '../services/uploads.api';
import { mediaPickerStyles as styles } from '../styles/mediaPicker.styles';
import { colors } from '../theme';

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
            <Image source={{ uri: thumb }} style={styles.mediaThumbnailImage} />
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

        {/* Search */}
        <Searchbar
          placeholder="Search media..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          elevation={0}
        />

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
      </View>
    </Modal>
  );
};

export default MediaPickerModal;
