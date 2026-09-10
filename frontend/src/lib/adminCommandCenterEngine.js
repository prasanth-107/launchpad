// ==============================================================================
// PHASE 18: PLACEMENT COMMAND CENTER & ADMIN / INSTITUTION INTELLIGENCE ENGINE
// Modern Placement Launchpad - Multi-tenant Institutional Analytics & Access Control
// ==============================================================================

/**
 * 1. READINESS COHORT CATEGORIES
 * Canonical 5-tier institutional classification for university cohorts.
 */
export const READINESS_COHORT_CATEGORIES = {
  IN_PROGRESS: 'Assessment in Progress',
  NEEDS_SIGNIFICANT_IMPROVEMENT: 'Needs Significant Improvement',
  NEEDS_IMPROVEMENT: 'Needs Improvement',
  ALMOST_READY: 'Almost Ready',
  PLACEMENT_READY: 'Placement Ready'
};

/**
 * Classifies numeric placement readiness score into standard institutional category.
 * @param {number|null|undefined} score
 * @returns {string}
 */
export function classifyReadinessCategory(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return READINESS_COHORT_CATEGORIES.IN_PROGRESS;
  }
  const s = Number(score);
  if (s < 50) return READINESS_COHORT_CATEGORIES.NEEDS_SIGNIFICANT_IMPROVEMENT;
  if (s < 70) return READINESS_COHORT_CATEGORIES.NEEDS_IMPROVEMENT;
  if (s < 85) return READINESS_COHORT_CATEGORIES.ALMOST_READY;
  return READINESS_COHORT_CATEGORIES.PLACEMENT_READY;
}

/**
 * 2. AUTHORIZATION & ACCESS CONTROL
 * Strictly verifies whether a user session holds authorized administrator privileges.
 * @param {Object} user - User record containing id, email, role, etc.
 * @returns {{ authorized: boolean, role: string, error?: string }}
 */
export function verifyAdminAccess(user) {
  if (!user || typeof user !== 'object') {
    return {
      authorized: false,
      role: 'anonymous',
      error: 'Access Denied: Authentication required'
    };
  }

  const role = (user.role || '').toLowerCase().trim();
  if (role === 'admin' || user.is_admin === true) {
    return {
      authorized: true,
      role: 'admin'
    };
  }

  return {
    authorized: false,
    role: role || 'candidate',
    error: 'Access Denied: Administrator role required for Placement Command Center'
  };
}

/**
 * 3. AGGREGATE READINESS METRICS
 * Aggregates student cohort readiness statistics with zero data fabrication.
 * If zero students are assessed, returns null for averages rather than misleading 0%.
 * @param {Array} studentsWithReadiness - Array of student records with readiness metrics
 * @returns {Object}
 */
