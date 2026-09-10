/**
 * Placement Readiness Index Engine
 * Centralized, single source of truth for calculating the 0–100 Placement Readiness Index.
 * Implements proportional missing-data normalization, recency-weighted aggregation,
 * and transparent competency tier classification.
 */

// 7 Canonical Placement Pillars with Base Weights (Sum = 100%)
export const READINESS_PILLARS = [
  {
    id: 'tech',
    name: 'Technical Skills',
    shortName: 'Tech Skills',
    baseWeight: 20,
    targetBenchmark: 80,
    color: 'indigo',
    description: 'Web development, programming frameworks, database normalization, and backend architectures.',
    actionTarget: 'courses',
    actionLabel: 'Explore Courses'
  },
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    shortName: 'DSA',
    baseWeight: 15,
    targetBenchmark: 75,
    color: 'indigo',
    description: 'Dynamic programming, binary search trees, graph traversals, and algorithmic problem-solving.',
    actionTarget: 'dsa-sheets',
    actionLabel: 'Practice DSA'
  },
  {
    id: 'aptitude',
    name: 'Quantitative Aptitude & Logic',
    shortName: 'Aptitude',
    baseWeight: 15,
    targetBenchmark: 70,
    color: 'sky',
    description: 'Speed math, time & work equations, syllogisms, and puzzle deduction.',
    actionTarget: 'assessments',
    actionLabel: 'Take Aptitude Test'
  },
  {
    id: 'communication',
    name: 'Communication & Articulation',
    shortName: 'Communication',
    baseWeight: 10,
    targetBenchmark: 70,
    color: 'purple',
    description: 'STAR framework fluency, technical clarity, elevator pitches, and active listening.',
    actionTarget: 'interview',
    actionLabel: 'Practice Interview'
  },
  {
    id: 'resume',
    name: 'Resume ATS Verification',
    shortName: 'Resume / ATS',
    baseWeight: 15,
    targetBenchmark: 85,
    color: 'emerald',
    description: 'Role keyword density, quantifiable impact metrics, and single-column formatting.',
    actionTarget: 'resume',
    actionLabel: 'Audit Resume'
  },
  {
    id: 'interview',
    name: 'Mock Interview Performance',
    shortName: 'Mock Interview',
    baseWeight: 15,
    targetBenchmark: 80,
    color: 'amber',
    description: 'Live voice simulation, response structure, technical depth, and confidence.',
    actionTarget: 'interview',
    actionLabel: 'Start Mock'
  },
  {
    id: 'projects',
    name: 'Applied Projects & Portfolio',
    shortName: 'Projects',
    baseWeight: 10,
    targetBenchmark: 75,
    color: 'indigo',
    description: 'Full-stack deployed projects, GitHub repository code quality, and applied engineering.',
    actionTarget: 'courses',
    actionLabel: 'Build Projects'
  }
];

// Status Tier Levels
export const READINESS_STATUS_TIERS = {
  PLACEMENT_READY: { min: 90, max: 100, label: 'Placement Ready', variant: 'success', description: 'Exceptional campus readiness; cleared for Tier-1 engineering roles.' },
  ALMOST_READY: { min: 75, max: 89, label: 'Almost Ready', variant: 'primary', description: 'Strong candidate profile; minor polish needed to reach top percentile.' },
  NEEDS_IMPROVEMENT: { min: 60, max: 74, label: 'Needs Improvement', variant: 'warning', description: 'Developing placement foundation; targeted drills needed across gaps.' },
  NEEDS_SIGNIFICANT_IMPROVEMENT: { min: 0, max: 59, label: 'Needs Significant Improvement', variant: 'danger', description: 'High priority remediation required before campus recruitment drives.' },
  IN_PROGRESS: { label: 'Assessment in Progress', variant: 'neutral', description: 'Complete assessments, resume audit, or mock interviews to compute readiness.' }
};

/**
 * Aggregates multiple attempts for a category using recency-weighted scoring:
 * Latest attempt: 70%, Prior best: 30%.
 */
