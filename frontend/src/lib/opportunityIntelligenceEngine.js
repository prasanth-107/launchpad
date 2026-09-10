/**
 * opportunityIntelligenceEngine.js
 * -----------------------------------------------------------------------------
 * Modern Placement Launchpad - Phase 14
 * Placement Drive Intelligence & Smart Opportunity Discovery Engine
 *
 * Core Principles:
 * 1. Zero Hallucinated Opportunities: Relies exclusively on genuine catalog data.
 * 2. Deterministic Eligibility Checks:
 *    - 'eligible': Explicitly verified criteria pass.
 *    - 'not_eligible': Criteria explicitly failed.
 *    - 'eligibility_unknown': Missing candidate data prevents false pass or false fail.
 * 3. Proportional Missing-Data Normalization: Unassessed dimensions are omitted;
 *    weights are renormalized across available evidence.
 * 4. Grounded Priority Scoring: Evaluates match, eligibility, deadlines, and application state.
 * 5. Transparent "Why this matches you": Explanations strictly grounded in candidate data.
 * 6. Skill Gap -> Course & Preparation Workspace loop.
 * -----------------------------------------------------------------------------
 */

import {
  PLACEMENT_OPPORTUNITIES_CATALOG,
  evaluateCandidateEligibility,
  computeJobMatchScore,
  explainJobMatch,
  SKILL_COURSE_MAPPING
} from './jobMatchingEngine.js';

// Deadline Urgency Constants
export const DEADLINE_URGENCY = {
  CLOSING_TODAY: 'closing_today',
  CLOSING_TOMORROW: 'closing_tomorrow',
  CLOSING_SOON: 'closing_soon',
  OPEN: 'open',
  CLOSED: 'closed',
  NO_DEADLINE: 'no_deadline'
};

// Priority Tier Identifiers
export const PRIORITY_TIERS = {
  HIGH_PRIORITY: 'high_priority',
  GOOD_OPPORTUNITY: 'good_opportunity',
  CONSIDER_LATER: 'consider_later',
  LOW_PRIORITY: 'low_priority',
  ELIGIBILITY_UNKNOWN: 'eligibility_unknown',
  NOT_ELIGIBLE: 'not_eligible'
};

// Priority Tier Detailed Configuration
export const PRIORITY_CONFIG = {
  high_priority: {
    tier: 'high_priority',
    label: 'High Priority',
    variant: 'rose',
    bg: 'bg-rose-50',
    color: 'text-rose-700',
    border: 'border-rose-200',
    baseWeight: 100,
    rank: 1
  },
  good_opportunity: {
    tier: 'good_opportunity',
    label: 'Good Opportunity',
    variant: 'primary',
    bg: 'bg-indigo-50',
    color: 'text-indigo-700',
    border: 'border-indigo-200',
    baseWeight: 80,
    rank: 2
  },
  consider_later: {
    tier: 'consider_later',
    label: 'Consider Later',
    variant: 'warning',
    bg: 'bg-amber-50',
    color: 'text-amber-700',
    border: 'border-amber-200',
    baseWeight: 60,
    rank: 3
  },
  low_priority: {
    tier: 'low_priority',
    label: 'Low Priority',
    variant: 'neutral',
    bg: 'bg-slate-100',
    color: 'text-slate-700',
    border: 'border-slate-200',
    baseWeight: 40,
    rank: 4
  },
  eligibility_unknown: {
    tier: 'eligibility_unknown',
    label: 'Eligibility Unknown',
    variant: 'warning',
    bg: 'bg-amber-50',
    color: 'text-amber-800',
    border: 'border-amber-300',
    baseWeight: 30,
    rank: 5
  },
  not_eligible: {
    tier: 'not_eligible',
    label: 'Not Eligible',
    variant: 'danger',
    bg: 'bg-rose-100',
    color: 'text-rose-800',
    border: 'border-rose-300',
    baseWeight: 10,
    rank: 6
  }
};

