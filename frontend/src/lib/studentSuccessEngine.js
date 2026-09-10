/**
 * studentSuccessEngine.js
 * -----------------------------------------------------------------------------
 * Modern Placement Launchpad - Phase 17
 * AI Placement Personalization & Student Success Engine
 *
 * Core Principles:
 * 1. Zero Data Fabrication: Every blocker, priority, stage, and weekly recommendation
 *    is strictly derived from authentic candidate assessments, skills, resumes,
 *    interviews, applications, and campus placement drives.
 * 2. Unified Intelligence Layer: Sits strictly ABOVE all existing engines:
 *    - Placement Readiness Index (placementReadinessEngine.js)
 *    - Skill Gap Engine (skillGapEngine.js)
 *    - Personalized Learning Path Engine (learningPathEngine.js)
 *    - Resume ATS Engine (resumeAtsEngine.js)
 *    - Mock Interview & Communication Intelligence (interviewIntelligenceEngine.js)
 *    - Opportunity Intelligence & Campus Drives (opportunityIntelligenceEngine.js)
 *    - Adaptive Question Intelligence (questionIntelligenceEngine.js)
 *    - Application Pipeline Engine (applicationPipelineEngine.js)
 *    - Daily Preparation Workspace (dailyPreparationEngine.js)
 * 3. 7 Descriptive Student Readiness Stages (Without replacing Phase 5 numeric score):
 *    - Getting Started
 *    - Building Foundation
 *    - Developing Skills
 *    - Interview Preparation
 *    - Placement Active
 *    - Almost Ready
 *    - Placement Ready
 * 4. Critical Blocker Diagnosis: Isolates what is holding THIS candidate back.
 * 5. Personalized Weekly Strategy ("This Week"): Clear, high-leverage focus
 *    avoiding student overwhelm, plus explicit "What to Ignore" guidance.
 * 6. Fastest Path to Readiness: Mathematically models the top 3 highest-yield
 *    actions that produce the largest numeric boost in placement readiness.
 * -----------------------------------------------------------------------------
 */

import { computePlacementReadiness, READINESS_PILLARS } from './placementReadinessEngine.js';
import { computeSkillGaps } from './skillGapEngine.js';
import { generatePersonalizedLearningPath } from './learningPathEngine.js';
import { buildFullInterviewIntelligence } from './interviewIntelligenceEngine.js';
import { classifyOpportunityDeadline, computeOpportunityPriority } from './opportunityIntelligenceEngine.js';
import { selectAdaptiveQuestions } from './questionIntelligenceEngine.js';
import { calculateApplicationStatistics, getUpcomingApplicationEvent } from './applicationPipelineEngine.js';

// 7 Descriptive Student Readiness Stages
export const STUDENT_READINESS_STAGES = {
  GETTING_STARTED: {
    id: 'getting_started',
    label: 'Getting Started',
    color: 'slate',
    variant: 'neutral',
    headline: 'Welcome to your placement preparation journey!',
    description: 'No diagnostic assessments completed. Benchmark your baseline capabilities to unlock personalized guidance.'
  },
  BUILDING_FOUNDATION: {
    id: 'building_foundation',
    label: 'Building Foundation',
    color: 'amber',
    variant: 'warning',
    headline: 'Foundational screening skills in development.',
    description: 'Initial benchmarking completed. Focus on establishing core programming, basic DSA, and aptitude foundations.'
  },
  DEVELOPING_SKILLS: {
    id: 'developing_skills',
    label: 'Developing Skills',
    color: 'blue',
    variant: 'primary',
    headline: 'Core competencies progressing well.',
    description: 'Remediate critical technical skill gaps below the 60% cutoff to clear online recruitment screening rounds.'
  },
  INTERVIEW_PREPARATION: {
    id: 'interview_preparation',
    label: 'Interview Preparation',
    color: 'indigo',
    variant: 'primary',
    headline: 'Technical screening benchmarks solid.',
    description: 'Refine verbal technical articulation, STAR behavioral structure, and simulation fluency for face-to-face rounds.'
  },
  PLACEMENT_ACTIVE: {
    id: 'placement_active',
    label: 'Placement Active',
    color: 'purple',
    variant: 'purple',
    headline: 'Active recruitment rounds & upcoming deadlines.',
    description: 'Actively applying to campus recruitment drives with approaching deadlines and scheduled interview rounds.'
  },
  ALMOST_READY: {
    id: 'almost_ready',
    label: 'Almost Ready',
    color: 'emerald',
    variant: 'success',
    headline: 'Approaching top-tier placement benchmarks!',
    description: 'Exceeding 75% across core dimensions. Close final edge-case gaps to maximize Tier-1 selection probability.'
  },
  PLACEMENT_READY: {
    id: 'placement_ready',
    label: 'Placement Ready',
    color: 'emerald',
    variant: 'success',
    headline: 'Placement Benchmark Cleared! (Top Percentile)',
    description: 'High readiness score (>= 85%). Maintain fluency with periodic revision drills and focus on company-specific final rounds.'
  }
};

