/**
 * Progress & Analytics Intelligence Engine
 * Modern Placement Launchpad - Phase 12
 * 
 * Provides pure, data-grounded analytics calculations across all platform domains:
 * - Placement Readiness progression & 7-pillar breakdown
 * - Historical readiness trend analysis
 * - Real activity timeline intelligence
 * - Skill gap & proficiency shifts (Phase 4 thresholds)
 * - Personalized learning progression & milestones
 * - Assessment performance distributions & attempt deltas
 * - Resume ATS and Mock Interview competency audits
 * - Application recruitment funnel conversions (zero-denominator safe)
 * - Transparent, grounded improvement insights
 * 
 * ZERO FABRICATED SCORES. ZERO FAKE TRENDS. ZERO HARDCODED DEMO STATS.
 */

import { READINESS_PILLARS, computePlacementReadiness } from './placementReadinessEngine.js';
import { calculateApplicationStatistics } from './applicationPipelineEngine.js';

// Phase 4 Skill Proficiency Thresholds
export const SKILL_THRESHOLDS = {
  STRONG: { min: 80, label: 'Strong Competency', color: 'emerald' },
  NEEDS_IMPROVEMENT: { min: 60, max: 79, label: 'Needs Improvement', color: 'amber' },
  CRITICAL_GAP: { max: 59, label: 'Critical Gap', color: 'rose' }
};

// Period Filter Constants (in Days)
export const PERIOD_FILTERS = {
  '7d': { id: '7d', label: '7 Days', days: 7 },
  '30d': { id: '30d', label: '30 Days', days: 30 },
  '90d': { id: '90d', label: '90 Days', days: 90 },
  'all': { id: 'all', label: 'All Time', days: null }
};

/**
 * Filters any collection of objects by a timestamp field and period identifier.
 */
export function filterDataByPeriod(items, timestampField = 'created_at', period = 'all') {
  if (!Array.isArray(items) || items.length === 0) return [];
  const filterConfig = PERIOD_FILTERS[period] || PERIOD_FILTERS.all;
  if (!filterConfig.days) return [...items];

  const now = Date.now();
  const cutoffMs = now - (filterConfig.days * 24 * 60 * 60 * 1000);

  return items.filter(item => {
    const rawDate = item[timestampField] || item.timestamp || item.created_at || item.updated_at;
    if (!rawDate) return false;
    const timeMs = new Date(rawDate).getTime();
    return !isNaN(timeMs) && timeMs >= cutoffMs;
  });
}

/**
 * 1. Progress Overview Metrics
 * Aggregates high-level candidate milestones across all 7 placement pillars.
 */