/**
 * 1. DEADLINE INTELLIGENCE
 * Classifies application deadlines into explicit urgency buckets without date fabrication.
 */
export function classifyOpportunityDeadline(deadlineIso) {
  if (!deadlineIso) {
    return {
      status: DEADLINE_URGENCY.NO_DEADLINE,
      urgency: DEADLINE_URGENCY.NO_DEADLINE,
      label: 'Rolling Recruitment',
      daysLeft: null,
      isUrgent: false,
      isExpired: false,
      badgeVariant: 'neutral',
      badgeBg: 'bg-slate-100',
      badgeColor: 'text-slate-600',
      border: 'border-slate-200'
    };
  }

  const deadline = new Date(deadlineIso);
  if (isNaN(deadline.getTime())) {
    return {
      status: DEADLINE_URGENCY.NO_DEADLINE,
      urgency: DEADLINE_URGENCY.NO_DEADLINE,
      label: 'Rolling Recruitment',
      daysLeft: null,
      isUrgent: false,
      isExpired: false,
      badgeVariant: 'neutral',
      badgeBg: 'bg-slate-100',
      badgeColor: 'text-slate-600',
      border: 'border-slate-200'
    };
  }

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs < 0) {
    return {
      status: DEADLINE_URGENCY.CLOSED,
      urgency: DEADLINE_URGENCY.CLOSED,
      label: 'Deadline Passed',
      daysLeft: 0,
      isUrgent: false,
      isExpired: true,
      badgeVariant: 'neutral',
      badgeBg: 'bg-slate-100',
      badgeColor: 'text-slate-500',
      border: 'border-slate-200'
    };
  }

  const diffDays = diffMs <= 24 * 60 * 60 * 1000 ? 0 : Math.round(diffMs / 86400000);

  if (diffMs <= 24 * 60 * 60 * 1000) {
    return {
      status: DEADLINE_URGENCY.CLOSING_TODAY,
      urgency: DEADLINE_URGENCY.CLOSING_TODAY,
      label: 'Closing Today',
      daysLeft: 0,
      isUrgent: true,
      isExpired: false,
      badgeVariant: 'danger',
      badgeBg: 'bg-rose-50',
      badgeColor: 'text-rose-700',
      border: 'border-rose-200'
    };
  }

  if (diffDays === 1) {
    return {
      status: DEADLINE_URGENCY.CLOSING_TOMORROW,
      urgency: DEADLINE_URGENCY.CLOSING_TOMORROW,
      label: 'Closing Tomorrow',
      daysLeft: 1,
      isUrgent: true,
      isExpired: false,
      badgeVariant: 'danger',
      badgeBg: 'bg-rose-50',
      badgeColor: 'text-rose-700',
      border: 'border-rose-200'
    };
  }

  if (diffDays <= 3) {
    return {
      status: DEADLINE_URGENCY.CLOSING_SOON,
      urgency: DEADLINE_URGENCY.CLOSING_SOON,
      label: `${diffDays} days left`,
      daysLeft: diffDays,
      isUrgent: true,
      isExpired: false,
      badgeVariant: 'warning',
      badgeBg: 'bg-amber-50',
      badgeColor: 'text-amber-700',
      border: 'border-amber-200'
    };
  }

  return {
    status: DEADLINE_URGENCY.OPEN,
    urgency: DEADLINE_URGENCY.OPEN,
    label: `${diffDays} days left`,
    daysLeft: diffDays,
    isUrgent: false,
    isExpired: false,
    badgeVariant: 'neutral',
    badgeBg: 'bg-slate-100',
    badgeColor: 'text-slate-700',
    border: 'border-slate-200'
  };
}

/**
 * 2. DETERMINISTIC PRIORITY SCORE
 * Evaluates match score, eligibility, deadline urgency, saved state, and application pipeline.
 */
