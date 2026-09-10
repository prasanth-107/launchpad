/**
 * dailyPreparationEngine.js
 * -----------------------------------------------------------------------------
 * Modern Placement Launchpad - Phase 13
 * Placement Preparation Workspace & Daily Action Plan Engine
 *
 * Core Principles:
 * 1. Zero Fabricated Tasks: Every action is strictly derived from authentic candidate state.
 * 2. 6-Level Priority Hierarchy:
 *    - P0 (Urgent): Real upcoming interview/assessment deadline within 7 days.
 *    - P1 (Critical Gap): Evaluated competency below critical threshold (<60%).
 *    - P2 (Largest Readiness Gap): Evaluated readiness pillar with largest gap below target.
 *    - P3 (Learning Continuity): In-progress course or active roadmap milestone.
 *    - P4 (Practice): Assessment / interview drills for unassessed or developing areas.
 *    - P5 (Maintenance): Practice for high-proficiency competencies (>=80%).
 * 3. Daily Action Capping: Strictly 3 to 5 actions maximum to prevent cognitive overload.
 * 4. Grounded Telemetry: Real streak and weekly summary without invented metrics.
 * -----------------------------------------------------------------------------
 */

import { READINESS_PILLARS, computePlacementReadiness } from './placementReadinessEngine.js';
import { SKILL_THRESHOLDS } from './progressAnalyticsEngine.js';
import { getUpcomingApplicationEvent } from './applicationPipelineEngine.js';

// Priority Configuration
export const ACTION_PRIORITIES = {
  P0: { code: 'P0', label: 'Urgent', variant: 'danger', weight: 1000 },
  P1: { code: 'P1', label: 'Critical Gap', variant: 'rose', weight: 800 },
  P2: { code: 'P2', label: 'Largest Gap', variant: 'warning', weight: 600 },
  P3: { code: 'P3', label: 'Learning Continuity', variant: 'indigo', weight: 400 },
  P4: { code: 'P4', label: 'Practice', variant: 'primary', weight: 200 },
  P5: { code: 'P5', label: 'Maintenance', variant: 'neutral', weight: 100 }
};

// Preparation Modes based on Phase 5 Readiness
export const PREPARATION_MODES = {
  PLACEMENT_READY: {
    id: 'placement_ready',
    title: 'Placement Ready',
    badgeVariant: 'success',
    headline: 'You have cleared major placement benchmarks!',
    guidance: 'Maintain consistency and focus on interview execution and active campus drives.',
    recommendedPillars: ['interview', 'applications']
  },
  ALMOST_READY: {
    id: 'almost_ready',
    title: 'Almost Ready',
    badgeVariant: 'primary',
    headline: 'Strong placement foundation established.',
    guidance: 'Close your remaining readiness gaps to reach the top recruitment percentile.',
    recommendedPillars: ['dsa', 'tech', 'resume']
  },
  NEEDS_IMPROVEMENT: {
    id: 'needs_improvement',
    title: 'Needs Improvement',
    badgeVariant: 'warning',
    headline: 'Targeted drills required across foundational areas.',
    guidance: 'Focus on your highest-impact skill gaps and complete active learning milestones.',
    recommendedPillars: ['dsa', 'aptitude', 'tech']
  },
  NEEDS_SIGNIFICANT_IMPROVEMENT: {
    id: 'needs_significant_improvement',
    title: 'Needs Significant Improvement',
    badgeVariant: 'danger',
    headline: 'Essential preparation required before upcoming drives.',
    guidance: 'Focus on core competencies, take foundational assessments, and audit your resume.',
    recommendedPillars: ['aptitude', 'tech', 'resume']
  },
  ASSESSMENT_IN_PROGRESS: {
    id: 'assessment_in_progress',
    title: 'Assessment in Progress',
    badgeVariant: 'neutral',
    headline: 'Evaluation in progress.',
    guidance: 'Complete an assessment to discover your strengths and personalized daily preparation plan.',
    recommendedPillars: ['aptitude', 'dsa', 'tech']
  }
};

/**
 * 1. Determines candidate preparation mode from readiness report.
 */