export function aggregateReadinessMetrics(studentsWithReadiness = []) {
  const students = Array.isArray(studentsWithReadiness) ? studentsWithReadiness : [];
  const totalRegistered = students.length;

  if (totalRegistered === 0) {
    return {
      totalRegistered: 0,
      assessedStudents: 0,
      unassessedStudents: 0,
      averageReadiness: null,
      almostReadyCount: 0,
      placementReadyCount: 0,
      needsImprovementCount: 0,
      needsSignificantImprovementCount: 0,
      distribution: {
        [READINESS_COHORT_CATEGORIES.IN_PROGRESS]: { count: 0, percentage: null },
        [READINESS_COHORT_CATEGORIES.NEEDS_SIGNIFICANT_IMPROVEMENT]: { count: 0, percentage: null },
        [READINESS_COHORT_CATEGORIES.NEEDS_IMPROVEMENT]: { count: 0, percentage: null },
        [READINESS_COHORT_CATEGORIES.ALMOST_READY]: { count: 0, percentage: null },
        [READINESS_COHORT_CATEGORIES.PLACEMENT_READY]: { count: 0, percentage: null }
      },
      hasData: false
    };
  }

  let assessedCount = 0;
  let scoreSum = 0;
  let almostReadyCount = 0;
  let placementReadyCount = 0;
  let needsImprovementCount = 0;
  let needsSignificantImprovementCount = 0;
  let inProgressCount = 0;

  students.forEach(s => {
    const rawScore = s.readinessScore ?? s.readiness_score ?? s.readiness ?? s.readinessReport?.readinessScore ?? null;
    if (rawScore !== null && rawScore !== undefined && !isNaN(rawScore)) {
      const score = Number(rawScore);
      assessedCount++;
      scoreSum += score;

      if (score >= 85) placementReadyCount++;
      else if (score >= 70) almostReadyCount++;
      else if (score >= 50) needsImprovementCount++;
      else needsSignificantImprovementCount++;
    } else {
      inProgressCount++;
    }
  });

  const averageReadiness = assessedCount > 0 ? Math.round((scoreSum / assessedCount) * 10) / 10 : null;

  const distribution = {
    [READINESS_COHORT_CATEGORIES.IN_PROGRESS]: {
      count: inProgressCount,
      percentage: totalRegistered > 0 ? Math.round((inProgressCount / totalRegistered) * 100) : null
    },
    [READINESS_COHORT_CATEGORIES.NEEDS_SIGNIFICANT_IMPROVEMENT]: {
      count: needsSignificantImprovementCount,
      percentage: totalRegistered > 0 ? Math.round((needsSignificantImprovementCount / totalRegistered) * 100) : null
    },
    [READINESS_COHORT_CATEGORIES.NEEDS_IMPROVEMENT]: {
      count: needsImprovementCount,
      percentage: totalRegistered > 0 ? Math.round((needsImprovementCount / totalRegistered) * 100) : null
    },
    [READINESS_COHORT_CATEGORIES.ALMOST_READY]: {
      count: almostReadyCount,
      percentage: totalRegistered > 0 ? Math.round((almostReadyCount / totalRegistered) * 100) : null
    },
    [READINESS_COHORT_CATEGORIES.PLACEMENT_READY]: {
      count: placementReadyCount,
      percentage: totalRegistered > 0 ? Math.round((placementReadyCount / totalRegistered) * 100) : null
    }
  };

  return {
    totalRegistered,
    assessedStudents: assessedCount,
    unassessedStudents: inProgressCount,
    averageReadiness,
    almostReadyCount,
    placementReadyCount,
    needsImprovementCount,
    needsSignificantImprovementCount,
    distribution,
    hasData: true
  };
}

/**
 * 4. AGGREGATE SKILL GAP INTELLIGENCE
 * Aggregates skill proficiency across the cohort and identifies institutional bottlenecks.
 * @param {Array} studentsSkills - Array of student skill items or students with skills
 * @returns {Array} List of skills ranked by number of students with critical gaps
 */
export function aggregateSkillGaps(studentsSkills = []) {
  if (!Array.isArray(studentsSkills) || studentsSkills.length === 0) {
    return [];
  }

  const skillMap = {};

  studentsSkills.forEach(item => {
    // Supports either a flat list of user_skill rows or students with a skills array
    if (item.skill_name || item.name) {
      const skillName = item.skill_name || item.name;
      const score = Number(item.score ?? item.proficiency_score ?? 0);
      if (!skillMap[skillName]) {
        skillMap[skillName] = {
          name: skillName,
          category: item.category || 'General',
          totalAssessed: 0,
          scoreSum: 0,
          criticalGapCount: 0, // < 60
          developingCount: 0,  // 60-79
          proficientCount: 0   // >= 80
        };
      }
      skillMap[skillName].totalAssessed++;
      skillMap[skillName].scoreSum += score;
      if (score < 60) skillMap[skillName].criticalGapCount++;
      else if (score < 80) skillMap[skillName].developingCount++;
      else skillMap[skillName].proficientCount++;
    } else if (Array.isArray(item.skills)) {
      item.skills.forEach(s => {
        const sName = typeof s === 'string' ? s : (s.name || s.skill_name);
        const sScore = typeof s === 'object' ? Number(s.score ?? s.proficiency_score ?? 70) : 70;
        if (!sName) return;
        if (!skillMap[sName]) {
          skillMap[sName] = {
            name: sName,
            category: 'Technical',
            totalAssessed: 0,
            scoreSum: 0,
            criticalGapCount: 0,
            developingCount: 0,
            proficientCount: 0
          };
        }
        skillMap[sName].totalAssessed++;
        skillMap[sName].scoreSum += sScore;
        if (sScore < 60) skillMap[sName].criticalGapCount++;
        else if (sScore < 80) skillMap[sName].developingCount++;
        else skillMap[sName].proficientCount++;
      });
    }
  });

  const results = Object.values(skillMap).map(sk => {
    const avg = sk.totalAssessed > 0 ? Math.round(sk.scoreSum / sk.totalAssessed) : null;
    const gapPercentage = sk.totalAssessed > 0 ? Math.round((sk.criticalGapCount / sk.totalAssessed) * 100) : 0;
    return {
      ...sk,
      averageScore: avg,
      gapPercentage
    };
  });

  // Rank by number of critical gap students descending
  results.sort((a, b) => b.criticalGapCount - a.criticalGapCount || (a.averageScore || 0) - (b.averageScore || 0));

  return results;
}