export function computeProgressOverview({
  readinessReport,
  learningPaths = [],
  courses = [],
  courseProgress = [],
  attempts = [],
  userSkills = [],
  resumes = [],
  interviews = [],
  applications = []
}) {
  // A. Learning Roadmap
  const totalMilestones = learningPaths.length;
  const completedMilestones = learningPaths.filter(lp => lp.completed).length;
  const roadmapPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : null;

  // B. Course Progress
  const enrolledCount = courseProgress.length;
  let avgCourseProgress = null;
  if (enrolledCount > 0) {
    const sumProgress = courseProgress.reduce((sum, cp) => sum + (Number(cp.progress_percent) || 0), 0);
    avgCourseProgress = Math.round(sumProgress / enrolledCount);
  }

  // C. Assessments
  const passedAttempts = attempts.filter(a => a.passed || Number(a.score_percent) >= 70);

  // D. Skills
  const skillsCount = userSkills.length;
  const masteredSkills = userSkills.filter(s => Number(s.proficiency_percent) >= 80).length;

  // E. Resume ATS
  const latestResume = resumes && resumes.length > 0 ? resumes[0] : null;
  const atsScore = latestResume?.ats_score !== undefined && latestResume?.ats_score !== null 
    ? Number(latestResume.ats_score) 
    : (latestResume?.atsScore !== undefined && latestResume?.atsScore !== null ? Number(latestResume.atsScore) : null);

  // F. Mock Interview
  const latestInterview = interviews && interviews.length > 0 ? interviews[0] : null;
  const interviewScore = latestInterview?.overall_score !== undefined && latestInterview?.overall_score !== null
    ? Number(latestInterview.overall_score)
    : (latestInterview?.overallScore !== undefined && latestInterview?.overallScore !== null ? Number(latestInterview.overallScore) : null);

  // G. Application Pipeline
  const activeApps = applications.filter(a => !['rejected', 'withdrawn', 'selected'].includes(a.status?.toLowerCase())).length;

  return {
    readinessScore: readinessReport?.score ?? null,
    readinessStatus: readinessReport?.status || 'In Progress',
    evaluatedPillarsCount: readinessReport?.pillars ? readinessReport.pillars.filter(p => p.available).length : 0,
    totalPillarsCount: READINESS_PILLARS.length,
    roadmap: {
      completed: completedMilestones,
      total: totalMilestones,
      percentage: roadmapPercent,
      hasData: totalMilestones > 0
    },
    courses: {
      enrolled: enrolledCount,
      avgProgress: avgCourseProgress,
      hasData: enrolledCount > 0
    },
    assessments: {
      totalAttempts: attempts.length,
      passedCount: passedAttempts.length,
      hasData: attempts.length > 0
    },
    skills: {
      evaluatedCount: skillsCount,
      masteredCount: masteredSkills,
      hasData: skillsCount > 0
    },
    resume: {
      latestScore: atsScore,
      hasData: atsScore !== null
    },
    mockInterview: {
      latestScore: interviewScore,
      completedCount: interviews.length,
      hasData: interviewScore !== null
    },
    applications: {
      activeCount: activeApps,
      totalCount: applications.length,
      hasData: applications.length > 0
    }
  };
}

/**
 * 2. 7-Pillar Placement Progress
 * Returns normalized status and metrics for each of the 7 pillars.
 */
export function computePillarProgress(readinessReport) {
  if (!readinessReport || !readinessReport.pillars) {
    return READINESS_PILLARS.map(p => ({
      id: p.id,
      name: p.name,
      shortName: p.shortName,
      score: null,
      targetBenchmark: p.targetBenchmark,
      gap: null,
      available: false,
      statusLabel: 'Not evaluated yet',
      effectiveWeight: 0,
      actionTarget: p.actionTarget,
      actionLabel: p.actionLabel,
      color: p.color
    }));
  }

  return readinessReport.pillars.map(p => ({
    id: p.id,
    name: p.name,
    shortName: p.shortName,
    score: p.score,
    targetBenchmark: p.targetBenchmark,
    gap: p.gap,
    available: Boolean(p.available),
    statusLabel: p.statusLabel,
    effectiveWeight: p.effectiveWeight || 0,
    actionTarget: p.actionTarget,
    actionLabel: p.actionLabel,
    color: p.color
  }));
}

/**
 * 3. Historical Readiness Trend Analysis
 * Analyzes stored readiness snapshots over time.
 * Enforces honesty rule: requires at least 2 data points; never draws fake trends.
 */