export function computeOpportunityPriority({
  matchScore = null,
  eligibility = {},
  deadline = {},
  applicationStatus = null,
  isSaved = false
}) {
  let tierKey = 'good_opportunity';
  const isEligible = eligibility?.status === 'eligible';
  const isNotEligible = eligibility?.status === 'not_eligible';
  const isUnknown = eligibility?.status === 'eligibility_unknown';
  const isExpired = Boolean(deadline?.isExpired);
  const isApplied = Boolean(applicationStatus);

  if (isNotEligible) {
    tierKey = 'not_eligible';
  } else if (isUnknown) {
    tierKey = 'eligibility_unknown';
  } else if (isApplied || isExpired) {
    tierKey = 'low_priority';
  } else {
    // Eligible
    const mScore = matchScore !== null && matchScore !== undefined ? Number(matchScore) : 50;
    if (mScore >= 70) {
      tierKey = 'high_priority';
    } else if (mScore >= 50) {
      tierKey = 'good_opportunity';
    } else {
      tierKey = 'consider_later';
    }
  }

  const cfg = PRIORITY_CONFIG[tierKey];
  let calculatedScore = cfg.baseWeight;

  // Add small intra-tier boosts (<= 14 pts) so bands strictly stay within range:
  // High: 100 - 114
  // Good: 80 - 94
  // Consider: 60 - 74
  // Low: 40 - 54
  // Unknown: 30
  // Not Eligible: 10
  if (tierKey === 'high_priority' || tierKey === 'good_opportunity' || tierKey === 'consider_later') {
    if (matchScore !== null && matchScore !== undefined) {
      calculatedScore += Math.min(8, Math.round(((Number(matchScore) % 20) / 20) * 8));
    }
    const u = deadline?.urgency || deadline?.status;
    if (u === 'closing_today' || u === 'closing_tomorrow' || u === 'closing_soon') {
      calculatedScore += 5;
    }
    if (isSaved) {
      calculatedScore += 1;
    }
  } else if (tierKey === 'low_priority') {
    if (matchScore !== null && matchScore !== undefined) {
      calculatedScore += Math.min(8, Math.round((Number(matchScore) / 100) * 8));
    }
  }

  const canApply = isEligible && !isExpired && !isApplied;

  return {
    ...cfg,
    tier: cfg.tier,
    score: calculatedScore,
    canApply,
    isApplied
  };
}

/**
 * 3. GROUNDED MATCH EXPLANATION GENERATOR
 * Generates transparent "Why this matches you" explanations based on real student data.
 */