function aggregateAttempts(attempts) {
  if (!attempts || attempts.length === 0) return null;
  // Sort descending by creation date
  const sorted = [...attempts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const latest = Number(sorted[0].score_percent) || 0;
  if (sorted.length === 1) return latest;
  const bestPrior = Math.max(...sorted.slice(1).map(a => Number(a.score_percent) || 0));
  return Math.round((latest * 0.70) + (bestPrior * 0.30));
}

/**
 * Centralized Placement Readiness Calculation
 * Strictly grounded in real database rows with proportional missing-data normalization.
 */
export function computePlacementReadiness({
  attempts = [],
  userSkills = [],
  resumes = [],
  interviews = [],
  progress = [],
  profile = {}
} = {}) {
  // 1. Evaluate Individual Pillars from Real Table Rows
  
  // A. DSA Pillar
  const dsaAttempts = attempts.filter(a => {
    const cat = (a.category || a.assessment_title || '').toLowerCase();
    return cat.includes('data structure') || cat.includes('dsa') || cat.includes('algorithm');
  });
  const dsaScore = aggregateAttempts(dsaAttempts);

  // B. Aptitude Pillar
  const aptAttempts = attempts.filter(a => {
    const cat = (a.category || a.assessment_title || '').toLowerCase();
    return cat.includes('aptitude') || cat.includes('quantitative') || cat.includes('logical') || cat.includes('reasoning');
  });
  const aptitudeScore = aggregateAttempts(aptAttempts);

  // C. Technical Skills Pillar
  // Derived from non-DSA/Aptitude assessment attempts or verified user skills
  const techAttempts = attempts.filter(a => {
    const cat = (a.category || a.assessment_title || '').toLowerCase();
    return !cat.includes('data structure') && !cat.includes('dsa') && !cat.includes('algorithm') &&
           !cat.includes('aptitude') && !cat.includes('quantitative') && !cat.includes('logical');
  });
  let techScore = aggregateAttempts(techAttempts);
  if (techScore === null && userSkills.length > 0) {
    const verified = userSkills.filter(s => s.verified && s.proficiency_percent > 0);
    if (verified.length > 0) {
      techScore = Math.round(verified.reduce((sum, s) => sum + s.proficiency_percent, 0) / verified.length);
    }
  }

  // D. Communication Pillar
  // Derived from mock interview communication_score or verbal assessment
  let communicationScore = null;
  if (interviews && interviews.length > 0) {
    const validCommScores = interviews.filter(m => m.communication_score > 0).map(m => m.communication_score);
    if (validCommScores.length > 0) {
      communicationScore = Math.round(validCommScores.reduce((sum, v) => sum + v, 0) / validCommScores.length);
    }
  }
  if (communicationScore === null) {
    const verbalAttempts = attempts.filter(a => (a.category || a.assessment_title || '').toLowerCase().includes('verbal'));
    communicationScore = aggregateAttempts(verbalAttempts);
  }

  // E. Resume / ATS Pillar
  let resumeScore = null;
  const latestResume = resumes && resumes.length > 0 
    ? [...resumes].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]
    : null;
  if (latestResume && latestResume.ats_score !== undefined && latestResume.ats_score !== null) {
    resumeScore = Number(latestResume.ats_score);
  }

  // F. Mock Interview Pillar
  let interviewScore = null;
  if (interviews && interviews.length > 0) {
    const validScores = interviews.filter(m => m.overall_score > 0).map(m => m.overall_score);
    if (validScores.length > 0) {
      interviewScore = Math.round(validScores.reduce((sum, v) => sum + v, 0) / validScores.length);
    }
  }

  // G. Projects Pillar
  // Measured only if actual project evaluation exists in progress/profile
  let projectsScore = null;
  const completedProjects = progress.filter(p => p.progress_percent >= 100 || p.completed_modules >= 8);
  if (completedProjects.length > 0) {
    projectsScore = Math.min(100, 70 + (completedProjects.length * 10));
  } else if (profile?.projects_score) {
    projectsScore = Number(profile.projects_score);
  }
  // Otherwise remains null ("Not evaluated yet") — never fabricated!

  // Raw mapping
  const rawPillarScores = {
    tech: techScore,
    dsa: dsaScore,
    aptitude: aptitudeScore,
    communication: communicationScore,
    resume: resumeScore,
    interview: interviewScore,
    projects: projectsScore
  };

  // 2. Identify Available vs Unavailable Pillars
  const availablePillars = [];
  const evaluatedPillars = [];

  READINESS_PILLARS.forEach(p => {
    const rawVal = rawPillarScores[p.id];
    const isAvailable = rawVal !== null && rawVal !== undefined && !isNaN(rawVal);
    const scoreVal = isAvailable ? Math.min(100, Math.max(0, Math.round(rawVal))) : null;

    if (isAvailable) {
      availablePillars.push(p);
    }

    evaluatedPillars.push({
      ...p,
      score: scoreVal,
      available: isAvailable,
      gap: isAvailable ? Math.max(0, p.targetBenchmark - scoreVal) : null,
      statusLabel: isAvailable ? (scoreVal >= p.targetBenchmark ? 'Benchmark Met' : `Gap: -${p.targetBenchmark - scoreVal}%`) : 'Not evaluated yet'
    });
  });

  const availableCount = availablePillars.length;
  const totalCount = READINESS_PILLARS.length;
  const coveragePercent = Math.round((availableCount / totalCount) * 100);

  // 3. Strict Empty State Check
  if (availableCount === 0) {
    return {
      score: null,
      status: READINESS_STATUS_TIERS.IN_PROGRESS.label,
      statusTier: READINESS_STATUS_TIERS.IN_PROGRESS,
      isEvaluated: false,
      coverageText: '0 of 7 pillars evaluated',
      coverage: {
        available: 0,
        total: totalCount,
        percentage: 0,
        summary: '0 / 7 pillars evaluated'
      },
      pillars: evaluatedPillars.map(p => ({ ...p, effectiveWeight: 0 })),
      strongestArea: null,
      priorityGap: null,
      nextAction: {
        text: 'Complete your first skill assessment to start computing your placement readiness.',
        targetRoute: 'assessments',
        label: 'Take First Test'
      }
    };
  }

  // 4. Proportional Normalization
  // Sum base weights of only available pillars
  const sumAvailableBaseWeight = availablePillars.reduce((sum, p) => sum + p.baseWeight, 0);

  let weightedScoreSum = 0;
  const normalizedPillars = evaluatedPillars.map(p => {
    if (!p.available) {
      return {
        ...p,
        effectiveWeight: 0,
        normalizedContribution: 0
      };
    }
    // Effective normalized weight in [0, 1]
    const effectiveWeightRatio = p.baseWeight / sumAvailableBaseWeight;
    const effectiveWeightPercent = Math.round(effectiveWeightRatio * 100);
    const contribution = p.score * effectiveWeightRatio;
    weightedScoreSum += contribution;

    return {
      ...p,
      effectiveWeight: effectiveWeightPercent,
      normalizedContribution: Math.round(contribution * 10) / 10
    };
  });

  // Clamp final score strictly between 0 and 100
  const finalScore = Math.min(100, Math.max(0, Math.round(weightedScoreSum)));

  // 5. Determine Status Tier
  let statusTier = READINESS_STATUS_TIERS.NEEDS_SIGNIFICANT_IMPROVEMENT;
  if (finalScore >= READINESS_STATUS_TIERS.PLACEMENT_READY.min) {
    statusTier = READINESS_STATUS_TIERS.PLACEMENT_READY;
  } else if (finalScore >= READINESS_STATUS_TIERS.ALMOST_READY.min) {
    statusTier = READINESS_STATUS_TIERS.ALMOST_READY;
  } else if (finalScore >= READINESS_STATUS_TIERS.NEEDS_IMPROVEMENT.min) {
    statusTier = READINESS_STATUS_TIERS.NEEDS_IMPROVEMENT;
  }

  // 6. Identify Strongest Area and Priority Gap among available pillars
  const sortedByScore = [...normalizedPillars.filter(p => p.available)].sort((a, b) => b.score - a.score);
  const strongestArea = sortedByScore.length > 0 ? sortedByScore[0] : null;

  const sortedByGap = [...normalizedPillars.filter(p => p.available)].sort((a, b) => b.gap - a.gap);
  // Priority gap is either largest positive gap below target, or lowest scoring pillar
  let priorityGap = sortedByGap.find(p => p.gap > 0) || sortedByScore[sortedByScore.length - 1];

  // 7. Recommended Next Action
  let nextAction = null;
  if (priorityGap && priorityGap.gap > 0) {
    nextAction = {
      pillarName: priorityGap.name,
      text: `Focus on ${priorityGap.name} (${priorityGap.score}% / Target: ${priorityGap.targetBenchmark}%) to close the ${priorityGap.gap}% gap.`,
      targetRoute: priorityGap.actionTarget,
      label: priorityGap.actionLabel
    };
  } else {
    // If all available pillars meet target, recommend unlocking an unevaluated pillar
    const unevaluated = normalizedPillars.find(p => !p.available);
    if (unevaluated) {
      nextAction = {
        pillarName: unevaluated.name,
        text: `Expand your coverage by completing evaluation in ${unevaluated.name}.`,
        targetRoute: unevaluated.actionTarget,
        label: unevaluated.actionLabel
      };
    } else {
      nextAction = {
        pillarName: 'Campus Drives',
        text: 'All placement readiness benchmarks achieved! Prepare for active campus recruitment drives.',
        targetRoute: 'job-opportunities',
        label: 'View Placement Drives'
      };
    }
  }

  return {
    score: finalScore,
    status: statusTier.label,
    statusTier,
    isEvaluated: true,
    coverageText: `${availableCount} of ${totalCount} pillars evaluated`,
    coverage: {
      available: availableCount,
      total: totalCount,
      percentage: coveragePercent,
      summary: `${availableCount} of ${totalCount} pillars`
    },
    pillars: normalizedPillars,
    strongestArea,
    priorityGap,
    nextAction
  };
}