/**
 * 5. AGGREGATE APPLICATION PIPELINE
 * Aggregates application statuses across the cohort with zero-denominator safety.
 * CRITICAL SECURITY: Completely strips private notes from records.
 * @param {Array} applications - Raw list of application rows
 * @returns {Object} Pipeline counts, rates, and sanitized applications
 */
export function aggregateApplicationPipeline(applications = []) {
  const apps = Array.isArray(applications) ? applications : [];

  let saved = 0;
  let applied = 0;
  let assessment = 0;
  let interview = 0;
  let offer = 0;
  let selected = 0;
  let rejected = 0;
  let withdrawn = 0;

  apps.forEach(a => {
    const st = (a.status || '').toLowerCase().trim();
    if (st === 'saved') saved++;
    else if (st === 'applied') applied++;
    else if (st === 'assessment') assessment++;
    else if (st === 'interview') interview++;
    else if (st === 'offer') offer++;
    else if (st === 'selected') selected++;
    else if (st === 'rejected') rejected++;
    else if (st === 'withdrawn') withdrawn++;
  });

  const totalApplications = apps.length;
  const activePipelineCount = applied + assessment + interview + offer;
  const inEvaluationCount = assessment + interview;
  const totalOffersAndSelections = offer + selected;

  // Funnel conversion rates with zero-denominator safety
  const eligibleAppliedBase = applied + assessment + interview + offer + selected + rejected;
  const interviewRate = eligibleAppliedBase > 0 
    ? Math.round(((interview + offer + selected) / eligibleAppliedBase) * 100) 
    : null;
  const offerRate = eligibleAppliedBase > 0 
    ? Math.round((totalOffersAndSelections / eligibleAppliedBase) * 100) 
    : null;
  const selectionRate = eligibleAppliedBase > 0 
    ? Math.round((selected / eligibleAppliedBase) * 100) 
    : null;

  return {
    totalApplications,
    activePipelineCount,
    savedCount: saved,
    appliedCount: applied,
    assessmentCount: assessment,
    interviewCount: interview,
    offerCount: offer,
    selectedCount: selected,
    rejectedCount: rejected,
    withdrawnCount: withdrawn,
    inEvaluationCount,
    interviewRate,
    offerRate,
    selectionRate,
    hasData: totalApplications > 0
  };
}

/**
 * 6. AGGREGATE OPPORTUNITY INTELLIGENCE
 * Aggregates campus drive activity, upcoming deadlines, and application volume.
 * @param {Array} opportunities - Placement opportunities catalog
 * @param {Array} applications - Cohort applications
 * @returns {Object}
 */