export function generateMatchExplanation(candidateData = {}, opportunity = {}, matchResult = null) {
  const match = matchResult || computeJobMatchScore(candidateData, opportunity);
  const explanation = match.explanation || explainJobMatch(candidateData, opportunity) || {};
  const reasons = [];

  const matchedSkills = explanation.matchedSkills || explanation.strongMatches || [];
  const missingSkills = explanation.missingSkills || [];

  // A. Strong Skills
  if (matchedSkills.length > 0) {
    const topMatched = matchedSkills.slice(0, 3).map(m => m.name || m).join(', ');
    reasons.push(`Strong verified competencies in ${topMatched}.`);
  }

  // B. Resume ATS Evidence
  const resume = candidateData.latestResume || (candidateData.resumes && candidateData.resumes[0]) || null;
  const atsScore = resume?.ats_score ?? resume?.atsScore ?? null;
  if (atsScore !== null && atsScore >= 75) {
    reasons.push(`Your ATS score (${atsScore}/100) clears campus recruitment screening.`);
  } else if (atsScore !== null && atsScore < 65) {
    reasons.push(`Resume ATS score (${atsScore}/100) is below target (85%); update keywords before applying.`);
  }

  // C. Assessment & DSA Evidence
  const attempts = candidateData.attempts || candidateData.assessment_attempts || [];
  const dsaAttempts = attempts.filter(a => {
    const title = (a.category || a.assessment_title || a.domain || '').toLowerCase();
    return title.includes('data structure') || title.includes('dsa') || title.includes('technical') || title.includes('algorithm');
  });
  if (dsaAttempts.length > 0) {
    const bestDsa = Math.max(...dsaAttempts.map(a => Number(a.score_percent) || 0));
    if (bestDsa >= 75) {
      reasons.push(`Technical assessment benchmark cleared with ${bestDsa}% performance.`);
    } else {
      reasons.push(`Technical assessment (${bestDsa}%) needs improvement before recruitment rounds.`);
    }
  }

  // D. Role Alignment
  const preferredRole = (candidateData.profile?.preferred_job_role || '').toLowerCase();
  const oppTitle = (opportunity.role_title || '').toLowerCase();
  if (preferredRole && oppTitle.includes(preferredRole)) {
    reasons.push(`Direct alignment with your preferred career track (${candidateData.profile.preferred_job_role}).`);
  }

  // Fallback if no specific telemetry triggers
  if (reasons.length === 0) {
    if (missingSkills.length > 0) {
      const missingList = missingSkills.slice(0, 2).map(s => s.name || s).join(', ');
      reasons.push(`Missing key required competencies: ${missingList}. Complete recommended preparation.`);
    } else {
      reasons.push('Evaluate assessments and audit your resume to generate a complete match breakdown.');
    }
  }

  return {
    whyMatches: reasons,
    matchedSkills,
    missingSkills
  };
}

/**
 * 4. MAP MISSING SKILLS TO CANONICAL COURSES
 * Connects job gaps to genuine Phase 6 registered courses.
 */
export function mapMissingSkillsToCourses(missingSkills = []) {
  const recommendations = [];
  const seenCourses = new Set();
  const unmappedSkills = [];

  missingSkills.forEach(sk => {
    const sName = (typeof sk === 'string' ? sk : (sk.name || '')).trim();
    const sNameLower = sName.toLowerCase();
    let matchedMapping = null;

    for (const [key, mapping] of Object.entries(SKILL_COURSE_MAPPING)) {
      if (sNameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(sNameLower)) {
        matchedMapping = mapping;
        break;
      }
    }

    if (matchedMapping && !seenCourses.has(matchedMapping.courseId)) {
      seenCourses.add(matchedMapping.courseId);
      recommendations.push({
        courseId: matchedMapping.courseId,
        courseTitle: matchedMapping.courseTitle,
        targetCategory: matchedMapping.targetCategory,
        skill: sName,
        missingSkill: sName,
        reason: `Closes missing skill requirement: ${sName}`,
        priority: sk.isRequired ? 'High' : 'Medium'
      });
    } else if (!matchedMapping) {
      unmappedSkills.push(sName);
    }
  });

  let fallbackMessage = null;
  if (unmappedSkills.length > 0) {
    fallbackMessage = `No matching course available yet for: ${unmappedSkills.join(', ')}.`;
  } else if (recommendations.length === 0) {
    fallbackMessage = 'No matching course available yet.';
  }

  return {
    recommendations,
    hasRecommendations: recommendations.length > 0,
    fallbackMessage
  };
}

/**
 * 5. SMART DETERMINISTIC OPPORTUNITY RANKING
 * Orders opportunities favoring eligible, high-priority, high-match, and urgent deadlines.
 */
