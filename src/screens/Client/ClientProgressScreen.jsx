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
import { colors } from '../../theme';

const TABS = { CURRICULUM: 'curriculum', REPORTS: 'reports', RESOURCES: 'resources' };

const ClientProgressScreen = () => {
  const { user } = useAuth();
  const clientId = user?.id;

  const [activeTab, setActiveTab] = useState(TABS.CURRICULUM);
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
    } catch {
      // Silently handle — empty state will show
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

    return reports.map((report) => (
      <View key={report.id} style={styles.reportCard}>
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
      </View>
    ));
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

    return resources.map((resource) => (
      <View key={resource.id} style={styles.resourceCard}>
        {resource.upload?.thumbnail_url && (
          <Image
            source={{ uri: resource.upload.thumbnail_url }}
            style={styles.resourceThumbnail}
            resizeMode="cover"
          />
        )}
        <View style={styles.resourceInfo}>
          <Text style={styles.resourceName}>
            {resource.upload?.original_name || 'Resource'}
          </Text>
          {resource.notes && (
            <Text style={styles.resourceNotes} numberOfLines={2}>
              {resource.notes}
            </Text>
          )}
          <View style={styles.resourceMeta}>
            {resource.shared_by_user && (
              <Text style={styles.resourceCoach}>
                From {resource.shared_by_user.first_name}
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
      </View>
    ));
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