export function aggregateOpportunityIntelligence(opportunities = [], applications = []) {
  const opps = Array.isArray(opportunities) ? opportunities : [];
  const apps = Array.isArray(applications) ? applications : [];

  const now = new Date();
  let activeCount = 0;
  let closingSoonCount = 0;
  let highPriorityCount = 0;

  const appCountByOpp = {};
  apps.forEach(a => {
    if (a.opportunity_id) {
      appCountByOpp[a.opportunity_id] = (appCountByOpp[a.opportunity_id] || 0) + 1;
    }
  });

  const enrichedOpps = opps.map(opp => {
    const appCount = appCountByOpp[opp.id] || 0;
    let daysLeft = null;
    let isClosingSoon = false;

    if (opp.deadline) {
      const dl = new Date(opp.deadline);
      const diffMs = dl.getTime() - now.getTime();
      daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 3) {
        isClosingSoon = true;
      }
    }

    const isActive = opp.status === 'open' || opp.status === 'active' || (daysLeft !== null && daysLeft >= 0);
    if (isActive) activeCount++;
    if (isClosingSoon) closingSoonCount++;
    if (opp.priority === 'high' || opp.is_hot || opp.is_featured) highPriorityCount++;

    return {
      id: opp.id,
      company: opp.company || opp.company_name || 'Partner Employer',
      role: opp.role || opp.title || 'Software Engineer',
      department: opp.department || 'All Departments',
      deadline: opp.deadline || null,
      daysLeft,
      isActive,
      isClosingSoon,
      applicantCount: appCount,
      package: opp.package_ctc || opp.salary_range || 'Competitive'
    };
  });

  // Top companies by applicant activity
  enrichedOpps.sort((a, b) => b.applicantCount - a.applicantCount);

  return {
    totalOpportunities: opps.length,
    activeCount,
    closingSoonCount,
    highPriorityCount,
    opportunities: enrichedOpps,
    hasData: opps.length > 0
  };
}

/**
 * 7. SAFE STUDENT SEARCH & FILTERING
 * Filters students by safe fields and strictly strips all credentials and private notes.
 * @param {Array} students - Array of student records
 * @param {Object} filters - { query, department, year, readinessRange, role }
 * @returns {Array} Sanitized student list
 */
