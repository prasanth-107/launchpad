// Skill Gap Engine for Modern Placement Launchpad
// Implements transparent competency auditing and data-driven course recommendations

export const BENCHMARK_TARGET = 80;

export const CLASSIFICATION_THRESHOLDS = {
  STRONG_MIN: 80,             // 80–100%: Strong (Placement benchmark cleared)
  NEEDS_IMPROVEMENT_MIN: 60,  // 60–79%: Needs Improvement (Targeted drills needed)
  CRITICAL_GAP_MAX: 59        // Below 60%: Critical Gap (High-priority intervention)
};

// Canonical Placement Competency Domains mapped to existing courses and assessments
export const COMPETENCY_DOMAINS = [
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    shortName: 'DSA',
    category: 'Core CS',
    assessmentCategory: 'Data Structures',
    recommendedCourseTitle: 'Campus DSA Masterclass (Java & C++)',
    courseTarget: 'courses',
    practiceTarget: 'dsa-sheets',
    assessmentTarget: 'assessments',
    targetScore: 80,
    description: 'Dynamic programming, binary trees, graph traversals, and time-complexity optimization.'
  },
  {
    id: 'web_dev',
    name: 'Modern Web Architecture (React & JavaScript)',
    shortName: 'Web Dev',
    category: 'Web Development',
    assessmentCategory: 'Web Development',
    recommendedCourseTitle: 'Full Stack Web Architecture with React & FastAPI',
    courseTarget: 'courses',
    practiceTarget: 'resources',
    assessmentTarget: 'assessments',
    targetScore: 80,
    description: 'ES6+ async/await, component state lifecycles, REST APIs, and responsive design.'
  },
  {
    id: 'database',
    name: 'Relational Databases & SQL Normalization',
    shortName: 'SQL / DB',
    category: 'Database',
    assessmentCategory: 'Database',
    recommendedCourseTitle: 'Full Stack Web Architecture with React & FastAPI',
    courseTarget: 'courses',
    practiceTarget: 'resources',
    assessmentTarget: 'assessments',
    targetScore: 80,
    description: 'Multi-table JOINs, subqueries, 3NF schema normalization, and indexing strategies.'
  },
  {
    id: 'aptitude',
    name: 'Quantitative Aptitude & Logical Reasoning',
    shortName: 'Aptitude',
    category: 'Problem Solving',
    assessmentCategory: 'Aptitude',
    recommendedCourseTitle: 'Quantitative Aptitude & Logical Reasoning for Campus Drives',
    courseTarget: 'courses',
    practiceTarget: 'resources',
    assessmentTarget: 'assessments',
    targetScore: 75,
    description: 'Speed math, percentages, time & work equations, syllogisms, and puzzle deduction.'
  },
  {
    id: 'python',
    name: 'Python Programming & Problem Solving',
    shortName: 'Python',
    category: 'Programming',
    assessmentCategory: 'Python',
    recommendedCourseTitle: 'Full Stack Web Architecture with React & FastAPI',
    courseTarget: 'courses',
    practiceTarget: 'resources',
    assessmentTarget: 'assessments',
    targetScore: 80,
    description: 'OOP abstractions, collections, list comprehensions, and algorithmic scripting.'
  },
  {
    id: 'system_design',
    name: 'System Design & Scalability',
    shortName: 'System Design',
    category: 'Architecture',
    assessmentCategory: 'System Design',
    recommendedCourseTitle: 'System Design for University Graduates',
    courseTarget: 'courses',
    practiceTarget: 'resources',
    assessmentTarget: 'assessments',
    targetScore: 75,
    description: 'Load balancing, caching, database sharding, and distributed microservices.'
  }
];

/**
 * Classifies a numerical score into transparent competency tiers.
 * @param {number|null} score
 * @returns {{ tier: string, label: string, variant: 'success'|'warning'|'danger'|'neutral' }}
 */
export function classifySkillScore(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      tier: 'NOT_ASSESSED',
      label: 'Not Assessed',
      variant: 'neutral',
      description: 'Insufficient assessment data to calculate benchmark.'
    };
  }
  if (score >= CLASSIFICATION_THRESHOLDS.STRONG_MIN) {
    return {
      tier: 'STRONG',
      label: 'Strong',
      variant: 'success',
      description: 'Placement benchmark met. Ready for campus screening rounds.'
    };
  }
  if (score >= CLASSIFICATION_THRESHOLDS.NEEDS_IMPROVEMENT_MIN) {
    return {
      tier: 'NEEDS_IMPROVEMENT',
      label: 'Needs Improvement',
      variant: 'warning',
      description: 'Near placement benchmark. Targeted drills needed to reach 80%.'
    };
  }
  return {
    tier: 'CRITICAL_GAP',
    label: 'Critical Gap',
    variant: 'danger',
    description: 'Below placement clearing threshold. High-priority study required.'
  };
}

/**
 * Generates an actionable, course-connected next step for a skill.
 */
function generateRecommendation(domain, score, classification) {
  if (classification.tier === 'CRITICAL_GAP') {
    return {
      urgency: 'High',
      actionText: `Enroll in ${domain.recommendedCourseTitle} and retake the diagnostic assessment.`,
      targetRoute: domain.courseTarget,
      assessmentCategory: domain.assessmentCategory,
      type: 'course'
    };
  }
  if (classification.tier === 'NEEDS_IMPROVEMENT') {
    return {
      urgency: 'Medium',
      actionText: `Complete targeted practice drills in ${domain.name} to close the ${domain.targetScore - score}% gap.`,
      targetRoute: domain.practiceTarget,
      assessmentCategory: domain.assessmentCategory,
      type: 'practice'
    };
  }
  return {
    urgency: 'Low',
    actionText: `Placement benchmark cleared (${score}%). Maintain readiness with periodic mock interviews.`,
    targetRoute: 'interview',
    assessmentCategory: domain.assessmentCategory,
    type: 'maintain'
  };
}

