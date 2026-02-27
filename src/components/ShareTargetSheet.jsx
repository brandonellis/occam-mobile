import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getClients, getClientGroups } from '../services/accounts.api';
import { shareTargetSheetStyles as styles } from '../styles/shareTargetSheet.styles';
import { colors } from '../theme';

const TABS = { CLIENTS: 'clients', GROUPS: 'groups' };

const ShareTargetSheet = ({ visible, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState(TABS.CLIENTS);
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTargets, setSelectedTargets] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientsRes, groupsRes] = await Promise.all([
        getClients(),
        getClientGroups(),
      ]);
      setClients(clientsRes?.data || clientsRes || []);
      setGroups(groupsRes?.data || groupsRes || []);
    } catch (err) {
      console.warn('Failed to load share targets:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadData();
      setSelectedTargets([]);
      setSearch('');
      setActiveTab(TABS.CLIENTS);
    }
  }, [visible, loadData]);

  const toggleTarget = useCallback((target) => {
    setSelectedTargets((prev) => {
      const exists = prev.find(
        (t) => t.id === target.id && t.type === target.type
      );
      if (exists) return prev.filter((t) => !(t.id === target.id && t.type === target.type));
      return [...prev, target];
    });
  }, []);

  const isSelected = useCallback(
    (id, type) => selectedTargets.some((t) => t.id === id && t.type === type),
    [selectedTargets]
  );

  const handleConfirm = useCallback(() => {
    if (selectedTargets.length > 0) {
      onSelect(selectedTargets);
    }
  }, [selectedTargets, onSelect]);

  const needle = search.toLowerCase().trim();

  const filteredClients = needle
    ? clients.filter((c) => {
        const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const email = (c.email || '').toLowerCase();
        return name.includes(needle) || email.includes(needle);
      })
    : clients;

  const filteredGroups = needle
    ? groups.filter((g) => (g.name || '').toLowerCase().includes(needle))
    : groups;

  const renderClientItem = ({ item }) => {
    const selected = isSelected(item.id, 'client');
    const name = `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email;
    const initials = `${(item.first_name || '')[0] || ''}${(item.last_name || '')[0] || ''}`.toUpperCase() || '?';

    return (
      <TouchableOpacity
        style={[styles.targetRow, selected && styles.targetRowSelected]}
        onPress={() => toggleTarget({ id: item.id, type: 'client', name })}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, selected && styles.avatarSelected]}>
          <Text style={[styles.avatarText, selected && styles.avatarTextSelected]}>
            {initials}
          </Text>
        </View>
        <View style={styles.targetInfo}>
          <Text style={styles.targetName} numberOfLines={1}>{name}</Text>
          {item.email && (
            <Text style={styles.targetMeta} numberOfLines={1}>{item.email}</Text>
          )}
        </View>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={selected ? colors.accent : colors.gray400}
        />
      </TouchableOpacity>
    );
  };

  const renderGroupItem = ({ item }) => {
    const selected = isSelected(item.id, 'group');
    const memberCount = item.members_count ?? item.members?.length ?? null;

    return (
      <TouchableOpacity
        style={[styles.targetRow, selected && styles.targetRowSelected]}
        onPress={() => toggleTarget({ id: item.id, type: 'group', name: item.name })}
        activeOpacity={0.7}
      >
        <View style={[styles.groupIcon, selected && styles.groupIconSelected]}>
          <Ionicons
            name="people"
            size={18}
            color={selected ? colors.white : colors.accent}
          />
        </View>
        <View style={styles.targetInfo}>
          <Text style={styles.targetName} numberOfLines={1}>{item.name}</Text>
          {memberCount != null && (
            <Text style={styles.targetMeta}>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </Text>
          )}
        </View>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={selected ? colors.accent : colors.gray400}
        />
      </TouchableOpacity>
    );
  };

  const data = activeTab === TABS.CLIENTS ? filteredClients : filteredGroups;
  const renderItem = activeTab === TABS.CLIENTS ? renderClientItem : renderGroupItem;
  const emptyLabel = activeTab === TABS.CLIENTS
    ? (needle ? 'No matching clients' : 'No clients found')
    : (needle ? 'No matching groups' : 'No groups found');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Video</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={selectedTargets.length === 0}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[
              styles.headerAction,
              selectedTargets.length === 0 && styles.headerActionDisabled,
            ]}>
              Share{selectedTargets.length > 0 ? ` (${selectedTargets.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === TABS.CLIENTS && styles.tabActive]}
            onPress={() => setActiveTab(TABS.CLIENTS)}
          >
            <Text style={[styles.tabText, activeTab === TABS.CLIENTS && styles.tabTextActive]}>
              Clients
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === TABS.GROUPS && styles.tabActive]}
            onPress={() => setActiveTab(TABS.GROUPS)}
          >
            <Text style={[styles.tabText, activeTab === TABS.GROUPS && styles.tabTextActive]}>
              Groups
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected chips */}
        {selectedTargets.length > 0 && (
          <View style={styles.selectedChips}>
            {selectedTargets.map((t) => (
              <TouchableOpacity
                key={`${t.type}-${t.id}`}
                style={styles.chip}
                onPress={() => toggleTarget(t)}
              >
                <Text style={styles.chipText} numberOfLines={1}>{t.name}</Text>
                <Ionicons name="close-circle" size={14} color={colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => `${activeTab}-${item.id}`}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{emptyLabel}</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};


export default ShareTargetSheet;
