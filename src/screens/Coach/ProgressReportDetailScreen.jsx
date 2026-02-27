import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { progressReportDetailStyles as styles } from '../../styles/progressReportDetail.styles';

const ProgressReportDetailScreen = ({ navigation, route }) => {
  const { report } = route.params || {};
  const payload = report?.payload || {};
  const curriculum = payload?.exact?.curriculum || {};
  const summary = curriculum?.summary || {};
  const modules = curriculum?.modules || [];
  const assessment = payload?.exact?.assessment || null;
  const deltas = payload?.comparison?.deltas || {};
  const program = payload?.program || null;

  const coachName = report?.coach
    ? `${report.coach.first_name || ''} ${report.coach.last_name || ''}`.trim()
    : null;

  const createdAt = report?.created_at
    ? new Date(report.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const totalLessons = summary.total_lessons || 0;
  const completedLessons = summary.completed_lessons || 0;
  const completionPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {report?.title || 'Progress Report'}
          </Text>
          <Text style={styles.headerMeta}>
            {[createdAt, coachName && `Coach: ${coachName}`]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {program && (
          <View style={styles.programBadge}>
            <Ionicons name="flag-outline" size={14} color={colors.accent} />
            <Text style={styles.programBadgeText}>{program.name}</Text>
          </View>
        )}

        {/* Curriculum Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Curriculum</Text>
          </View>

          {modules.length > 0 ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryPercent}>{completionPercent}%</Text>
                <Text style={styles.summaryLabel}>
                  completed ({completedLessons}/{totalLessons} lessons)
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${completionPercent}%` },
                  ]}
                />
              </View>

              {modules.map((mod) => {
                const lessons = mod.lessons || [];
                const done = lessons.filter((l) => l.completed).length;
                return (
                  <View key={mod.id} style={styles.moduleCard}>
                    <View style={styles.moduleHeader}>
                      <Text style={styles.moduleName}>{mod.title}</Text>
                      <Text style={styles.moduleCount}>
                        {done}/{lessons.length}
                      </Text>
                    </View>
                    {mod.notes ? (
                      <Text style={styles.moduleNotes}>{mod.notes}</Text>
                    ) : null}
                    {lessons.map((lesson) => {
                      const isComplete = lesson.completed;
                      return (
                        <View key={lesson.id} style={styles.lessonRow}>
                          <Ionicons
                            name={
                              isComplete
                                ? 'checkmark-circle'
                                : 'ellipse-outline'
                            }
                            size={16}
                            color={
                              isComplete ? colors.success : colors.textTertiary
                            }
                          />
                          <Text
                            style={[
                              styles.lessonText,
                              isComplete && styles.lessonTextComplete,
                            ]}
                          >
                            {lesson.title}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                No curriculum data in this report
              </Text>
            </View>
          )}
        </View>

        {/* Assessment Section */}
        {assessment && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="bar-chart-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.sectionTitle}>Assessment Scores</Text>
            </View>

            {Object.entries(assessment.scores || {}).map(([key, score], index, arr) => {
              const delta = deltas?.scores?.[key];
              const safeScore =
                typeof score === 'number' ? score : Number(score);
              const displayScore = Number.isFinite(safeScore) ? safeScore : null;
              const isLast = index === arr.length - 1;

              return (
                <View
                  key={key}
                  style={[styles.scoreRow, isLast && styles.scoreRowLast]}
                >
                  <Text style={styles.scoreLabel}>{key}</Text>
                  <View style={styles.scoreBarWrap}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        {
                          width: `${((displayScore || 0) / 10) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.scoreValue}>
                    {displayScore !== null ? displayScore : '--'}
                  </Text>
                  <View style={styles.scoreDelta}>
                    {delta != null && delta !== 0 && (
                      <Ionicons
                        name={delta > 0 ? 'trending-up' : 'trending-down'}
                        size={14}
                        color={delta > 0 ? colors.success : colors.error}
                      />
                    )}
                  </View>
                </View>
              );
            })}

            {assessment.overall_score != null && (
              <View style={styles.overallRow}>
                <Text style={styles.overallLabel}>Overall</Text>
                <View style={styles.overallDelta}>
                  <Text style={styles.overallValue}>
                    {Number(assessment.overall_score).toFixed(1)}
                  </Text>
                  {deltas?.overall_score != null &&
                    deltas.overall_score !== 0 && (
                      <Ionicons
                        name={
                          deltas.overall_score > 0
                            ? 'trending-up'
                            : 'trending-down'
                        }
                        size={16}
                        color={
                          deltas.overall_score > 0
                            ? colors.success
                            : colors.error
                        }
                      />
                    )}
                </View>
              </View>
            )}

            {assessment.notes ? (
              <Text style={styles.assessmentNotes}>{assessment.notes}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProgressReportDetailScreen;
