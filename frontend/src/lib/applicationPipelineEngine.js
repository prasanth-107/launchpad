/**
 * Modern Placement Launchpad - Application Pipeline & Placement Tracking Engine
 * Phase 10: Canonical Statuses, Valid Transitions, Next-Action Intelligence,
 * Pipeline Metrics, and Data-Grounded Event Management.
 * 
 * ZERO FABRICATION RULE:
 * - Empty applications array returns 0 counts and null for all rate denominators.
 * - Dates are never invented; unscheduled events return null / "Date not scheduled".
 */

// 1. CANONICAL STATUS DEFINITIONS
export const APPLICATION_STATUSES = {
  SAVED: 'saved',
  APPLIED: 'applied',
  ASSESSMENT: 'assessment',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

export const STATUS_METADATA = {
  [APPLICATION_STATUSES.SAVED]: {
    key: 'saved',
    label: 'Saved',
    shortLabel: 'Saved',
    badgeVariant: 'neutral',
    color: 'slate',
    stepNumber: 0,
    isActive: false,
    isTerminal: false,
    description: 'Bookmarked drive for review before application'
  },
  [APPLICATION_STATUSES.APPLIED]: {
    key: 'applied',
    label: 'Applied',
    shortLabel: 'Applied',
    badgeVariant: 'primary',
    color: 'indigo',
    stepNumber: 1,
    isActive: true,
    isTerminal: false,
    description: 'Application recorded and submitted to recruitment portal'
  },
  [APPLICATION_STATUSES.ASSESSMENT]: {
    key: 'assessment',
    label: 'Assessment',
    shortLabel: 'Assessment',
    badgeVariant: 'warning',
    color: 'amber',
    stepNumber: 2,
    isActive: true,
    isTerminal: false,
    description: 'Online technical or aptitude screening round scheduled'
  },
  [APPLICATION_STATUSES.INTERVIEW]: {
    key: 'interview',
    label: 'Interview',
    shortLabel: 'Interview',
    badgeVariant: 'info',
    color: 'purple',
    stepNumber: 3,
    isActive: true,
    isTerminal: false,
    description: 'Technical or HR video/in-person interview round scheduled'
  },
  [APPLICATION_STATUSES.OFFER]: {
    key: 'offer',
    label: 'Offer Received',
    shortLabel: 'Offer',
    badgeVariant: 'success',
    color: 'emerald',
    stepNumber: 4,
    isActive: true,
    isTerminal: false,
    description: 'Letter of intent or formal campus placement offer extended'
  },
  [APPLICATION_STATUSES.SELECTED]: {
    key: 'selected',
    label: 'Selected / Placed',
    shortLabel: 'Selected',
    badgeVariant: 'success',
    color: 'emerald',
    stepNumber: 5,
    isActive: false,
    isTerminal: true,
    description: 'Placement confirmed and acceptance completed'
  },
  [APPLICATION_STATUSES.REJECTED]: {
    key: 'rejected',
    label: 'Rejected',
    shortLabel: 'Rejected',
    badgeVariant: 'danger',
    color: 'rose',
    stepNumber: -1,
    isActive: false,
    isTerminal: true,
    description: 'Application was not selected for further advancement'
  },
  [APPLICATION_STATUSES.WITHDRAWN]: {
    key: 'withdrawn',
    label: 'Withdrawn',
    shortLabel: 'Withdrawn',
    badgeVariant: 'secondary',
    color: 'slate',
    stepNumber: -2,
    isActive: false,
    isTerminal: true,
    description: 'Application voluntarily withdrawn by the candidate'
  }
};

// Kanban Board Active Columns
export const KANBAN_COLUMNS = [
  APPLICATION_STATUSES.SAVED,
  APPLICATION_STATUSES.APPLIED,
  APPLICATION_STATUSES.ASSESSMENT,
  APPLICATION_STATUSES.INTERVIEW,
  APPLICATION_STATUSES.OFFER,
  APPLICATION_STATUSES.SELECTED
];

// 2. VALID STATUS TRANSITIONS MAP
export const VALID_TRANSITIONS = {
  [APPLICATION_STATUSES.SAVED]: [
    APPLICATION_STATUSES.APPLIED,
    APPLICATION_STATUSES.WITHDRAWN
  ],
  [APPLICATION_STATUSES.APPLIED]: [
    APPLICATION_STATUSES.ASSESSMENT,
    APPLICATION_STATUSES.INTERVIEW,
    APPLICATION_STATUSES.REJECTED,
    APPLICATION_STATUSES.WITHDRAWN
  ],
  [APPLICATION_STATUSES.ASSESSMENT]: [
    APPLICATION_STATUSES.INTERVIEW,
    APPLICATION_STATUSES.OFFER,
    APPLICATION_STATUSES.REJECTED,
    APPLICATION_STATUSES.WITHDRAWN
  ],
  [APPLICATION_STATUSES.INTERVIEW]: [
    APPLICATION_STATUSES.OFFER,
    APPLICATION_STATUSES.SELECTED,
    APPLICATION_STATUSES.REJECTED,
    APPLICATION_STATUSES.WITHDRAWN
  ],
  [APPLICATION_STATUSES.OFFER]: [
    APPLICATION_STATUSES.SELECTED,
    APPLICATION_STATUSES.REJECTED,
    APPLICATION_STATUSES.WITHDRAWN
  ],
  [APPLICATION_STATUSES.SELECTED]: [], // Terminal
  [APPLICATION_STATUSES.REJECTED]: [], // Terminal
  [APPLICATION_STATUSES.WITHDRAWN]: [
    APPLICATION_STATUSES.APPLIED // Allow re-application if drive is active
  ]
};

/**
 * Validates whether transition from current status to target status is permitted.
 */
export function isValidStatusTransition(currentStatus, targetStatus) {
  if (!currentStatus || !targetStatus) return false;
  if (currentStatus === targetStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Returns list of permitted next statuses for an application.
 */
export function getValidNextStatuses(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}

// 3. NEXT ACTION INTELLIGENCE
/**
 * Derives the optimal next preparation or operational action based on
 * current application stage and available candidate performance data.
 */
export function computeNextAction(application, candidateContext = {}) {
  if (!application) {
    return {
      text: 'Explore Active Placement Drives',
      reason: 'No active application found.',
      targetTab: 'job-opportunities',
      actionLabel: 'Browse Opportunities'
    };
  }

  const status = application.status || APPLICATION_STATUSES.APPLIED;
  const company = application.company_name || 'the recruiter';
  const role = application.role_title || 'Software Engineer';

  switch (status) {
    case APPLICATION_STATUSES.SAVED:
      return {
        text: `Complete Application for ${company}`,
        reason: 'Drive is bookmarked. Verify eligibility and submit on careers portal before deadline.',
        targetTab: 'job-opportunities',
        actionLabel: 'Apply Now'
      };

    case APPLICATION_STATUSES.APPLIED:
      return {
        text: 'Prepare for Online Assessment Round',
        reason: 'Recruiters typically dispatch technical screening links within 3–7 days of application.',
        targetTab: 'assessments',
        actionLabel: 'Practice Diagnostic Test'
      };

    case APPLICATION_STATUSES.ASSESSMENT:
      return {
        text: application.assessment_date
          ? `Complete Assessment (Scheduled: ${formatDate(application.assessment_date)})`
          : 'Complete Technical & Quantitative Screening',
        reason: 'Focus on speed math, data structures, and SQL query optimizations.',
        targetTab: 'assessments',
        actionLabel: 'Take Practice Assessment'
      };

    case APPLICATION_STATUSES.INTERVIEW:
      return {
        text: application.interview_date
          ? `Technical Interview on ${formatDate(application.interview_date)}`
          : `Prepare for ${company} Interview Round`,
        reason: 'Practice STAR communication and system architecture trade-offs.',
        targetTab: 'interview',
        actionLabel: 'Start AI Mock Interview'
      };

    case APPLICATION_STATUSES.OFFER:
      return {
        text: 'Review Formal Offer Letter & Package',
        reason: 'Examine CTC component breakdown, joining date, and bond or service agreements.',
        targetTab: 'applications',
        actionLabel: 'Review Offer Details'
      };

    case APPLICATION_STATUSES.SELECTED:
      return {
        text: 'Placement Cleared! Complete Onboarding Prep',
        reason: `Congratulations on receiving your offer at ${company}!`,
        targetTab: 'dashboard',
        actionLabel: 'View Dashboard'
      };

    case APPLICATION_STATUSES.REJECTED:
      return {
        text: 'Review Skill Gaps & Continue Preparation',
        reason: 'Strengthen weak competencies through adaptive learning courses and retake assessments.',
        targetTab: 'roadmap',
        actionLabel: 'View Learning Path'
      };

    case APPLICATION_STATUSES.WITHDRAWN:
      return {
        text: 'Explore Other Placement Drives',
        reason: 'Application withdrawn. Explore newly opened campus recruitment drives.',
        targetTab: 'job-opportunities',
        actionLabel: 'Explore Drives'
      };

    default:
      return {
        text: 'Check Application Status',
        reason: 'Stay tuned for recruiter updates.',
        targetTab: 'applications',
        actionLabel: 'View Application'
      };
  }
}

// 4. PIPELINE METRICS & CONVERSION STATS
/**
 * Calculates deterministic pipeline stats from real candidate application records.
 * STRICT ZERO-DENOMINATOR RULE:
 * If total applications === 0, all rates return null (display as "—").
 */
export function calculateApplicationStatistics(applications = []) {
  const safeList = Array.isArray(applications) ? applications : [];
  const total = safeList.length;

  let saved = 0;
  let applied = 0;
  let assessment = 0;
  let interview = 0;
  let offer = 0;
  let selected = 0;
  let rejected = 0;
  let withdrawn = 0;

  safeList.forEach(app => {
    const s = app.status;
    if (s === APPLICATION_STATUSES.SAVED) saved++;
    else if (s === APPLICATION_STATUSES.APPLIED) applied++;
    else if (s === APPLICATION_STATUSES.ASSESSMENT) assessment++;
    else if (s === APPLICATION_STATUSES.INTERVIEW) interview++;
    else if (s === APPLICATION_STATUSES.OFFER) offer++;
    else if (s === APPLICATION_STATUSES.SELECTED) selected++;
    else if (s === APPLICATION_STATUSES.REJECTED) rejected++;
    else if (s === APPLICATION_STATUSES.WITHDRAWN) withdrawn++;
  });

  // Active applications = in-flight stages
  const activeCount = applied + assessment + interview + offer;

  // Cumulative interview count (anyone who reached interview, offer, or selected)
  const interviewPipelineTotal = interview + offer + selected;

  // Cumulative offer count (offers + selections)
  const offerPipelineTotal = offer + selected;

  // Rates: return null if total === 0 (NEVER return "0%" for zero denominator)
  const interviewRate = total > 0 ? Math.round((interviewPipelineTotal / total) * 100) : null;
  const offerRate = total > 0 ? Math.round((offerPipelineTotal / total) * 100) : null;
  const selectionRate = total > 0 ? Math.round((selected / total) * 100) : null;
  const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : null;

  return {
    total,
    activeCount,
    savedCount: saved,
    appliedCount: applied,
    assessmentCount: assessment,
    interviewCount: interviewPipelineTotal,
    offerCount: offerPipelineTotal,
    selectedCount: selected,
    rejectedCount: rejected,
    withdrawnCount: withdrawn,
    // Rates
    interviewRate,
    offerRate,
    selectionRate,
    rejectionRate,
    hasData: total > 0
  };
}

// 5. UPCOMING EVENTS CALCULATOR
/**
 * Inspects real scheduled dates for candidate applications and returns
 * the nearest upcoming event or deadline.
 */
export function getUpcomingApplicationEvent(applications = []) {
  const safeList = Array.isArray(applications) ? applications : [];
  if (safeList.length === 0) {
    return {
      hasEvent: false,
      title: 'No upcoming placement actions',
      description: 'Your schedule is currently clear. Explore placement drives to apply.',
      eventDate: null,
      daysLeft: null
    };
  }

  const now = new Date().getTime();
  const scheduledEvents = [];

  safeList.forEach(app => {
    // Check assessment date
    if (app.assessment_date) {
      const time = new Date(app.assessment_date).getTime();
      if (!isNaN(time) && time >= now - 86400000) {
        scheduledEvents.push({
          applicationId: app.id,
          company: app.company_name,
          role: app.role_title,
          type: 'assessment',
          title: `${app.company_name} Online Assessment`,
          eventDate: app.assessment_date,
          timestamp: time
        });
      }
    }

    // Check interview date
    if (app.interview_date) {
      const time = new Date(app.interview_date).getTime();
      if (!isNaN(time) && time >= now - 86400000) {
        scheduledEvents.push({
          applicationId: app.id,
          company: app.company_name,
          role: app.role_title,
          type: 'interview',
          title: `${app.company_name} Interview Round`,
          eventDate: app.interview_date,
          timestamp: time
        });
      }
    }

    // Check next_action_date
    if (app.next_action_date) {
      const time = new Date(app.next_action_date).getTime();
      if (!isNaN(time) && time >= now - 86400000) {
        scheduledEvents.push({
          applicationId: app.id,
          company: app.company_name,
          role: app.role_title,
          type: 'action',
          title: app.next_action || `${app.company_name} Action`,
          eventDate: app.next_action_date,
          timestamp: time
        });
      }
    }
  });

  if (scheduledEvents.length === 0) {
    // If no specific dates scheduled, find most recent active application
    const activeApps = safeList.filter(a => STATUS_METADATA[a.status]?.isActive);
    if (activeApps.length > 0) {
      const recent = activeApps[0];
      const action = computeNextAction(recent);
      return {
        hasEvent: true,
        hasDate: false,
        title: action.text,
        description: action.reason,
        company: recent.company_name,
        role: recent.role_title,
        status: recent.status,
        eventDate: null,
        daysLeft: null,
        targetTab: action.targetTab,
        actionLabel: action.actionLabel
      };
    }

    return {
      hasEvent: false,
      title: 'No upcoming placement actions',
      description: 'You have no scheduled assessments or interviews at this time.',
      eventDate: null,
      daysLeft: null
    };
  }

  // Sort earliest upcoming first
  scheduledEvents.sort((a, b) => a.timestamp - b.timestamp);
  const nearest = scheduledEvents[0];
  const diffDays = Math.ceil((nearest.timestamp - now) / (1000 * 60 * 60 * 24));

  return {
    hasEvent: true,
    hasDate: true,
    title: nearest.title,
    description: `Scheduled with ${nearest.company} (${nearest.role})`,
    company: nearest.company,
    role: nearest.role,
    type: nearest.type,
    eventDate: nearest.eventDate,
    daysLeft: diffDays,
    badgeText: diffDays === 0 ? 'Today' : (diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`),
    targetTab: nearest.type === 'interview' ? 'interview' : 'assessments',
    actionLabel: nearest.type === 'interview' ? 'Practice Interview' : 'Prepare Assessment'
  };
}

// 6. DATE FORMATTING UTILITY
export function formatDate(dateString) {
  if (!dateString) return 'Date not scheduled';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Date not scheduled';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return 'Date not scheduled';
  }
}
