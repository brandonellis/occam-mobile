/**
 * Parses a progress report payload into structured data for display.
 * Used by both ActivityCard (compact summary) and ActivityDetailSheet (full detail).
 *
 * @param {Object} payload - The report_data.payload object
 * @returns {{ modules: Array, totalLessons: number, completedLessons: number, curriculumPct: number, latestAssessment: Object|null, scoreEntries: Array }}
 */
export const parseReportPayload = (payload) => {
  const data = payload && typeof payload === 'object' ? payload : null;

  // Curriculum modules & lessons
  const modules = data?.exact?.curriculum?.modules;
  const allLessons = Array.isArray(modules)
    ? modules.flatMap((m) => (Array.isArray(m?.lessons) ? m.lessons : []))
    : [];
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l?.completed).length;
  const curriculumPct = totalLessons > 0 ? completedLessons / totalLessons : 0;

  // Assessment scores (latest)
  const assessments = data?.comparison?.assessments;
  const latestAssessment =
    Array.isArray(assessments) && assessments.length > 0
      ? assessments[assessments.length - 1]
      : null;
  const scores =
    latestAssessment?.scores && typeof latestAssessment.scores === 'object'
      ? latestAssessment.scores
      : null;
  const scoreEntries = scores ? Object.entries(scores) : [];

  return {
    modules: Array.isArray(modules) ? modules : [],
    totalLessons,
    completedLessons,
    curriculumPct,
    latestAssessment,
    scoreEntries,
  };
};