export function filterAndSearchStudents(students = [], filters = {}) {
  if (!Array.isArray(students)) return [];

  const { query = '', department = '', year = '', readinessRange = 'all' } = filters;
  const q = query.trim().toLowerCase();

  return students
    .filter(s => {
      // 1. Text Query (Name, Email, College, Department, Preferred Role)
      if (q) {
        const name = (s.name || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const dept = (s.department || '').toLowerCase();
        const college = (s.college || '').toLowerCase();
        const role = (s.preferred_job_role || s.target_role || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !dept.includes(q) && !college.includes(q) && !role.includes(q)) {
          return false;
        }
      }

      // 2. Department filter
      if (department && department !== 'all') {
        const dept = (s.department || '').toLowerCase();
        if (dept !== department.toLowerCase()) return false;
      }

      // 3. Year filter
      if (year && year !== 'all') {
        const yr = (s.year || '').toLowerCase();
        if (!yr.includes(year.toLowerCase())) return false;
      }

      // 4. Readiness Range filter
      const score = s.readinessScore ?? s.readiness_score ?? s.readiness ?? null;
      if (readinessRange && readinessRange !== 'all') {
        if (readinessRange === 'unassessed' || readinessRange === 'in_progress') {
          if (score !== null && score !== undefined) return false;
        } else if (readinessRange === '<50') {
          if (score === null || score >= 50) return false;
        } else if (readinessRange === '50-69') {
          if (score === null || score < 50 || score >= 70) return false;
        } else if (readinessRange === '70-84') {
          if (score === null || score < 70 || score >= 85) return false;
        } else if (readinessRange === '85+') {
          if (score === null || score < 85) return false;
        }
      }

      return true;
    })
    .map(s => sanitizeStudentSummary(s));
}

/**
 * 8. SANITIZE STUDENT SUMMARY (ZERO SENSITIVE DATA LEAKAGE)
 * Guarantees passwords, tokens, auth keys, and private notes are completely stripped.
 * @param {Object} student
 * @returns {Object} Sanitized student profile
 */
export function sanitizeStudentSummary(student) {
  if (!student || typeof student !== 'object') return null;

  const rawScore = student.readinessScore ?? student.readiness_score ?? student.readiness ?? null;
  const score = (rawScore !== null && rawScore !== undefined && !isNaN(rawScore)) ? Number(rawScore) : null;

  return {
    id: student.id,
    name: student.name || 'Candidate',
    email: student.email || '',
    college: student.college || 'Stanford Institute of Technology',
    department: student.department || 'Engineering',
    year: student.year || '4th Year',
    preferred_job_role: student.preferred_job_role || student.target_role || 'Software Engineer',
    role: student.role || 'candidate',
    readinessScore: score,
    readinessCategory: classifyReadinessCategory(score),
    skills: Array.isArray(student.skills) ? student.skills : [],
    activeApplicationsCount: Number(student.activeApplicationsCount || 0),
    placed: Boolean(student.placed || student.selected),
    created_at: student.created_at || null
  };
}

/**
 * 9. SAFE STUDENT PLACEMENT PROFILE (DETAIL VIEW)
 * Combines safe candidate information for authorized administrator review.
 * @param {Object} studentProfile - Profile row
 * @param {Object} context - { readinessReport, skills, attempts, interviews, resumes, applications }
 * @returns {Object} Placement-relevant dossier without credentials or private notes
 */
export function buildStudentPlacementDossier(studentProfile, context = {}) {
  if (!studentProfile) return null;

  const sanitizedBase = sanitizeStudentSummary(studentProfile);

  const attempts = Array.isArray(context.attempts) ? context.attempts.map(a => ({
    id: a.id,
    assessment_title: a.assessment_title || a.title || 'Technical Assessment',
    category: a.category || 'General',
    score_percent: a.score_percent ?? a.score ?? 0,
    passed: Boolean(a.passed),
    created_at: a.created_at
  })) : [];

  const interviews = Array.isArray(context.interviews) ? context.interviews.map(i => ({
    id: i.id,
    role: i.role || 'Software Engineer',
    type: i.type || 'Technical',
    overall_score: i.overall_score ?? i.score ?? null,
    created_at: i.created_at
  })) : [];

  const applications = Array.isArray(context.applications) ? context.applications.map(app => ({
    id: app.id,
    company: app.company || app.company_name || 'Company',
    role: app.role || 'Position',
    status: app.status || 'applied',
    created_at: app.created_at
    // CRITICAL: private_notes is explicitly omitted
  })) : [];

  const latestResume = Array.isArray(context.resumes) && context.resumes.length > 0 
    ? context.resumes[0] 
    : (context.resume || null);

  const resumeAtsScore = latestResume?.ats_score ?? latestResume?.atsScore ?? null;

  return {
    ...sanitizedBase,
    assessmentAttempts: attempts,
    mockInterviews: interviews,
    applications,
    resumeAtsScore,
    readinessReport: context.readinessReport || null
  };
}

/**
 * 10. SAFE DATA EXPORT
 * Formats cohort data into CSV format for university accreditation and placement tracking.
 * Whitelist approach guarantees zero credential or token leakage.
 * @param {Array} students - List of students
 * @returns {string} CSV formatted string
 */
export function generateSafeExportCsv(students = []) {
  const sanitizedList = Array.isArray(students) ? students.map(s => sanitizeStudentSummary(s)) : [];

  const headers = [
    'Student Name',
    'Email',
    'Department',
    'Year',
    'Preferred Role',
    'Readiness Score',
    'Readiness Cohort',
    'Active Applications',
    'Placement Status'
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = sanitizedList.map(s => [
    escapeCsv(s.name),
    escapeCsv(s.email),
    escapeCsv(s.department),
    escapeCsv(s.year),
    escapeCsv(s.preferred_job_role),
    s.readinessScore !== null ? s.readinessScore : 'Not Assessed',
    escapeCsv(s.readinessCategory),
    s.activeApplicationsCount,
    s.placed ? 'Selected / Placed' : 'In Pipeline'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