export function rankOpportunities(opportunities = [], sortBy = 'recommended', candidateData = {}) {
  const safeList = Array.isArray(opportunities) ? [...opportunities] : [];

  return safeList.sort((a, b) => {
    if (sortBy === 'recommended') {
      // 1. Ineligible always down
      const aElig = a.eligibility?.status || 'eligibility_unknown';
      const bElig = b.eligibility?.status || 'eligibility_unknown';
      if (aElig === 'not_eligible' && bElig !== 'not_eligible') return 1;
      if (bElig === 'not_eligible' && aElig !== 'not_eligible') return -1;

      // 2. Priority Rank (High Priority=1, Good Opportunity=2, etc.)
      const aRank = a.priority?.rank || 5;
      const bRank = b.priority?.rank || 5;
      if (aRank !== bRank) return aRank - bRank;

      // 3. Priority Score descending
      const aPriScore = a.priority?.score || 0;
      const bPriScore = b.priority?.score || 0;
      if (bPriScore !== aPriScore) return bPriScore - aPriScore;

      // 4. Match Score descending
      const aScore = a.matchScore !== null && a.matchScore !== undefined ? a.matchScore : -1;
      const bScore = b.matchScore !== null && b.matchScore !== undefined ? b.matchScore : -1;
      if (bScore !== aScore) return bScore - aScore;

      // 5. Urgent deadline first (excluding expired)
      const aDays = a.deadline?.isExpired ? 9999 : (a.deadline?.daysLeft ?? 999);
      const bDays = b.deadline?.isExpired ? 9999 : (b.deadline?.daysLeft ?? 999);
      if (aDays !== bDays) return aDays - bDays;

      // 6. Not applied before applied
      if (!a.applicationStatus && b.applicationStatus) return -1;
      if (a.applicationStatus && !b.applicationStatus) return 1;

      return 0;
    }

    if (sortBy === 'match') {
      const aScore = a.matchScore !== null && a.matchScore !== undefined ? a.matchScore : -1;
      const bScore = b.matchScore !== null && b.matchScore !== undefined ? b.matchScore : -1;
      return bScore - aScore;
    }

    if (sortBy === 'deadline') {
      const aExpired = a.deadline?.isExpired ? 1 : 0;
      const bExpired = b.deadline?.isExpired ? 1 : 0;
      if (aExpired !== bExpired) return aExpired - bExpired;

      const aDays = a.deadline?.daysLeft !== undefined && a.deadline?.daysLeft !== null ? a.deadline.daysLeft : 999;
      const bDays = b.deadline?.daysLeft !== undefined && b.deadline?.daysLeft !== null ? b.deadline.daysLeft : 999;
      if (aDays !== bDays) return aDays - bDays;

      const aTime = a.application_deadline ? new Date(a.application_deadline).getTime() : 9999999999999;
      const bTime = b.application_deadline ? new Date(b.application_deadline).getTime() : 9999999999999;
      return aTime - bTime;
    }

    if (sortBy === 'priority') {
      const aPriScore = a.priority?.score || 0;
      const bPriScore = b.priority?.score || 0;
      return bPriScore - aPriScore;
    }

    if (sortBy === 'recent') {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    }

    if (sortBy === 'saved') {
      if (a.isSaved && !b.isSaved) return -1;
      if (!a.isSaved && b.isSaved) return 1;
      return 0;
    }

    if (sortBy === 'applied') {
      if (a.applicationStatus && !b.applicationStatus) return -1;
      if (!a.applicationStatus && b.applicationStatus) return 1;
      return 0;
    }

    return 0;
  });
}

/**
 * 6. GENERATE DRIVE PREPARATION ACTIONS (Phase 13 Integration)
 * Creates grounded preparation actions when a student prepares for a drive.
 */
