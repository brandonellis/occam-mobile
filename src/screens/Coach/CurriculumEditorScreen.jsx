import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import {
  getClientPerformanceCurriculum,
  toggleLesson,
  getModuleTemplates,
  storeClientModule,
  deleteClientModule,
  getCurriculumPackages,
  applyPackageToClient,
} from '../../services/accounts.api';
import { curriculumEditorStyles as styles } from '../../styles/curriculumEditor.styles';
import { globalStyles } from '../../styles/global.styles';
import { colors } from '../../theme';

const CurriculumEditorScreen = ({ route, navigation }) => {
  const { clientId, clientName } = route.params;

  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedModules, setExpandedModules] = useState({});

  // Add module modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [packages, setPackages] = useState([]);
  const [addTab, setAddTab] = useState('templates');
  const [isLoadingAdd, setIsLoadingAdd] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const loadCurriculum = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await getClientPerformanceCurriculum(clientId);
      const data = res.data;
      setModules(data?.modules || data || []);
    } catch (err) {
      console.warn('Failed to load curriculum:', err.message);
      setModules([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadCurriculum();
  }, [loadCurriculum]);

  const handleToggleLesson = useCallback(async (lessonId) => {
    // Find current state to determine new value
    let newCompleted = true;
    for (const mod of modules) {
      const lesson = (mod.lessons || []).find((l) => l.id === lessonId);
      if (lesson) {
        newCompleted = !lesson.completed;
        break;
      }
    }

    // Optimistic update — update UI first, rollback on error
    const previousModules = modules;
    setModules((prev) =>
      prev.map((mod) => ({
        ...mod,
        lessons: (mod.lessons || []).map((l) =>
          l.id === lessonId
            ? { ...l, completed: newCompleted }
            : l
        ),
      }))
    );
    try {
      await toggleLesson(clientId, lessonId, newCompleted);
    } catch (err) {
      console.warn('Failed to toggle lesson:', err.message);
      setModules(previousModules);
      Alert.alert('Error', 'Failed to update lesson.');
    }
  }, [clientId, modules]);

  const handleDeleteModule = useCallback((moduleId, moduleName) => {
    Alert.alert(
      'Remove Module',
      `Remove "${moduleName}" from this client's curriculum?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClientModule(clientId, moduleId);
              loadCurriculum(true);
            } catch (err) {
              console.warn('Failed to delete module:', err.message);
              Alert.alert('Error', 'Failed to remove module.');
            }
          },
        },
      ]
    );
  }, [clientId, loadCurriculum]);

  const toggleExpand = useCallback((moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  }, []);

  const handleOpenAddModal = useCallback(async () => {
    setShowAddModal(true);
    setIsLoadingAdd(true);
    try {
      const [templatesRes, packagesRes] = await Promise.allSettled([
        getModuleTemplates(),
        getCurriculumPackages(),
      ]);
      if (templatesRes.status === 'fulfilled') {
        setTemplates(templatesRes.value.data || []);
      }
      if (packagesRes.status === 'fulfilled') {
        setPackages(packagesRes.value.data || []);
      }
    } catch (err) {
      console.warn('Failed to load templates/packages:', err.message);
    } finally {
      setIsLoadingAdd(false);
    }
  }, []);

  const handleAddTemplate = useCallback(async (template) => {
    setIsApplying(true);
    try {
      await storeClientModule(clientId, {
        template_module_id: template.id,
        name: template.title || template.name,
        lessons: (template.lessons || []).map((l, i) => ({
          name: l.title || l.name,
          template_lesson_id: l.id,
          sort_order: i + 1,
        })),
      });
      setShowAddModal(false);
      loadCurriculum(true);
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to add module.'
      );
    } finally {
      setIsApplying(false);
    }
  }, [clientId, loadCurriculum]);

  const handleApplyPackage = useCallback(async (pkg) => {
    setIsApplying(true);
    try {
      await applyPackageToClient(clientId, pkg.id);
      setShowAddModal(false);
      loadCurriculum(true);
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to apply package.'
      );
    } finally {
      setIsApplying(false);
    }
  }, [clientId, loadCurriculum]);

  const renderModule = (mod) => {
    const lessons = mod.lessons || [];
    const completed = lessons.filter((l) => l.completed).length;
    const isExpanded = expandedModules[mod.id];
    const progress = lessons.length > 0 ? completed / lessons.length : 0;

    return (
      <View key={mod.id} style={styles.moduleCard}>
        <TouchableOpacity
          style={styles.moduleHeader}
          onPress={() => toggleExpand(mod.id)}
          activeOpacity={0.7}
        >
          <View style={styles.moduleHeaderLeft}>
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={colors.textSecondary}
            />
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleName}>{mod.title || mod.name}</Text>
              <Text style={styles.moduleProgress}>
                {completed} / {lessons.length} lessons
              </Text>
            </View>
          </View>
          <View style={styles.moduleActions}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteModule(mod.id, mod.title || mod.name)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isExpanded && lessons.length > 0 && (
          <View style={styles.lessonList}>
            {lessons.map((lesson) => {
              const isDone = !!lesson.completed;
              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.lessonRow}
                  onPress={() => handleToggleLesson(lesson.id)}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isDone ? colors.success : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.lessonName,
                      isDone && styles.lessonNameDone,
                    ]}
                  >
                    {lesson.title || lesson.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {isExpanded && lessons.length === 0 && (
          <View style={styles.emptyLessons}>
            <Text style={styles.emptyLessonsText}>No lessons in this module</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="Curriculum"
        subtitle={clientName}
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadCurriculum(true)}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.actionBar}>
            <Text style={styles.moduleCount}>
              {modules.length} module{modules.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleOpenAddModal}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={colors.accent} />
              <Text style={styles.addButtonText}>Add Module</Text>
            </TouchableOpacity>
          </View>

          {modules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Curriculum Yet</Text>
              <Text style={styles.emptyMessage}>
                Add modules from templates or apply a curriculum package.
              </Text>
            </View>
          ) : (
            modules.map(renderModule)
          )}
        </ScrollView>
      )}

      {/* Add Module / Package Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} disabled={isApplying}>
              <Text style={[styles.modalCancel, isApplying && { opacity: 0.3 }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add to Curriculum</Text>
            <View style={globalStyles.spacer50} />
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, addTab === 'templates' && styles.tabActive]}
              onPress={() => setAddTab('templates')}
            >
              <Text style={[styles.tabText, addTab === 'templates' && styles.tabTextActive]}>
                Templates
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, addTab === 'packages' && styles.tabActive]}
              onPress={() => setAddTab('packages')}
            >
              <Text style={[styles.tabText, addTab === 'packages' && styles.tabTextActive]}>
                Packages
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingAdd ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={addTab === 'templates' ? templates : packages}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.templateItem}
                  onPress={() =>
                    addTab === 'templates'
                      ? handleAddTemplate(item)
                      : handleApplyPackage(item)
                  }
                  disabled={isApplying}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{item.title || item.name}</Text>
                    {item.description && (
                      <Text style={styles.templateDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    {addTab === 'templates' && item.lessons?.length > 0 && (
                      <Text style={styles.templateModuleCount}>
                        {item.lessons.length} lesson{item.lessons.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                    {addTab === 'packages' && item.modules?.length > 0 && (
                      <Text style={styles.templateModuleCount}>
                        {item.modules.length} module{item.modules.length !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                  {isApplying ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="documents-outline" size={36} color={colors.textTertiary} />
                  <Text style={styles.emptyMessage}>
                    No {addTab === 'templates' ? 'templates' : 'packages'} available
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CurriculumEditorScreen;