export function determinePreparationMode(readinessReport) {
  if (!readinessReport || !readinessReport.isEvaluated || readinessReport.coverage?.available === 0) {
    return PREPARATION_MODES.ASSESSMENT_IN_PROGRESS;
  }

  const score = Number(readinessReport.score) || 0;
  if (score >= 90) return PREPARATION_MODES.PLACEMENT_READY;
  if (score >= 75) return PREPARATION_MODES.ALMOST_READY;
  if (score >= 60) return PREPARATION_MODES.NEEDS_IMPROVEMENT;
  return PREPARATION_MODES.NEEDS_SIGNIFICANT_IMPROVEMENT;
}

/**
 * 2. Generates the canonical daily preparation plan.
 * Strictly bounds output to 3-5 actions (or fewer if insufficient data exists).
 */
export function generateDailyPreparationPlan(candidateData = {}) {
  const attempts = candidateData.attempts || candidateData.assessment_attempts || [];
  const userSkills = candidateData.userSkills || candidateData.user_skills || [];
  const courses = candidateData.courses || [];
  const courseProgress = candidateData.courseProgress || candidateData.course_progress || [];
  const learningPaths = candidateData.learningPaths || candidateData.learning_paths || [];
  const resumes = candidateData.resumes || (candidateData.latestResume ? [candidateData.latestResume] : []);
  const interviews = candidateData.interviews || candidateData.mock_interviews || [];
  const applications = candidateData.applications || [];
  const completedKeys = new Set((candidateData.completedActions || []).map(a => a.action_key || a.id || a));

  // Compute or reuse Phase 5 readiness
  const readinessReport = candidateData.readinessReport || computePlacementReadiness({
    attempts,
    userSkills,
    resumes,
    interviews,
    progress: courseProgress,
    profile: candidateData.profile
  });

  const mode = determinePreparationMode(readinessReport);
  const potentialActions = [];

  // --------------------------------------------------------------------------
  // RULE 0: Check if candidate is completely new (zero-data state)
  // --------------------------------------------------------------------------
  const hasAnyData = attempts.length > 0 || userSkills.length > 0 || resumes.length > 0 || 
                     interviews.length > 0 || applications.length > 0 || courseProgress.length > 0 || 
                     Boolean(candidateData.interviewIntelligence?.hasData);

  if (!hasAnyData) {
    return {
      mode,
      topPriority: {
        id: 'action-onboarding-eval',
        key: 'onboarding_eval',
        title: 'Complete First Diagnostic Assessment',
        category: 'Assessment',
        priority: ACTION_PRIORITIES.P1.code,
        priorityLabel: ACTION_PRIORITIES.P1.label,
        priorityVariant: ACTION_PRIORITIES.P1.variant,
        reason: 'Take your first diagnostic assessment to evaluate skill gaps and generate a personalized preparation plan.',
        estimated_minutes: 25,
        destination: 'assessments',
        actionLabel: 'Take Assessment',
        source: 'Assessment',
        completed: completedKeys.has('onboarding_eval'),
        metadata: { isInitial: true }
      },
      plan: [
        {
          id: 'action-onboarding-eval',
          key: 'onboarding_eval',
          title: 'Complete First Diagnostic Assessment',
          category: 'Assessment',
          priority: ACTION_PRIORITIES.P1.code,
          priorityLabel: ACTION_PRIORITIES.P1.label,
          priorityVariant: ACTION_PRIORITIES.P1.variant,
          reason: 'Take your first diagnostic assessment to evaluate skill gaps and generate a personalized preparation plan.',
          estimated_minutes: 25,
          destination: 'assessments',
          actionLabel: 'Take Assessment',
          source: 'Assessment',
          completed: completedKeys.has('onboarding_eval'),
          metadata: { isInitial: true }
        }
      ],
      totalActions: 1,
      completedCount: completedKeys.has('onboarding_eval') ? 1 : 0,
      readinessScore: null
    };
  }

  // --------------------------------------------------------------------------
  // RULE 1: P0 — Urgent Deadlines & Scheduled Events (Within 7 Days)
  // --------------------------------------------------------------------------
  const upcomingEvent = getUpcomingApplicationEvent(applications);
  if (upcomingEvent && upcomingEvent.hasEvent) {
    const now = Date.now();
    const eventTime = upcomingEvent.eventDate ? new Date(upcomingEvent.eventDate).getTime() : null;
    const isWithin7Days = eventTime && (eventTime - now <= 7 * 86400000) && (eventTime >= now - 86400000);

    if (isWithin7Days) {
      const isInterview = upcomingEvent.type === 'interview';
      potentialActions.push({
        id: `action-p0-app-${upcomingEvent.applicationId || 'event'}`,
        key: `app_urgent_${upcomingEvent.applicationId || 'event'}`,
        title: `Prepare for ${upcomingEvent.title}`,
        category: isInterview ? 'Mock Interview' : 'Assessment',
        priority: ACTION_PRIORITIES.P0.code,
        priorityLabel: ACTION_PRIORITIES.P0.label,
        priorityVariant: ACTION_PRIORITIES.P0.variant,
        weight: ACTION_PRIORITIES.P0.weight,
        reason: `${upcomingEvent.company} round scheduled for ${new Date(upcomingEvent.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}. Focused preparation recommended.`,
        estimated_minutes: 45,
        destination: isInterview ? 'interview' : 'assessments',
        actionLabel: isInterview ? 'Practice Interview' : 'Take Practice Test',
        source: 'Application Pipeline',
        completed: completedKeys.has(`app_urgent_${upcomingEvent.applicationId || 'event'}`),
        metadata: { company: upcomingEvent.company, eventDate: upcomingEvent.eventDate }
      });
    }
  }

  // --------------------------------------------------------------------------
  // RULE 2: P1 — Critical Skill Gaps (<60% Proficiency)
  // --------------------------------------------------------------------------
  const criticalSkills = userSkills.filter(s => Number(s.proficiency_percent) < SKILL_THRESHOLDS.NEEDS_IMPROVEMENT.min && Number(s.proficiency_percent) > 0);
  if (criticalSkills.length > 0) {
    const topCritical = [...criticalSkills].sort((a, b) => Number(a.proficiency_percent) - Number(b.proficiency_percent))[0];
    const skillName = topCritical.skill_name || topCritical.name || 'Core Skill';
    const prof = Number(topCritical.proficiency_percent);
    const isDsa = skillName.toLowerCase().includes('data structure') || skillName.toLowerCase().includes('algorithm') || skillName.toLowerCase().includes('dsa');

    potentialActions.push({
      id: `action-p1-skill-${topCritical.id || skillName}`,
      key: `skill_critical_${skillName.toLowerCase().replace(/\s+/g, '_')}`,
      title: `Remediate Critical Gap: ${skillName}`,
      category: isDsa ? 'DSA' : 'Technical Skills',
      priority: ACTION_PRIORITIES.P1.code,
      priorityLabel: ACTION_PRIORITIES.P1.label,
      priorityVariant: ACTION_PRIORITIES.P1.variant,
      weight: ACTION_PRIORITIES.P1.weight,
      reason: `Your evaluated proficiency in ${skillName} is ${prof}%, falling into the Critical Gap zone (<60%).`,
      estimated_minutes: 30,
      destination: isDsa ? 'dsa-sheets' : 'courses',
      actionLabel: isDsa ? 'Practice Problem Sheet' : 'Open Course',
      source: 'Skill Gap',
      completed: completedKeys.has(`skill_critical_${skillName.toLowerCase().replace(/\s+/g, '_')}`),
      metadata: { skillName, proficiency: prof }
    });
  }

  // Phase 15: Targeted Interview Actions (STAR & Technical Depth deficits)
  if (interviews.length > 0) {
    const latestInt = [...interviews].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
    const commScore = Number(latestInt.communication_score ?? 0);
    const techScore = Number(latestInt.technical_score ?? 0);

    if (commScore < 65 && commScore > 0) {
      potentialActions.push({
        id: 'action-p1-interview-star',
        key: 'interview_drill_star_structure',
        title: 'Master STAR Behavioral Response Structure',
        category: 'Mock Interview',
        priority: ACTION_PRIORITIES.P1.code,
        priorityLabel: ACTION_PRIORITIES.P1.label,
        priorityVariant: ACTION_PRIORITIES.P1.variant,
        weight: ACTION_PRIORITIES.P1.weight + (65 - commScore),
        reason: `Your latest communication & structure score was ${commScore}%. Practice structuring answers with complete Situation, Task, Action, and Result components.`,
        estimated_minutes: 20,
        destination: 'interview',
        actionLabel: 'Practice STAR Drill',
        source: 'Mock Interview Intelligence',
        completed: completedKeys.has('interview_drill_star_structure'),
        metadata: { commScore, target: 75 }
      });
    }

    if (techScore < 60 && techScore > 0) {
      potentialActions.push({
        id: 'action-p1-interview-tech-depth',
        key: 'interview_drill_tech_depth',
        title: 'Elevate Verbal Technical Depth & Architecture',
        category: 'Mock Interview',
        priority: ACTION_PRIORITIES.P1.code,
        priorityLabel: ACTION_PRIORITIES.P1.label,
        priorityVariant: ACTION_PRIORITIES.P1.variant,
        weight: ACTION_PRIORITIES.P1.weight + (60 - techScore),
        reason: `Your latest interview technical depth scored ${techScore}%. Practice articulating internal mechanisms, system trade-offs, and complexity metrics.`,
        estimated_minutes: 25,
        destination: 'interview',
        actionLabel: 'Practice Technical Depth',
        source: 'Mock Interview Intelligence',
        completed: completedKeys.has('interview_drill_tech_depth'),
        metadata: { techScore, target: 75 }
      });
    }
  }

  // --------------------------------------------------------------------------
  // RULE 3: P2 — Largest Readiness Gap Against Phase 5 Benchmark
  // --------------------------------------------------------------------------
  const evaluatedPillars = (readinessReport.pillars || []).filter(p => p.available);
  const gapPillars = evaluatedPillars.filter(p => p.gap > 0).sort((a, b) => b.gap - a.gap);

  if (gapPillars.length > 0) {
    const primaryGap = gapPillars[0];
    let dest = primaryGap.actionTarget || 'assessments';
    let cat = 'Assessment';
    let cta = primaryGap.actionLabel || 'Take Action';
    let mins = 30;

    if (primaryGap.id === 'resume') {
      cat = 'Resume';
      dest = 'resume';
      cta = 'Audit & Boost Resume';
      mins = 20;
    } else if (primaryGap.id === 'interview') {
      cat = 'Mock Interview';
      dest = 'interview';
      cta = 'Start Mock Interview';
      mins = 35;
    } else if (primaryGap.id === 'dsa') {
      cat = 'DSA';
      dest = 'dsa-sheets';
      cta = 'Solve DSA Sheet';
      mins = 35;
    } else if (primaryGap.id === 'aptitude') {
      cat = 'Aptitude';
      dest = 'assessments';
      cta = 'Practice Aptitude';
      mins = 25;
    } else if (primaryGap.id === 'tech' || primaryGap.id === 'projects') {
      cat = 'Technical Skills';
      dest = 'courses';
      cta = 'Review Core Concepts';
      mins = 30;
    }

    potentialActions.push({
      id: `action-p2-readiness-${primaryGap.id}`,
      key: `readiness_gap_${primaryGap.id}`,
      title: `Close Gap in ${primaryGap.name}`,
      category: cat,
      priority: ACTION_PRIORITIES.P2.code,
      priorityLabel: ACTION_PRIORITIES.P2.label,
      priorityVariant: ACTION_PRIORITIES.P2.variant,
      weight: ACTION_PRIORITIES.P2.weight + primaryGap.gap,
      reason: `Your ${primaryGap.name} score is ${primaryGap.score}/100, which is ${primaryGap.gap} points below the campus benchmark (${primaryGap.targetBenchmark}%).`,
      estimated_minutes: mins,
      destination: dest,
      actionLabel: cta,
      source: 'Placement Readiness',
      completed: completedKeys.has(`readiness_gap_${primaryGap.id}`),
      metadata: { pillarId: primaryGap.id, score: primaryGap.score, gap: primaryGap.gap }
    });

    // If second large gap exists and has high deficit, consider as well
    if (gapPillars.length > 1 && gapPillars[1].gap >= 15) {
      const secondGap = gapPillars[1];
      potentialActions.push({
        id: `action-p2-readiness-${secondGap.id}`,
        key: `readiness_gap_${secondGap.id}`,
        title: `Elevate ${secondGap.name}`,
        category: secondGap.id === 'resume' ? 'Resume' : (secondGap.id === 'interview' ? 'Mock Interview' : 'Assessment'),
        priority: ACTION_PRIORITIES.P2.code,
        priorityLabel: ACTION_PRIORITIES.P2.label,
        priorityVariant: ACTION_PRIORITIES.P2.variant,
        weight: ACTION_PRIORITIES.P2.weight + secondGap.gap - 5,
        reason: `${secondGap.name} score (${secondGap.score}%) is ${secondGap.gap}% below benchmark target (${secondGap.targetBenchmark}%).`,
        estimated_minutes: 25,
        destination: secondGap.actionTarget || 'assessments',
        actionLabel: secondGap.actionLabel || 'Practice',
        source: 'Placement Readiness',
        completed: completedKeys.has(`readiness_gap_${secondGap.id}`),
        metadata: { pillarId: secondGap.id, score: secondGap.score, gap: secondGap.gap }
      });
    }
  }

  // --------------------------------------------------------------------------
  // RULE 4: P3 — Learning Continuity (In-Progress Course or Next Roadmap Step)
  // --------------------------------------------------------------------------
  // Check active course progress first
  const inProgressCourses = courseProgress.filter(cp => Number(cp.progress_percent) > 0 && Number(cp.progress_percent) < 100);
  if (inProgressCourses.length > 0) {
    const activeCourse = inProgressCourses[0];
    const courseMeta = courses.find(c => c.id === activeCourse.course_id) || {};
    const title = courseMeta.title || activeCourse.course_title || 'Active Course';
    const percent = Math.round(Number(activeCourse.progress_percent));

    potentialActions.push({
      id: `action-p3-course-${activeCourse.course_id}`,
      key: `course_progress_${activeCourse.course_id}`,
      title: `Continue ${title}`,
      category: 'Learning',
      priority: ACTION_PRIORITIES.P3.code,
      priorityLabel: ACTION_PRIORITIES.P3.label,
      priorityVariant: ACTION_PRIORITIES.P3.variant,
      weight: ACTION_PRIORITIES.P3.weight + (100 - percent),
      reason: `You are currently ${percent}% through this course. Complete the next module to advance your skills.`,
      estimated_minutes: 25,
      destination: 'courses',
      actionLabel: 'Continue Learning',
      source: 'Learning Path',
      completed: completedKeys.has(`course_progress_${activeCourse.course_id}`),
      metadata: { courseId: activeCourse.course_id, progressPercent: percent }
    });
  } else {
    // Or check next incomplete roadmap milestone
    const nextRoadmapStep = learningPaths.find(lp => !lp.completed);
    if (nextRoadmapStep) {
      potentialActions.push({
        id: `action-p3-roadmap-${nextRoadmapStep.id || nextRoadmapStep.step_number}`,
        key: `roadmap_step_${nextRoadmapStep.step_number || nextRoadmapStep.id}`,
        title: `Advance Roadmap: ${nextRoadmapStep.title}`,
        category: 'Learning',
        priority: ACTION_PRIORITIES.P3.code,
        priorityLabel: ACTION_PRIORITIES.P3.label,
        priorityVariant: ACTION_PRIORITIES.P3.variant,
        weight: ACTION_PRIORITIES.P3.weight,
        reason: `Next milestone in your placement roadmap. Estimated study time: ${nextRoadmapStep.target_hours || 4} hours.`,
        estimated_minutes: 30,
        destination: 'roadmap',
        actionLabel: 'View Milestone',
        source: 'Learning Path',
        completed: completedKeys.has(`roadmap_step_${nextRoadmapStep.step_number || nextRoadmapStep.id}`),
        metadata: { stepNumber: nextRoadmapStep.step_number, category: nextRoadmapStep.category }
      });
    }
  }

  // --------------------------------------------------------------------------
  // RULE 5: P4 — Assessment / Interview Practice for Unevaluated Dimensions
  // --------------------------------------------------------------------------
  const unevaluatedPillars = (readinessReport.pillars || []).filter(p => !p.available);
  if (unevaluatedPillars.length > 0 && potentialActions.length < 4) {
    const targetUneval = unevaluatedPillars[0];
    potentialActions.push({
      id: `action-p4-uneval-${targetUneval.id}`,
      key: `eval_unlock_${targetUneval.id}`,
      title: `Unlock Evaluation: ${targetUneval.name}`,
      category: targetUneval.id === 'resume' ? 'Resume' : (targetUneval.id === 'interview' ? 'Mock Interview' : 'Assessment'),
      priority: ACTION_PRIORITIES.P4.code,
      priorityLabel: ACTION_PRIORITIES.P4.label,
      priorityVariant: ACTION_PRIORITIES.P4.variant,
      weight: ACTION_PRIORITIES.P4.weight,
      reason: `${targetUneval.name} has not been evaluated yet. Complete this to boost your readiness coverage.`,
      estimated_minutes: 20,
      destination: targetUneval.actionTarget || 'assessments',
      actionLabel: targetUneval.actionLabel || 'Start',
      source: 'Placement Readiness',
      completed: completedKeys.has(`eval_unlock_${targetUneval.id}`),
      metadata: { pillarId: targetUneval.id }
    });
  }

  // --------------------------------------------------------------------------
  // RULE 6: P5 — Maintenance Drill for High Performers (>=80%)
  // --------------------------------------------------------------------------
  if (mode.id === 'placement_ready' && potentialActions.length < 3) {
    potentialActions.push({
      id: 'action-p5-mock-maintenance',
      key: 'interview_maintenance',
      title: 'Maintain Mock Interview Fluency',
      category: 'Mock Interview',
      priority: ACTION_PRIORITIES.P5.code,
      priorityLabel: ACTION_PRIORITIES.P5.label,
      priorityVariant: ACTION_PRIORITIES.P5.variant,
      weight: ACTION_PRIORITIES.P5.weight,
      reason: 'Your scores are in the top tier. Keep communication and technical recall sharp with a short simulation.',
      estimated_minutes: 20,
      destination: 'interview',
      actionLabel: 'Quick Simulation',
      source: 'Mock Interview',
      completed: completedKeys.has('interview_maintenance'),
      metadata: { isMaintenance: true }
    });
  }

  // Phase 15 Interview Practice Actions from Intelligence
  if (candidateData.interviewIntelligence?.practiceActions?.length > 0) {
    candidateData.interviewIntelligence.practiceActions.forEach(pAct => {
      potentialActions.push({
        id: pAct.id,
        key: pAct.action_key || pAct.id,
        title: pAct.title,
        category: pAct.category || 'Mock Interview',
        priority: pAct.priority || ACTION_PRIORITIES.P1.code,
        priorityLabel: pAct.priorityLabel || ACTION_PRIORITIES.P1.label,
        priorityVariant: ACTION_PRIORITIES.P1.variant,
        weight: ACTION_PRIORITIES.P1.weight + 50,
        reason: pAct.reason,
        estimated_minutes: pAct.estimated_minutes || 25,
        destination: pAct.destination || 'interview',
        actionLabel: pAct.title,
        source: pAct.source || 'Mock Interview Intelligence',
        completed: completedKeys.has(pAct.action_key || pAct.id),
        metadata: { fromIntelligence: true }
      });
    });
  }

  // Phase 16 Adaptive Practice Actions from Question Intelligence
  if (Array.isArray(candidateData.adaptivePracticeActions) && candidateData.adaptivePracticeActions.length > 0) {
    candidateData.adaptivePracticeActions.forEach(pAct => {
      potentialActions.push({
        id: pAct.id,
        key: pAct.actionKey || pAct.id,
        title: pAct.title,
        category: 'Adaptive Practice',
        priority: pAct.code || ACTION_PRIORITIES.P4.code,
        priorityLabel: pAct.priority || ACTION_PRIORITIES.P4.label,
        priorityVariant: pAct.variant === 'danger' ? ACTION_PRIORITIES.P1.variant : ACTION_PRIORITIES.P4.variant,
        weight: pAct.code === 'P1' ? ACTION_PRIORITIES.P1.weight + 20 : ACTION_PRIORITIES.P4.weight + 20,
        reason: pAct.description,
        estimated_minutes: pAct.estimatedMinutes || 10,
        destination: pAct.targetView || 'adaptive-practice',
        actionLabel: 'Practice Now',
        source: 'Adaptive Question Intelligence',
        completed: completedKeys.has(pAct.actionKey || pAct.id),
        metadata: { fromQuestionIntelligence: true, skill: pAct.skill, difficulty: pAct.difficulty }
      });
    });
  }

  // Deduplicate by key
  const seenKeys = new Set();
  const uniqueActions = [];
  potentialActions.forEach(act => {
    if (!seenKeys.has(act.key)) {
      seenKeys.add(act.key);
      uniqueActions.push(act);
    }
  });

  // Sort strictly by priority weight descending
  uniqueActions.sort((a, b) => (b.weight || 0) - (a.weight || 0));

  // Cap strictly between 3 and 5 actions
  const boundedPlan = uniqueActions.slice(0, 5);
  const topPriority = boundedPlan.length > 0 ? boundedPlan[0] : null;
  const completedCount = boundedPlan.filter(a => a.completed).length;

  return {
    mode,
    topPriority,
    plan: boundedPlan,
    actions: boundedPlan,
    totalActions: boundedPlan.length,
    completedCount,
    readinessScore: readinessReport.score !== undefined ? readinessReport.score : null
  };
}