/**
 * Normalizes candidate context with safe array fallbacks to prevent runtime errors.
 */
function normalizeContext(candidateContext = {}) {
  return {
    ...candidateContext,
    profile: candidateContext.profile || {},
    attempts: Array.isArray(candidateContext.attempts) ? candidateContext.attempts : [],
    userSkills: Array.isArray(candidateContext.userSkills) ? candidateContext.userSkills : [],
    courses: Array.isArray(candidateContext.courses) ? candidateContext.courses : [],
    courseProgress: Array.isArray(candidateContext.courseProgress) ? candidateContext.courseProgress : [],
    resumes: Array.isArray(candidateContext.resumes) ? candidateContext.resumes : [],
    latestResume: candidateContext.latestResume || (Array.isArray(candidateContext.resumes) && candidateContext.resumes.length > 0 ? candidateContext.resumes[0] : null),
    interviews: Array.isArray(candidateContext.interviews) ? candidateContext.interviews : [],
    applications: Array.isArray(candidateContext.applications) ? candidateContext.applications : [],
    opportunities: Array.isArray(candidateContext.opportunities) ? candidateContext.opportunities : []
  };
}

/**
 * Determines candidate descriptive readiness stage without mutating Phase 5 score.
 */
export function determineStudentReadinessStage(candidateContext = {}, readinessScore = null) {
  const safe = normalizeContext(candidateContext);
  const score = readinessScore !== null && readinessScore !== undefined
    ? Number(readinessScore)
    : (safe.readinessReport?.score ?? null);

  const totalAttempts = safe.attempts.length;
  const totalSkills = safe.userSkills.length;

  // 1. Getting Started: Zero diagnostic data
  if (totalAttempts === 0 && totalSkills === 0 && score === null) {
    return STUDENT_READINESS_STAGES.GETTING_STARTED;
  }

  // 2. Placement Active: Candidate has upcoming scheduled events or urgent applications
  const upcomingEvent = getUpcomingApplicationEvent(safe.applications);
  const daysLeft = upcomingEvent?.daysLeft ?? upcomingEvent?.days_left;
  if (upcomingEvent && upcomingEvent.hasEvent && daysLeft !== null && daysLeft !== undefined && daysLeft <= 14 && score !== null && score >= 55) {
    return STUDENT_READINESS_STAGES.PLACEMENT_ACTIVE;
  }

  // 3. Score-based stage classification
  if (score === null || score === 0) {
    return STUDENT_READINESS_STAGES.GETTING_STARTED;
  }
  if (score < 50) {
    return STUDENT_READINESS_STAGES.BUILDING_FOUNDATION;
  }
  if (score < 65) {
    return STUDENT_READINESS_STAGES.DEVELOPING_SKILLS;
  }
  if (score < 75) {
    return STUDENT_READINESS_STAGES.INTERVIEW_PREPARATION;
  }
  if (score < 85) {
    return STUDENT_READINESS_STAGES.ALMOST_READY;
  }
  return STUDENT_READINESS_STAGES.PLACEMENT_READY;
}

/**
 * Identifies genuine critical blockers preventing candidate from reaching readiness.
 */
