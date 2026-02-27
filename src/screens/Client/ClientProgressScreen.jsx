import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import {
  getClientPerformanceCurriculum,
  getClientPerformanceSnapshots,
  getClientSharedMedia,
} from '../../services/accounts.api';
import { progressStyles as styles } from '../../styles/progress.styles';
import { globalStyles } from '../../styles/global.styles';
import EmptyState from '../../components/EmptyState';
import { SCREENS } from '../../constants/navigation.constants';
import { colors } from '../../theme';

const TABS = { CURRICULUM: 'curriculum', REPORTS: 'reports', RESOURCES: 'resources' };

const ClientProgressScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const clientId = user?.id;

  const [activeTab, setActiveTab] = useState(
    route.params?.initialTab || TABS.CURRICULUM
  );

  // Switch tab on every focus when initialTab param is provided
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const tab = route.params?.initialTab;
      if (tab) {
        setActiveTab(tab);
        // Clear the param so returning to this tab later doesn't re-apply it
        navigation.setParams({ initialTab: undefined });
      }
    });
    return unsubscribe;
  }, [navigation, route.params?.initialTab]);
  const [curriculum, setCurriculum] = useState({ program: null, modules: [] });
  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }
    try {
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      if (activeTab === TABS.CURRICULUM) {
        const { data } = await getClientPerformanceCurriculum(clientId);
        setCurriculum({
          program: data?.program || null,
          modules: data?.modules || data || [],
        });
      } else if (activeTab === TABS.REPORTS) {
        const { data } = await getClientPerformanceSnapshots(clientId);
        setReports(data || []);
      } else {
        const { data } = await getClientSharedMedia(clientId);
        setResources(data || []);
      }
    } catch (err) {
      console.warn('Failed to load progress data:', err?.message || err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [clientId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCompletionPercent = (modules) => {
    if (!modules.length) return 0;
    let total = 0;
    let completed = 0;
    modules.forEach((mod) => {
      const lessons = mod.lessons || [];
      total += lessons.length;
      completed += lessons.filter((l) => l.completed || l.completed_at || l.is_completed).length;
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const renderCurriculum = () => {
    const { program, modules } = curriculum;
    const completion = getCompletionPercent(modules);

    if (modules.length === 0) {
      return (
        <EmptyState
          icon="school-outline"
          title="No Curriculum Yet"
          message="Your coach will assign curriculum modules to track your progress."
        />
      );
    }

    return (
      <>
        {program && (
          <View style={styles.programCard}>
            <Text style={styles.programName}>{program.name}</Text>
            <Text style={styles.programStatus}>
              {program.status === 'active' ? 'Active Program' : program.status}
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${completion}%` }]} />
            </View>
            <Text style={styles.progressText}>{completion}% complete</Text>
          </View>
        )}

        {modules.map((mod) => {
          const lessons = mod.lessons || [];
          const modCompleted = lessons.filter((l) => l.completed || l.completed_at || l.is_completed).length;
          return (
            <View key={mod.id} style={styles.moduleCard}>
              <Text style={styles.moduleName}>{mod.title || mod.name}</Text>
              <Text style={styles.moduleProgress}>
                {modCompleted} / {lessons.length} lessons
              </Text>
              {lessons.map((lesson) => {
                const done = lesson.completed || lesson.completed_at || lesson.is_completed;
                return (
                  <View key={lesson.id} style={styles.lessonRow}>
                    <Ionicons
                      name={done ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={done ? colors.success : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.lessonText,
                        done && styles.lessonTextComplete,
                      ]}
                    >
                      {lesson.title || lesson.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </>
    );
  };

  const renderReports = () => {
    if (reports.length === 0) {
      return (
        <EmptyState
          icon="bar-chart-outline"
          title="No Reports Yet"
          message="Your coach will share progress reports with you here."
        />
      );
    }

    return reports.map((report) => {
      const payload = report?.payload || {};
      const curriculumSummary = payload?.exact?.curriculum?.summary;
      const hasAssessment = !!payload?.exact?.assessment;
      const hasCurriculum = curriculumSummary?.total_lessons > 0;

      return (
        <TouchableOpacity
          key={report.id}
          style={styles.reportCard}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('HomeTab', {
              screen: SCREENS.PROGRESS_REPORT_DETAIL,
              params: { report },
            })
          }
        >
          <View style={styles.reportCardRow}>
            <View style={styles.reportCardContent}>
              <Text style={styles.reportTitle}>{report.title || 'Progress Report'}</Text>
              <Text style={styles.reportDate}>
                {new Date(report.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              {report.coach && (
                <Text style={styles.reportCoach}>
                  From {report.coach.first_name} {report.coach.last_name}
                </Text>
              )}
              {(hasCurriculum || hasAssessment) && (
                <Text style={styles.reportSummary}>
                  {[
                    hasCurriculum &&
                      `${curriculumSummary.completed_lessons}/${curriculumSummary.total_lessons} lessons completed`,
                    hasAssessment && 'Assessment scores',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderResources = () => {
    if (resources.length === 0) {
      return (
        <EmptyState
          icon="folder-open-outline"
          title="No Resources Yet"
          message="Videos and files shared by your coach will appear here."
        />
      );
    }

    return resources.map((resource) => {
      const mime = resource.mime_type || '';
      const isVideo = mime.startsWith('video/');
      const thumbUri = resource.thumbnail_url;
      const handlePress = isVideo && resource.url
        ? () => navigation.navigate('HomeTab', {
            screen: SCREENS.VIDEO_PLAYER,
            params: {
              videoUrl: resource.url,
              videoTitle: resource.filename || 'Video',
            },
          })
        : undefined;

      return (
        <TouchableOpacity
          key={resource.id}
          style={styles.resourceCard}
          onPress={handlePress}
          activeOpacity={handlePress ? 0.7 : 1}
          disabled={!handlePress}
        >
          {(thumbUri || (resource.url && mime.startsWith('image/'))) && (
            <View>
              <Image
                source={{ uri: thumbUri || resource.url }}
                style={styles.resourceThumbnail}
                resizeMode="cover"
              />
              {isVideo && (
                <View style={styles.resourcePlayOverlay}>
                  <Ionicons name="play-circle" size={40} color="rgba(255, 255, 255, 0.9)" />
                </View>
              )}
            </View>
          )}
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceName}>
              {resource.filename || 'Resource'}
            </Text>
            {resource.notes && (
              <Text style={styles.resourceNotes} numberOfLines={2}>
                {resource.notes}
              </Text>
            )}
            <View style={styles.resourceMeta}>
              {resource.shared_by && (
                <Text style={styles.resourceCoach}>
                  From {resource.shared_by.first_name}
                </Text>
              )}
              <Text style={styles.resourceDate}>
                {new Date(resource.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Progress</Text>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: TABS.CURRICULUM, label: 'Curriculum' },
          { key: TABS.REPORTS, label: 'Reports' },
          { key: TABS.RESOURCES, label: 'Resources' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={globalStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
              tintColor={colors.primary}
            />
          }
        >
          {activeTab === TABS.CURRICULUM && renderCurriculum()}
          {activeTab === TABS.REPORTS && renderReports()}
          {activeTab === TABS.RESOURCES && renderResources()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ClientProgressScreen;