export function analyzeReadinessTrend(snapshots = [], period = 'all') {
  const filtered = filterDataByPeriod(snapshots, 'created_at', period);

  // Sort chronological ascending
  const chronological = [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (chronological.length < 2) {
    return {
      hasEnoughData: false,
      message: 'Your readiness trend will appear as you complete more assessments and placement activities.',
      snapshotsCount: chronological.length,
      history: chronological,
      startScore: chronological[0]?.readiness_score ?? null,
      currentScore: chronological[0]?.readiness_score ?? null,
      scoreDelta: 0,
      trendDirection: 'neutral'
    };
  }

  const oldest = chronological[0];
  const newest = chronological[chronological.length - 1];
  const startScore = Number(oldest.readiness_score) || 0;
  const currentScore = Number(newest.readiness_score) || 0;
  const scoreDelta = Math.round((currentScore - startScore) * 10) / 10;
  const trendDirection = scoreDelta > 0 ? 'improving' : (scoreDelta < 0 ? 'declining' : 'stable');

  // Format plot points
  const points = chronological.map((s, idx) => ({
    id: s.id || `pt-${idx}`,
    date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: s.created_at,
    score: Number(s.readiness_score),
    pillarsEvaluated: s.evaluated_pillars || 0,
    strongestArea: s.strongest_area || null,
    priorityGap: s.priority_gap || null
  }));

  return {
    hasEnoughData: true,
    message: `${scoreDelta >= 0 ? '+' : ''}${scoreDelta} points across ${chronological.length} verified evaluations`,
    snapshotsCount: chronological.length,
    history: chronological,
    points,
    startScore,
    currentScore,
    scoreDelta,
    trendDirection
  };
}

/**
 * 4. Real Activity Timeline Intelligence
 * Aggregates and sorts genuine student actions across all platform tools.
 */
export function aggregateActivityTimeline({
  attempts = [],
  courseProgress = [],
  learningPaths = [],
  resumes = [],
  interviews = [],
  applications = [],
  userSkills = [],
  period = 'all'
}) {
  const events = [];

  // A. Assessment attempts
  attempts.forEach(a => {
    const title = a.assessment_title || a.category || 'Diagnostic Assessment';
    const score = a.score_percent !== undefined ? Number(a.score_percent) : null;
    events.push({
      id: `act-attempt-${a.id || Math.random()}`,
      type: 'assessment',
      categoryLabel: 'Diagnostic Assessment',
      title,
      description: score !== null 
        ? `Completed ${title} with score of ${score}% (${a.passed ? 'Passed' : 'Attempted'})`
        : `Completed ${title}`,
      score,
      badge: score !== null ? `${score}%` : null,
      badgeVariant: (score >= 70 || a.passed) ? 'success' : 'warning',
      timestamp: a.created_at || a.attempted_at,
      targetRoute: 'assessments'
    });
  });

  // B. Course progress updates
  courseProgress.forEach(cp => {
    if (Number(cp.progress_percent) > 0) {
      const title = cp.course_title || 'Course Module';
      const pct = Number(cp.progress_percent);
      events.push({
        id: `act-course-${cp.id || Math.random()}`,
        type: 'course',
        categoryLabel: 'Learning Module',
        title,
        description: `Advanced to ${pct}% in ${title}`,
        score: pct,
        badge: `${pct}%`,
        badgeVariant: pct === 100 ? 'success' : 'primary',
        timestamp: cp.updated_at || cp.created_at,
        targetRoute: 'courses'
      });
    }
  });

  // C. Roadmap milestones
  learningPaths.forEach(lp => {
    if (lp.completed) {
      events.push({
        id: `act-roadmap-${lp.id || Math.random()}`,
        type: 'roadmap',
        categoryLabel: 'Roadmap Milestone',
        title: lp.title,
        description: `Cleared milestone: ${lp.title}`,
        badge: 'Cleared',
        badgeVariant: 'success',
        timestamp: lp.completed_at || lp.updated_at || lp.created_at,
        targetRoute: 'roadmap'
      });
    }
  });

  // D. Resumes analyzed
  resumes.forEach(r => {
    const score = r.ats_score !== undefined && r.ats_score !== null 
      ? Number(r.ats_score) 
      : (r.atsScore !== undefined ? Number(r.atsScore) : null);
    events.push({
      id: `act-resume-${r.id || Math.random()}`,
      type: 'resume',
      categoryLabel: 'Resume ATS Audit',
      title: r.file_name || 'Resume ATS Scan',
      description: score !== null 
        ? `Parsed resume and achieved ${score}/100 ATS audit score`
        : 'Uploaded resume for ATS keyword scanning',
      score,
      badge: score !== null ? `${score}/100` : 'Analyzed',
      badgeVariant: score >= 80 ? 'success' : 'primary',
      timestamp: r.created_at,
      targetRoute: 'resume'
    });
  });

  // E. Mock interviews completed
  interviews.forEach(m => {
    const score = m.overall_score !== undefined && m.overall_score !== null
      ? Number(m.overall_score)
      : (m.overallScore !== undefined ? Number(m.overallScore) : null);
    events.push({
      id: `act-mock-${m.id || Math.random()}`,
      type: 'interview',
      categoryLabel: 'AI Mock Interview',
      title: m.target_role || `${m.interview_type || 'Technical'} Mock Interview`,
      description: score !== null
        ? `Completed simulated interview round with score of ${score}/100`
        : 'Completed AI mock interview simulation',
      score,
      badge: score !== null ? `${score}/100` : 'Completed',
      badgeVariant: score >= 75 ? 'success' : 'primary',
      timestamp: m.created_at,
      targetRoute: 'interview'
    });
  });

  // F. Tracked applications
  applications.forEach(app => {
    const comp = app.company_name || app.company || 'Placement Opportunity';
    const st = app.status || 'applied';
    events.push({
      id: `act-app-${app.id || Math.random()}`,
      type: 'application',
      categoryLabel: 'Placement Pipeline',
      title: comp,
      description: `Tracked application at ${comp} (Current stage: ${st.toUpperCase()})`,
      badge: st.toUpperCase(),
      badgeVariant: ['selected', 'offer'].includes(st.toLowerCase()) ? 'success' : 'neutral',
      timestamp: app.updated_at || app.applied_at || app.created_at,
      targetRoute: 'applications'
    });
  });

  // G. Skill updates
  userSkills.forEach(s => {
    if (s.verified || Number(s.proficiency_percent) > 0) {
      const name = s.skill_name || s.name || 'Skill';
      const prof = Number(s.proficiency_percent) || 0;
      events.push({
        id: `act-skill-${s.id || Math.random()}`,
        type: 'skill',
        categoryLabel: 'Skill Assessment',
        title: name,
        description: `Benchmarked ${name} proficiency at ${prof}%`,
        badge: `${prof}%`,
        badgeVariant: prof >= 80 ? 'success' : (prof >= 60 ? 'warning' : 'danger'),
        timestamp: s.updated_at || s.created_at,
        targetRoute: 'skills'
      });
    }
  });

  // Filter valid dates & sort DESC
  const validEvents = events.filter(e => e.timestamp && !isNaN(new Date(e.timestamp).getTime()));
  const filtered = filterDataByPeriod(validEvents, 'timestamp', period);

  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * 5. Skill Progress Intelligence
 * Evaluates competencies against Phase 4 thresholds and computes chronological improvements.
 */
export function analyzeSkillProgress(userSkills = [], attempts = []) {
  if (!Array.isArray(userSkills) || userSkills.length === 0) {
    return {
      hasData: false,
      strong: [],
      improving: [],
      critical: [],
      totalEvaluated: 0,
      topGap: null
    };
  }

  const strong = [];
  const improving = [];
  const critical = [];

  userSkills.forEach(s => {
    const prof = Number(s.proficiency_percent) || 0;
    const name = s.skill_name || s.name || 'Skill';
    const category = s.category || 'General';

    // Find related attempts for history/delta
    const relatedAttempts = attempts.filter(a => {
      const cat = (a.category || a.assessment_title || '').toLowerCase();
      return cat.includes(name.toLowerCase()) || (name.toLowerCase().includes(cat) && cat.length > 2);
    }).sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    let delta = null;
    if (relatedAttempts.length >= 2) {
      const firstScore = Number(relatedAttempts[0].score_percent) || 0;
      const lastScore = Number(relatedAttempts[relatedAttempts.length - 1].score_percent) || 0;
      delta = lastScore - firstScore;
    }

    const item = {
      id: s.id || name,
      name,
      category,
      proficiency: prof,
      verified: Boolean(s.verified),
      delta,
      attemptsCount: relatedAttempts.length
    };

    if (prof >= SKILL_THRESHOLDS.STRONG.min) {
      strong.push(item);
    } else if (prof >= SKILL_THRESHOLDS.NEEDS_IMPROVEMENT.min) {
      improving.push(item);
    } else {
      critical.push(item);
    }
  });

  // Sort critical by largest gap ascending
  critical.sort((a, b) => a.proficiency - b.proficiency);
  strong.sort((a, b) => b.proficiency - a.proficiency);

  return {
    hasData: userSkills.length > 0,
    strong,
    improving,
    critical,
    totalEvaluated: userSkills.length,
    topGap: critical.length > 0 ? critical[0] : (improving.length > 0 ? improving[0] : null)
  };
}

/**
 * 6. Learning Progress Intelligence
 * Tracks milestones, course completion, and estimated hours remaining.
 */
export function analyzeLearningProgress(learningPaths = [], courses = [], courseProgress = []) {
  const totalSteps = learningPaths.length;
  const completedSteps = learningPaths.filter(lp => lp.completed);
  const remainingSteps = learningPaths.filter(lp => !lp.completed);

  const progressPercent = totalSteps > 0 
    ? Math.round((completedSteps.length / totalSteps) * 100) 
    : 0;

  // Calculate estimated study hours remaining from roadmap milestones
  let remainingHours = 0;
  remainingSteps.forEach(s => {
    remainingHours += Number(s.target_hours) || 4;
  });

  const activeStep = remainingSteps.length > 0 ? remainingSteps[0] : null;

  return {
    hasData: totalSteps > 0,
    totalMilestones: totalSteps,
    completedMilestones: completedSteps.length,
    remainingMilestones: remainingSteps.length,
    progressPercent,
    remainingHours: remainingSteps.length > 0 ? remainingHours : 0,
    activeStep,
    stages: learningPaths,
    enrolledCoursesCount: courseProgress.length
  };
}

/**
 * 7. Assessment Analytics Intelligence
 * Calculates distribution, averages, highest scores, and subject breakdown.
 */
export function analyzeAssessmentHistory(attempts = [], period = 'all') {
  const filtered = filterDataByPeriod(attempts, 'created_at', period);

  if (filtered.length === 0) {
    return {
      hasData: false,
      totalAttempts: 0,
      uniqueAssessments: 0,
      avgScore: null,
      bestScore: null,
      latestScore: null,
      passedCount: 0,
      passRate: null,
      categories: []
    };
  }

  let scoreSum = 0;
  let bestScore = 0;
  let passedCount = 0;
  const categoryMap = {};

  filtered.forEach(a => {
    const score = Number(a.score_percent) || 0;
    scoreSum += score;
    if (score > bestScore) bestScore = score;
    if (a.passed || score >= 70) passedCount++;

    const cat = a.assessment_title || a.category || 'General Assessment';
    if (!categoryMap[cat]) {
      categoryMap[cat] = {
        name: cat,
        attempts: 0,
        scores: [],
        highest: 0,
        passed: 0
      };
    }
    categoryMap[cat].attempts++;
    categoryMap[cat].scores.push(score);
    if (score > categoryMap[cat].highest) categoryMap[cat].highest = score;
    if (a.passed || score >= 70) categoryMap[cat].passed++;
  });

  const avgScore = Math.round((scoreSum / filtered.length) * 10) / 10;
  const passRate = Math.round((passedCount / filtered.length) * 100);

  // Latest chronological attempt
  const sortedChronological = [...filtered].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  const latestScore = Number(sortedChronological[0]?.score_percent) || 0;

  const categories = Object.values(categoryMap).map(c => {
    const cAvg = Math.round((c.scores.reduce((s, x) => s + x, 0) / c.scores.length) * 10) / 10;
    return {
      name: c.name,
      attemptsCount: c.attempts,
      avgScore: cAvg,
      highestScore: c.highest,
      passRate: Math.round((c.passed / c.attempts) * 100),
      status: c.highest >= 80 ? 'Mastered' : (c.highest >= 70 ? 'Passed' : 'Needs Practice')
    };
  }).sort((a, b) => b.attemptsCount - a.attemptsCount);

  return {
    hasData: true,
    totalAttempts: filtered.length,
    uniqueAssessments: categories.length,
    avgScore,
    bestScore,
    latestScore,
    passedCount,
    passRate,
    categories
  };
}

/**
 * 8. Application Pipeline Intelligence
 * Conversion funnel calculations respecting zero-denominator rules.
 */
export function analyzeApplicationPipeline(applications = []) {
  const stats = calculateApplicationStatistics(applications);

  const applied = stats.appliedCount || 0;
  const assessment = stats.assessmentCount || 0;
  const interview = stats.interviewCount || 0;
  const offer = stats.offerCount || 0;
  const selected = stats.selectedCount || 0;

  // Funnel conversions (strictly null if denominator is 0)
  const appliedToInterviewRate = (applied + assessment + interview + offer + selected) > 0
    ? Math.round(((interview + offer + selected) / (applied + assessment + interview + offer + selected)) * 100)
    : null;

  const interviewToOfferRate = (interview + offer + selected) > 0
    ? Math.round(((offer + selected) / (interview + offer + selected)) * 100)
    : null;

  const offerToSelectedRate = (offer + selected) > 0
    ? Math.round((selected / (offer + selected)) * 100)
    : null;

  return {
    ...stats,
    funnel: {
      appliedToInterviewRate,
      interviewToOfferRate,
      offerToSelectedRate
    }
  };
}

/**
 * 9. Grounded Placement Readiness Insights
 * Explains what is improving, what is holding the candidate back, and next focus.
 */
export function generateReadinessInsights({
  readinessReport,
  skillGaps,
  resume,
  mockInterview,
  applications = []
}) {
  const improving = [];
  const holdingBack = [];
  let nextFocus = null;

  const pillars = readinessReport?.pillars || [];
  const evaluatedPillars = pillars.filter(p => p.available);

  // A. What's Improving
  evaluatedPillars.forEach(p => {
    if (p.score >= p.targetBenchmark) {
      improving.push(`Your ${p.name} is currently ${p.score}/100, exceeding the campus benchmark (${p.targetBenchmark}%).`);
    }
  });

  if (skillGaps?.strong && skillGaps.strong.length > 0) {
    const topSkills = skillGaps.strong.slice(0, 2).map(s => s.name).join(' and ');
    improving.push(`Strong verified competencies detected in ${topSkills}.`);
  }

  if (improving.length === 0) {
    improving.push(evaluatedPillars.length > 0 
      ? 'Initial baseline metrics established across evaluated placement pillars.' 
      : 'Complete diagnostic tests to benchmark your active placement improvements.');
  }

  // B. What's Holding You Back
  const priorityGap = readinessReport?.priorityGap;
  if (priorityGap) {
    holdingBack.push(`${priorityGap.name} stands at ${priorityGap.score}%, which is ${priorityGap.gap}% below the campus benchmark (${priorityGap.targetBenchmark}%).`);
  }

  if (readinessReport && readinessReport.coverage && readinessReport.coverage.available < readinessReport.coverage.total) {
    const unassessedCount = readinessReport.coverage.total - readinessReport.coverage.available;
    holdingBack.push(`${unassessedCount} of 7 core placement pillars remain unassessed, preventing full index calculation.`);
  }

  if (!resume?.hasData) {
    holdingBack.push('No analyzed resume on file for ATS keyword matching.');
  }

  if (!mockInterview?.hasData) {
    holdingBack.push('No completed AI mock interview on record for technical articulation benchmarking.');
  }

  if (holdingBack.length === 0) {
    holdingBack.push('All evaluated competencies are meeting current hiring benchmarks. Maintain consistency with timed drills.');
  }

  // C. Next Focus
  if (priorityGap) {
    nextFocus = {
      title: `Focus on ${priorityGap.name}`,
      description: `Target practice drills and course modules on ${priorityGap.name} to close your current -${priorityGap.gap}% gap.`,
      targetRoute: priorityGap.actionTarget || 'roadmap',
      label: `Work on ${priorityGap.shortName || priorityGap.name}`
    };
  } else if (!resume?.hasData) {
    nextFocus = {
      title: 'Audit Your Resume',
      description: 'Upload your resume to evaluate ATS screening compliance and role keyword density.',
      targetRoute: 'resume',
      label: 'Upload Resume'
    };
  } else if (!mockInterview?.hasData) {
    nextFocus = {
      title: 'Simulate Mock Interview',
      description: 'Complete a full technical interview simulation to benchmark your communication depth.',
      targetRoute: 'interview',
      label: 'Start Mock Interview'
    };
  } else {
    nextFocus = {
      title: 'Explore Campus Drives',
      description: 'Review matching placement opportunities and track active drive applications.',
      targetRoute: 'job-opportunities',
      label: 'Browse Placement Drives'
    };
  }

  return {
    improving,
    holdingBack,
    nextFocus
  };
}