export function identifyCriticalBlockers(candidateContext = {}) {
  const safe = normalizeContext(candidateContext);
  const blockers = [];
  const resumeToInspect = safe.latestResume;

  // Blocker 1: Zero Diagnostic Assessments
  if (safe.attempts.length === 0) {
    blockers.push({
      id: 'blocker-no-assessments',
      type: 'assessment',
      title: 'No Diagnostic Assessments Completed',
      severity: 'critical',
      impact: 'Blocks Skill Gap calculation, roadmap prioritization, and drive match benchmarking.',
      reason: 'Recruiters filter by technical screening scores. Complete your first test to benchmark capabilities.',
      actionText: 'Take Diagnostic Assessment',
      actionRoute: 'assessments',
      source: 'Diagnostic Assessments'
    });
  }

  // Blocker 2: Critical Technical Skill Gaps (< 60%)
  const critical = safe.userSkills.filter(us => {
    const score = us.score !== undefined ? us.score : (us.proficiency !== undefined ? us.proficiency : null);
    return score !== null && !isNaN(score) && Number(score) < 60;
  });

  for (const c of critical) {
    const sName = c.skill_name || c.skill || c.name || 'Technical Skill';
    const sScore = c.score ?? c.proficiency;
    blockers.push({
      id: `blocker-skill-${sName.toLowerCase()}`,
      type: 'skill_gap',
      title: `Critical Gap in ${sName} (${sScore}%)`,
      severity: 'critical',
      impact: `Scored ${sScore}%, below the 60% screening cutoff. High risk of elimination in online coding rounds.`,
      reason: `Campus recruitment drives enforce a 60% minimum technical bar in ${sName}.`,
      actionText: `Practice ${sName} Questions`,
      actionRoute: 'adaptive-practice',
      source: 'Skill Gap Engine',
      metadata: { skill: sName, score: sScore }
    });
  }

  // Blocker 3: Missing or Low Resume ATS Score (< 65%)
  if (!resumeToInspect) {
    blockers.push({
      id: 'blocker-no-resume',
      type: 'resume',
      title: 'No Verified Resume on File',
      severity: 'high',
      impact: 'Automated campus ATS screening systems will reject unverified applications.',
      reason: 'Upload your resume to audit role-relevant keywords, section formatting, and contact metadata.',
      actionText: 'Upload Resume for ATS Audit',
      actionRoute: 'resume',
      source: 'Resume ATS Engine'
    });
  } else {
    const atsScore = Number(resumeToInspect.ats_score ?? resumeToInspect.atsScore ?? 0);
    if (atsScore < 65) {
      blockers.push({
        id: 'blocker-low-ats',
        type: 'resume',
        title: `Low Resume ATS Score (${atsScore}/100)`,
        severity: 'high',
        impact: 'Resume is at risk of automated rejection by campus screening parsers before reaching technical managers.',
        reason: 'Missing critical keywords and quantified impact metrics aligned with your preferred role.',
        actionText: 'Review ATS Recommendations',
        actionRoute: 'resume',
        source: 'Resume ATS Engine',
        metadata: { atsScore }
      });
    }
  }

  // Blocker 4: Mock Interview Deficit / Unassessed
  if (safe.interviews.length === 0) {
    blockers.push({
      id: 'blocker-no-interview',
      type: 'interview',
      title: 'Mock Interview Performance Unassessed',
      severity: 'medium',
      impact: 'Candidate has not benchmarked verbal technical explanation or STAR behavioral responses.',
      reason: 'Technical screening rounds require clear articulation of architecture, trade-offs, and project challenges.',
      actionText: 'Simulate Technical Mock Interview',
      actionRoute: 'interview',
      source: 'Mock Interview Engine'
    });
  } else {
    const latestInt = safe.interviews[0];
    const intScore = Number(latestInt.overall_score ?? latestInt.overallScore ?? 0);
    if (intScore < 60) {
      blockers.push({
        id: 'blocker-low-interview',
        type: 'interview',
        title: `Interview Performance Deficit (${intScore}%)`,
        severity: 'high',
        impact: 'Struggles with verbal trade-offs and structured STAR storytelling in past simulations.',
        reason: 'Technical and HR rounds eliminate candidates who cannot clearly articulate their code and projects.',
        actionText: 'Practice Mock Interview',
        actionRoute: 'interview',
        source: 'Mock Interview Engine',
        metadata: { score: intScore }
      });
    }
  }

  // Blocker 5: Urgent Scheduled Event
  const upcomingEvent = getUpcomingApplicationEvent(safe.applications);
  const daysLeft = upcomingEvent?.daysLeft ?? upcomingEvent?.days_left;
  if (upcomingEvent && upcomingEvent.hasEvent && daysLeft !== null && daysLeft !== undefined && daysLeft <= 5) {
    const comp = upcomingEvent.company || upcomingEvent.company_name || 'Campus Drive';
    const evType = upcomingEvent.type || upcomingEvent.event_type || 'milestone';
    blockers.push({
      id: 'blocker-upcoming-round',
      type: 'application',
      title: `Scheduled ${evType}: ${comp} in ${daysLeft} days`,
      severity: 'critical',
      impact: `Imminent recruitment milestone on ${upcomingEvent.eventDate || 'approaching date'}.`,
      reason: `Prioritize round-specific drills for ${comp} immediately.`,
      actionText: `Prepare for ${comp}`,
      actionRoute: 'applications',
      source: 'Application Pipeline',
      metadata: { event: upcomingEvent }
    });
  }

  // Sort blockers by severity: critical -> high -> medium
  const severityWeight = { critical: 100, high: 60, medium: 20 };
  blockers.sort((a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0));

  return blockers;
}