/**
 * Computes transparent Skill Gap analysis from real candidate assessment attempts.
 * @param {Array} attempts - Real assessment attempts from database
 * @param {Array} userSkills - User skills from user_skills table
 * @param {Array} courses - Available courses
 * @returns {Object} Complete skill gap report
 */
export function computeSkillGaps(attempts = [], userSkills = [], courses = []) {
  // 1. Strict Empty State Check
  if (!attempts || attempts.length === 0) {
    return {
      hasEnoughData: false,
      overallCoveragePercent: 0,
      totalAssessedDomains: 0,
      totalCompetencies: COMPETENCY_DOMAINS.length,
      domains: [],
      strongSkills: [],
      skillsToImprove: [],
      criticalGaps: [],
      topStrength: null,
      biggestGap: null,
      recommendedNextAction: null,
      topicBreakdown: [],
      message: 'Complete your first assessment to identify your strengths and skill gaps.'
    };
  }

  // 2. Aggregate attempt performance by Competency Domain
  const assessedDomains = [];
  const topicStats = {}; // topic/sub-skill -> { correct, total }

  COMPETENCY_DOMAINS.forEach((domain) => {
    // Match attempts by category or title substring
    const domainAttempts = attempts.filter((a) => {
      const cat = (a.category || a.assessment_title || '').toLowerCase();
      const matchKey = domain.assessmentCategory.toLowerCase();
      const nameKey = domain.name.toLowerCase();
      return cat.includes(matchKey) || matchKey.includes(cat) || cat.includes(nameKey);
    });

    if (domainAttempts.length > 0) {
      // Calculate real average score
      const totalScore = domainAttempts.reduce((sum, a) => sum + (Number(a.score_percent) || 0), 0);
      const avgScore = Math.round(totalScore / domainAttempts.length);
      const classification = classifySkillScore(avgScore);
      const gapPercent = Math.max(0, domain.targetScore - avgScore);

      // Extract question-level topic breakdowns if available
      domainAttempts.forEach((att) => {
        const breakdown = att.details?.detailed_breakdown;
        if (Array.isArray(breakdown)) {
          breakdown.forEach((q) => {
            const topicName = q.skill || domain.shortName;
            if (!topicStats[topicName]) {
              topicStats[topicName] = { correct: 0, total: 0, domain: domain.shortName };
            }
            topicStats[topicName].total += 1;
            if (q.is_correct) {
              topicStats[topicName].correct += 1;
            }
          });
        }
      });

      const recommendation = generateRecommendation(domain, avgScore, classification);

      assessedDomains.push({
        ...domain,
        score: avgScore,
        attemptsCount: domainAttempts.length,
        latestAttemptDate: domainAttempts[0]?.created_at || null,
        targetScore: domain.targetScore,
        gapPercent,
        classification,
        recommendation
      });
    }
  });

  // 3. Classify into Strong, Needs Improvement, and Critical Gaps
  const strongSkills = assessedDomains.filter((d) => d.classification.tier === 'STRONG');
  const skillsToImprove = assessedDomains.filter((d) => d.classification.tier === 'NEEDS_IMPROVEMENT');
  const criticalGaps = assessedDomains.filter((d) => d.classification.tier === 'CRITICAL_GAP');

  // 4. Determine Top Strength and Biggest Gap
  let topStrength = null;
  let biggestGap = null;

  if (assessedDomains.length > 0) {
    // Highest score among assessed
    const sortedByScore = [...assessedDomains].sort((a, b) => b.score - a.score);
    topStrength = sortedByScore[0];

    // Largest gap (target - current score)
    const sortedByGap = [...assessedDomains].sort((a, b) => b.gapPercent - a.gapPercent);
    if (sortedByGap[0] && sortedByGap[0].gapPercent > 0) {
      biggestGap = sortedByGap[0];
    } else {
      // If all cleared target, the lowest score represents relative gap
      biggestGap = sortedByScore[sortedByScore.length - 1];
    }
  }

  // 5. Recommended Next Action
  let recommendedNextAction = null;
  if (biggestGap && biggestGap.recommendation) {
    recommendedNextAction = {
      domainName: biggestGap.name,
      score: biggestGap.score,
      gap: biggestGap.gapPercent,
      actionText: biggestGap.recommendation.actionText,
      targetRoute: biggestGap.recommendation.targetRoute,
      category: biggestGap.assessmentCategory,
      urgency: biggestGap.recommendation.urgency
    };
  }

  // 6. Detailed Sub-Topic List
  const topicBreakdown = Object.entries(topicStats).map(([topic, stats]) => {
    const accuracy = Math.round((stats.correct / stats.total) * 100);
    return {
      topic,
      domain: stats.domain,
      correct: stats.correct,
      total: stats.total,
      accuracy,
      classification: classifySkillScore(accuracy)
    };
  });

  // 7. Overall Coverage
  const overallCoveragePercent = Math.round((assessedDomains.length / COMPETENCY_DOMAINS.length) * 100);

  return {
    hasEnoughData: assessedDomains.length > 0,
    overallCoveragePercent,
    totalAssessedDomains: assessedDomains.length,
    totalCompetencies: COMPETENCY_DOMAINS.length,
    domains: assessedDomains,
    strongSkills,
    skillsToImprove,
    criticalGaps,
    topStrength,
    biggestGap,
    recommendedNextAction,
    topicBreakdown,
    message: null
  };
}