/**
 * 3. Calculates the preparation streak based strictly on real completed actions.
 * Never fabricates a streak. Returns 0 if no historical completions exist.
 */
export function computePreparationStreak(completedActions = []) {
  if (!Array.isArray(completedActions) || completedActions.length === 0) {
    return {
      currentStreak: 0,
      hasStreak: false,
      message: 'Start completing preparation actions to build your consistency.'
    };
  }

  // Extract unique active dates sorted descending (YYYY-MM-DD)
  const uniqueDates = Array.from(new Set(
    completedActions
      .map(a => {
        const d = a.action_date || a.created_at || a.completed_at;
        if (!d) return null;
        try {
          return new Date(d).toISOString().slice(0, 10);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  )).sort().reverse();

  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      hasStreak: false,
      message: 'Start completing preparation actions to build your consistency.'
    };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  // Check if latest completion was today or yesterday
  const latestDate = uniqueDates[0];
  const isActiveStreak = latestDate === todayStr || latestDate === yesterdayStr;

  if (!isActiveStreak) {
    return {
      currentStreak: 0,
      hasStreak: false,
      message: 'Start completing preparation actions to build your consistency.'
    };
  }

  let streak = 0;
  let expectedDate = new Date(latestDate);

  for (const dStr of uniqueDates) {
    const curDateStr = expectedDate.toISOString().slice(0, 10);
    if (dStr === curDateStr) {
      streak++;
      expectedDate = new Date(expectedDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  return {
    currentStreak: streak,
    hasStreak: streak > 0,
    message: streak > 0 ? `${streak} Day Streak 🔥` : 'Start completing preparation actions to build your consistency.'
  };
}

/**
 * 4. Aggregates weekly preparation activity (last 7 days).
 * Strictly reports verified candidate numbers; never invents % changes without comparison data.
 */
export function computeWeeklySummary(candidateData = {}) {
  const attempts = candidateData.attempts || candidateData.assessment_attempts || [];
  const resumes = candidateData.resumes || [];
  const interviews = candidateData.interviews || candidateData.mock_interviews || [];
  const applications = candidateData.applications || [];
  const completedActions = candidateData.completedActions || [];

  const now = Date.now();
  const weekCutoff = now - 7 * 86400000;

  const isRecent = (dateField) => {
    if (!dateField) return false;
    const t = new Date(dateField).getTime();
    return !isNaN(t) && t >= weekCutoff;
  };

  const actionsCompletedWeek = completedActions.filter(a => isRecent(a.completed_at || a.action_date)).length;
  const assessmentsCompletedWeek = attempts.filter(a => isRecent(a.created_at)).length;
  const interviewsCompletedWeek = interviews.filter(i => isRecent(i.created_at)).length;
  const resumesUpdatedWeek = resumes.filter(r => isRecent(r.created_at)).length;
  const applicationsSubmittedWeek = applications.filter(a => isRecent(a.applied_at || a.created_at)).length;

  return {
    actionsCompleted: actionsCompletedWeek,
    assessmentsCompleted: assessmentsCompletedWeek,
    interviewsCompleted: interviewsCompletedWeek,
    resumesUpdated: resumesUpdatedWeek,
    applicationsSubmitted: applicationsSubmittedWeek,
    totalEngagements: actionsCompletedWeek + assessmentsCompletedWeek + interviewsCompletedWeek + resumesUpdatedWeek + applicationsSubmittedWeek
  };
}

/**
 * 5. Generates grounded preparation insights.
 * Explicitly distinguishes observed facts from recommendations.
 */
export function generatePreparationInsights(candidateData = {}) {
  const attempts = candidateData.attempts || candidateData.assessment_attempts || [];
  const readinessReport = candidateData.readinessReport || {};
  const userSkills = candidateData.userSkills || candidateData.user_skills || [];
  const latestResume = candidateData.latestResume || (candidateData.resumes && candidateData.resumes[0]) || null;

  let strongestImprovement = null;
  let biggestBlocker = null;
  let recommendedFocus = null;

  // A. Strongest Improvement: ONLY if at least 2 real scores exist for the same category
  const attemptsByCategory = {};
  attempts.forEach(a => {
    const cat = a.category || a.assessment_title || 'General';
    if (!attemptsByCategory[cat]) attemptsByCategory[cat] = [];
    attemptsByCategory[cat].push({
      score: Number(a.score_percent) || 0,
      date: new Date(a.created_at || 0).getTime()
    });
  });

  for (const [cat, history] of Object.entries(attemptsByCategory)) {
    if (history.length >= 2) {
      const sorted = history.sort((a, b) => a.date - b.date);
      const firstScore = sorted[0].score;
      const lastScore = sorted[sorted.length - 1].score;
      const diff = lastScore - firstScore;
      if (diff > 0) {
        strongestImprovement = {
          category: cat,
          diff,
          message: `Your latest ${cat} score increased from ${firstScore}% to ${lastScore}% (+${diff}%).`
        };
        break;
      }
    }
  }

  // B. Biggest Blocker: Based on lowest evaluated pillar or critical skill
  if (readinessReport.priorityGap && readinessReport.priorityGap.gap > 0) {
    const gap = readinessReport.priorityGap;
    biggestBlocker = {
      title: gap.name,
      score: gap.score,
      target: gap.targetBenchmark,
      deficit: gap.gap,
      message: `${gap.name} is currently ${gap.score}/100 against a campus benchmark of ${gap.targetBenchmark}%.`
    };
  } else if (latestResume && latestResume.ats_score !== undefined && latestResume.ats_score < 85) {
    biggestBlocker = {
      title: 'Resume ATS',
      score: latestResume.ats_score,
      target: 85,
      deficit: 85 - latestResume.ats_score,
      message: `Resume ATS score is ${latestResume.ats_score}/100, which is below the 85% campus benchmark.`
    };
  }

  // C. Recommended Focus
  if (biggestBlocker) {
    recommendedFocus = `Focus on closing the gap in ${biggestBlocker.title} through targeted drills and practice.`;
  } else if (readinessReport.score >= 90) {
    recommendedFocus = 'Continue mock interview simulations and monitor newly opened campus recruitment drives.';
  } else {
    recommendedFocus = 'Complete pending assessments to evaluate your full 7-pillar placement readiness.';
  }

  return {
    strongestImprovement,
    biggestBlocker,
    recommendedFocus
  };
}