/**
 * Calculates the top 3 highest-yield steps that raise the Placement Readiness Index fastest.
 */
export function calculateFastestPathToReadiness(candidateContext = {}, readinessReport = null) {
  const safe = normalizeContext(candidateContext);
  const report = readinessReport || safe.readinessReport || computePlacementReadiness(safe);
  const pillars = report?.pillars || [];
  const suggestions = [];

  for (const p of pillars) {
    const score = p.score ?? (p.available ? 0 : null);
    const benchmark = p.targetBenchmark || 80;
    const currentScore = score !== null ? score : 0;
    const gap = Math.max(0, benchmark - currentScore);

    if (gap > 0) {
      const potentialGain = Math.round((gap * (p.baseWeight / 100)) * 10) / 10;
      
      let actionTitle = `Elevate ${p.name}`;
      let actionDesc = `Raise ${p.shortName} from ${currentScore}% to benchmark (${benchmark}%).`;
      let route = p.actionTarget || 'dashboard';

      if (p.id === 'dsa') {
        actionTitle = `Targeted DSA Problem Solving`;
        actionDesc = `Close ${gap}pt gap in dynamic programming and tree traversals (+${potentialGain} readiness pts).`;
        route = 'adaptive-practice';
      } else if (p.id === 'tech') {
        actionTitle = `Adaptive Technical Drills`;
        actionDesc = `Elevate core technical skills by ${gap} points (+${potentialGain} readiness pts).`;
        route = 'adaptive-practice';
      } else if (p.id === 'resume') {
        actionTitle = `Resume ATS Optimization`;
        actionDesc = `Incorporate missing keywords and quantified metrics (+${potentialGain} readiness pts).`;
        route = 'resume';
      } else if (p.id === 'interview') {
        actionTitle = `Mock Interview Simulation`;
        actionDesc = `Complete simulation to raise verbal articulation benchmark (+${potentialGain} readiness pts).`;
        route = 'interview';
      } else if (p.id === 'aptitude') {
        actionTitle = `Quantitative Aptitude Screening`;
        actionDesc = `Complete speed math and logical reasoning drills (+${potentialGain} readiness pts).`;
        route = 'assessments';
      }

      suggestions.push({
        pillarId: p.id,
        pillarName: p.name,
        potentialGain,
        currentScore,
        targetBenchmark: benchmark,
        gap,
        actionTitle,
        actionDesc,
        route
      });
    }
  }

  suggestions.sort((a, b) => b.potentialGain - a.potentialGain);
  return suggestions.slice(0, 3);
}

/**
 * Generates the focused "This Week" placement strategy.
 */