export function generateDrivePreparationActions(opportunity = {}, candidateData = {}) {
  const actions = [];
  const comp = opportunity.company_name || 'Company';
  const role = opportunity.role_title || 'Role';
  const missing = opportunity.matchExplanation?.missingSkills || [];

  // A. Missing Skill Drill
  if (missing.length > 0) {
    const topMissing = typeof missing[0] === 'string' ? missing[0] : (missing[0].name || 'Core Skill');
    const isDsa = topMissing.toLowerCase().includes('data structure') || topMissing.toLowerCase().includes('algorithm');
    actions.push({
      id: `act-prep-${opportunity.id}-skill`,
      action_key: `prep_skill_${topMissing.toLowerCase().replace(/\s+/g, '_')}`,
      title: `Prepare ${topMissing} for ${comp}`,
      category: isDsa ? 'DSA' : 'Technical Skills',
      priority: 'P1',
      priorityLabel: 'Critical Gap',
      estimated_minutes: 35,
      destination: isDsa ? 'dsa-sheets' : 'courses',
      source: 'Job Match',
      reason: `${comp} requires ${topMissing} which is currently missing from your verified profile.`
    });
  }

  // B. Role-specific Mock Interview
  actions.push({
    id: `act-prep-${opportunity.id}-interview`,
    action_key: `prep_interview_${opportunity.id}`,
    title: `Simulate ${role} Interview for ${comp}`,
    category: 'Mock Interview',
    priority: 'P1',
    priorityLabel: 'Interview Drill',
    estimated_minutes: 25,
    destination: 'interview',
    source: 'Job Match',
    reason: `Simulate the technical interview round for ${comp}'s campus selection process.`
  });

  // C. Resume Alignment
  actions.push({
    id: `act-prep-${opportunity.id}-resume`,
    action_key: `prep_resume_${opportunity.id}`,
    title: `Align Resume Keywords for ${comp}`,
    category: 'Resume ATS',
    priority: 'P2',
    priorityLabel: 'Resume Polish',
    estimated_minutes: 20,
    destination: 'resume',
    source: 'Job Match',
    reason: `Verify that your resume includes the core technologies specified by ${comp}.`
  });

  return actions;
}

/**
 * 7. EVALUATE ALL OPPORTUNITIES (Canonical Evaluation Runner)
 * Processes an opportunity catalog against candidate data.
 */
export function evaluateAllOpportunities(catalog = PLACEMENT_OPPORTUNITIES_CATALOG, candidateData = {}) {
  const safeCatalog = Array.isArray(catalog) ? catalog : PLACEMENT_OPPORTUNITIES_CATALOG;
  const savedIds = candidateData.savedJobIds || [];
  const applications = candidateData.applications || [];

  return safeCatalog.map(opp => {
    const match = computeJobMatchScore(candidateData, opp);
    const eligibility = evaluateCandidateEligibility({
      department: candidateData.profile?.department,
      year: candidateData.profile?.year,
      cgpa: candidateData.profile?.cgpa,
      backlogs: candidateData.profile?.backlogs,
      userSkills: candidateData.userSkills
    }, opp);

    const deadline = classifyOpportunityDeadline(opp.application_deadline);
    const isSaved = savedIds.includes(opp.id);
    const appRecord = applications.find(a => a.opportunity_id === opp.id || a.job_id === opp.id);
    const applicationStatus = appRecord ? appRecord.status : null;

    const priority = computeOpportunityPriority({
      matchScore: match.matchScore,
      eligibility,
      deadline,
      applicationStatus,
      isSaved
    });

    const explanationObj = generateMatchExplanation(candidateData, opp, match);
    const missingCourseRecs = mapMissingSkillsToCourses(match.explanation?.missingSkills || []);

    return {
      ...opp,
      matchScore: match.matchScore,
      matchTier: match.tier,
      matchTierVariant: match.tierVariant,
      factorSummary: match.factorSummary,
      matchBreakdown: match.breakdown,
      matchExplanation: {
        ...match.explanation,
        whyMatches: explanationObj.whyMatches,
        matchedSkills: explanationObj.matchedSkills,
        missingSkills: explanationObj.missingSkills
      },
      eligibility,
      deadline,
      priority,
      isSaved,
      isTracked: Boolean(appRecord),
      applicationStatus,
      applicationRecord: appRecord || null,
      whyMatches: explanationObj.whyMatches,
      courseRecommendations: missingCourseRecs.recommendations,
      fallbackCourseMessage: missingCourseRecs.fallbackMessage
    };
  });
}