export function generatePersonalizedWeeklyStrategy(candidateContext = {}) {
  const safe = normalizeContext(candidateContext);
  const readinessReport = safe.readinessReport || (safe.attempts.length > 0 || safe.userSkills.length > 0 ? computePlacementReadiness(safe) : null);
  const readinessScore = readinessReport?.score ?? null;
  const stage = determineStudentReadinessStage(safe, readinessScore);
  const blockers = identifyCriticalBlockers(safe);
  const fastestPath = calculateFastestPathToReadiness(safe, readinessReport);

  // 1. Determine Primary Skill Gap
  let primarySkillGap = null;
  const criticalSkills = safe.userSkills.filter(s => {
    const sc = s.score ?? s.proficiency;
    return sc !== null && !isNaN(sc) && Number(sc) < 60;
  });

  if (criticalSkills.length > 0) {
    criticalSkills.sort((a, b) => (Number(a.score ?? a.proficiency) - Number(b.score ?? b.proficiency)));
    primarySkillGap = {
      skill: criticalSkills[0].skill_name || criticalSkills[0].skill,
      score: Number(criticalSkills[0].score ?? criticalSkills[0].proficiency),
      isCritical: true
    };
  } else if (readinessReport?.priorityGap) {
    primarySkillGap = {
      skill: readinessReport.priorityGap.shortName || readinessReport.priorityGap.name,
      score: readinessReport.priorityGap.score,
      isCritical: false
    };
  }

  // 2. Identify Most Urgent Opportunity
  let urgentOpportunity = null;
  if (safe.opportunities.length > 0) {
    for (const opp of safe.opportunities) {
      const deadlineInfo = opp.deadline || classifyOpportunityDeadline(opp.application_deadline);
      if (deadlineInfo && (deadlineInfo.status === 'closing_today' || deadlineInfo.status === 'closing_tomorrow' || deadlineInfo.status === 'closing_soon')) {
        urgentOpportunity = {
          ...opp,
          deadlineInfo
        };
        break;
      }
    }
  }

  // 3. Formulate Top Priority
  let topPriority = {
    title: 'Complete Initial Diagnostic Assessment',
    description: 'Benchmarking your capabilities is required to generate your personalized placement roadmap.',
    actionRoute: 'assessments',
    actionText: 'Take Diagnostic Assessment',
    reason: 'Zero baseline assessments recorded on file.'
  };

  if (blockers.length > 0) {
    const topBlocker = blockers[0];
    topPriority = {
      title: topBlocker.title,
      description: topBlocker.impact,
      actionRoute: topBlocker.actionRoute,
      actionText: topBlocker.actionText,
      reason: topBlocker.reason
    };
  } else if (urgentOpportunity) {
    topPriority = {
      title: `Prepare for ${urgentOpportunity.company_name} Campus Drive`,
      description: `Application deadline is approaching (${urgentOpportunity.deadlineInfo.label}). Verify requirements and submit your application.`,
      actionRoute: 'job-opportunities',
      actionText: 'View Campus Drive',
      reason: `Drive deadline is urgent.`
    };
  } else if (fastestPath.length > 0) {
    const topStep = fastestPath[0];
    topPriority = {
      title: topStep.actionTitle,
      description: topStep.actionDesc,
      actionRoute: topStep.route,
      actionText: 'Start Action',
      reason: `Yields the highest readiness index improvement (+${topStep.potentialGain} pts).`
    };
  }

  // 4. Formulate Concrete Weekly Actions (Bounded to 4 maximum)
  const actions = {
    skillAction: primarySkillGap ? {
      title: `Practice 5 Adaptive ${primarySkillGap.skill} Questions`,
      description: `Close gap in ${primarySkillGap.skill} (${primarySkillGap.score}% evaluated score).`,
      route: 'adaptive-practice',
      actionText: 'Start Practice',
      skill: primarySkillGap.skill
    } : {
      title: 'Complete Daily Adaptive Practice Drill',
      description: 'Practice high-frequency placement questions.',
      route: 'adaptive-practice',
      actionText: 'Start Practice'
    },

    resumeAction: (!safe.latestResume && safe.resumes.length === 0) ? {
      title: 'Upload Resume for ATS Audit',
      description: 'Verify keyword density and formatting before applying.',
      route: 'resume',
      actionText: 'Upload Resume'
    } : (safe.latestResume?.ats_score < 70) ? {
      title: 'Optimize Resume ATS Score',
      description: `Current score is ${safe.latestResume.ats_score}/100. Add missing technical keywords.`,
      route: 'resume',
      actionText: 'Review ATS Insights'
    } : null,

    interviewAction: (safe.interviews.length === 0) ? {
      title: 'Complete First Mock Interview Simulation',
      description: 'Practice articulating technical concepts under simulated timer constraints.',
      route: 'interview',
      actionText: 'Start Mock Interview'
    } : (safe.interviews[0]?.overall_score < 70) ? {
      title: 'Practice Verbal Technical Articulation',
      description: `Elevate interview score from ${safe.interviews[0].overall_score}% with a focused simulation.`,
      route: 'interview',
      actionText: 'Simulate Interview'
    } : null,

    applicationAction: urgentOpportunity ? {
      title: `Apply to ${urgentOpportunity.company_name}`,
      description: `Drive closes soon: ${urgentOpportunity.deadlineInfo.label}.`,
      route: 'job-opportunities',
      actionText: 'Review Drive'
    } : null
  };

  // 5. Strategic "What to Ignore" Guidance (Protects student from cognitive overload)
  let whatToIgnore = 'Maintain focus on your primary skill gap and active learning path modules.';
  if (primarySkillGap && primarySkillGap.isCritical) {
    whatToIgnore = `Ignore advanced distributed architectures or mass-applying to campus drives for now. Focus 80% of your prep time on bringing ${primarySkillGap.skill} above the 60% screening cutoff.`;
  } else if (!safe.latestResume && safe.resumes.length === 0) {
    whatToIgnore = 'Do not apply to campus recruitment portals without auditing your resume. Unformatted resumes are filtered automatically by ATS scanners.';
  } else if (stage.id === 'interview_preparation') {
    whatToIgnore = 'Avoid repeating basic syntax assessments. Shift your focus from multiple-choice tests to speaking technical trade-offs out loud.';
  } else if (stage.id === 'placement_ready') {
    whatToIgnore = 'Do not burn time re-studying foundational courses from scratch. Maintain fluency through quick 10-minute adaptive drills and company-specific interview prep.';
  }

  return {
    stage,
    readinessScore,
    topPriority,
    primarySkillGap,
    urgentOpportunity,
    fastestPathToReadiness: fastestPath,
    actions,
    whatToIgnore,
    reason: `Selected to address ${topPriority.title.toLowerCase()} as the highest-impact placement lever.`
  };
}

/**
 * Master Placement Personalization Strategy Engine
 * Returns unified student placement strategy combining all platform dimensions.
 */
export function generatePlacementStrategy(candidateContext = {}) {
  const safe = normalizeContext(candidateContext);

  const readinessReport = safe.readinessReport || (safe.attempts.length > 0 || safe.userSkills.length > 0 ? computePlacementReadiness(safe) : null);
  const skillGapReport = safe.skillGapReport || computeSkillGaps(safe.attempts, safe.userSkills, safe.courses);
  const interviewIntelligence = safe.interviewIntelligence || buildFullInterviewIntelligence(safe.interviews, safe);

  const contextWithReports = {
    ...safe,
    readinessReport,
    skillGapReport,
    interviewIntelligence
  };

  const readinessScore = readinessReport?.score ?? null;
  const stage = determineStudentReadinessStage(contextWithReports, readinessScore);
  const blockers = identifyCriticalBlockers(contextWithReports);
  const weeklyStrategy = generatePersonalizedWeeklyStrategy(contextWithReports);
  const fastestPath = calculateFastestPathToReadiness(contextWithReports, readinessReport);

  return {
    stage,
    readinessScore,
    readinessReport,
    blockers,
    hasBlockers: blockers.length > 0,
    topBlocker: blockers[0] || null,
    weeklyStrategy,
    fastestPathToReadiness: fastestPath,
    primarySkillGap: weeklyStrategy.primarySkillGap,
    urgentOpportunity: weeklyStrategy.urgentOpportunity,
    whatToIgnore: weeklyStrategy.whatToIgnore
  };
}
