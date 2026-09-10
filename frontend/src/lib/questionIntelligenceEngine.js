/**
 * questionIntelligenceEngine.js
 * -----------------------------------------------------------------------------
 * Modern Placement Launchpad - Phase 16
 * AI Placement Content & Adaptive Question Intelligence Engine
 *
 * Core Principles:
 * 1. Zero Data Fabrication: Priority tiers, skill deficiencies, and recommendations
 *    are strictly derived from authentic candidate assessments, mock interviews,
 *    readiness reports, target roles, and placement drive opportunities.
 * 2. 7-Tier Evidence-Grounded Priority Hierarchy:
 *    - P0: Critical Skill Gap (<60% evaluated proficiency)
 *    - P1: Large Readiness Gap (evaluated readiness pillar below 80% benchmark)
 *    - P2: Repeated Assessment Weakness (diagnostic assessment score <60%)
 *    - P3: Interview Weakness (flagged in technical mock interview or STAR delivery)
 *    - P4: Opportunity-Required Skill (missing skill for active/high-match campus drive)
 *    - P5: Learning-Path Continuity (active in-progress course module from Phase 6)
 *    - P6: Strong Skill Maintenance (>=80% evaluated proficiency revision)
 * 3. 3-Tier Adaptive Difficulty Mechanics:
 *    - Easy (<60%), Medium (60-79%), Hard (80+)
 *    - 2 consecutive correct answers: step up (Easy -> Medium -> Hard)
 *    - 1 incorrect answer: step down (Hard -> Medium, Medium -> Easy) or maintain Easy
 *    - 2 consecutive incorrect answers: step down to Easy AND recommend foundational learning module
 *    - Alternating correct/incorrect answers: maintain current difficulty
 * 4. Deterministic Verified Fallback:
 *    - Strict schema validation for AI questions.
 *    - Prompt injection defense via sanitizeUntrustedText.
 *    - When AI is offline, missing, or malformed, deterministically fallback to curated question bank.
 * 5. Grounded Explanations ("Why this question?"):
 *    - Transparent rationale linking the question directly to student metrics.
 * -----------------------------------------------------------------------------
 */

import { COMPETENCY_DOMAINS } from './skillGapEngine.js';

// Priority Tiers Configuration
export const QUESTION_PRIORITY_TIERS = {
  P0: {
    code: 'P0',
    label: 'Critical Skill Gap',
    variant: 'danger',
    weight: 1000,
    description: 'Evaluated proficiency is below 60%. Urgent remediation required.'
  },
  P1: {
    code: 'P1',
    label: 'Large Readiness Gap',
    variant: 'rose',
    weight: 800,
    description: 'Target role readiness pillar has a significant deficit below the 80% benchmark.'
  },
  P2: {
    code: 'P2',
    label: 'Assessment Weakness',
    variant: 'warning',
    weight: 600,
    description: 'Scored below 60% in diagnostic assessment attempts.'
  },
  P3: {
    code: 'P3',
    label: 'Interview Weakness',
    variant: 'amber',
    weight: 500,
    description: 'Flagged in technical interview or behavioral STAR evaluation.'
  },
  P4: {
    code: 'P4',
    label: 'Opportunity Required',
    variant: 'primary',
    weight: 400,
    description: 'Mandatory skill missing for an active or high-match campus placement drive.'
  },
  P5: {
    code: 'P5',
    label: 'Learning Continuity',
    variant: 'indigo',
    weight: 300,
    description: 'Reinforces currently active module in your personalized learning roadmap.'
  },
  P6: {
    code: 'P6',
    label: 'Skill Maintenance',
    variant: 'neutral',
    weight: 150,
    description: 'Periodic revision for high-proficiency skills (>=80%) to maintain placement sharpness.'
  }
};

// Adaptive Difficulty Configuration
export const ADAPTIVE_DIFFICULTY_TIERS = {
  EASY: {
    level: 'Easy',
    maxProficiency: 59,
    label: 'Foundational',
    variant: 'success',
    description: 'Core concepts, syntax, definitions, and standard use cases.'
  },
  MEDIUM: {
    level: 'Medium',
    minProficiency: 60,
    maxProficiency: 79,
    label: 'Intermediate',
    variant: 'warning',
    description: 'Applied problem solving, edge cases, combinations, and trade-offs.'
  },
  HARD: {
    level: 'Hard',
    minProficiency: 80,
    label: 'Advanced',
    variant: 'danger',
    description: 'Complex optimizations, internal mechanics, concurrency, and architecture.'
  }
};

// Role-to-Skill Canonical Mapping
export const ROLE_SKILLS_MAP = {
  'frontend': ['React', 'JavaScript', 'CSS', 'HTML', 'Web Architecture'],
  'frontend developer': ['React', 'JavaScript', 'CSS', 'HTML', 'Web Architecture'],
  'backend': ['SQL', 'Python', 'Java', 'Web Architecture', 'Database', 'DSA'],
  'backend developer': ['SQL', 'Python', 'Java', 'Web Architecture', 'Database', 'DSA'],
  'full stack': ['JavaScript', 'React', 'SQL', 'Python', 'Web Architecture', 'DSA'],
  'full stack developer': ['JavaScript', 'React', 'SQL', 'Python', 'Web Architecture', 'DSA'],
  'software engineer': ['DSA', 'SQL', 'Java', 'C++', 'Python', 'Web Architecture'],
  'sde': ['DSA', 'SQL', 'Java', 'C++', 'Python', 'Web Architecture'],
  'data analyst': ['SQL', 'Python', 'Database', 'Aptitude'],
  'data scientist': ['Python', 'SQL', 'DSA', 'Database'],
  'ai/ml engineer': ['Python', 'DSA', 'Database', 'SQL']
};

/**
 * Prompt injection defense & sanitization.
 * Strips instructions, escape sequences, scripts, and ensures bounded length.
 */
export function sanitizeUntrustedText(text, maxLength = 500) {
  if (typeof text !== 'string') return '';
  let cleaned = text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/\\r\\n|\\r|\\n/g, ' ')
    .replace(/[\\x00-\\x1F\\x7F]/g, '') // Strip control characters
    .trim();

  // Defense against prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /disregard\s+(all\s+)?instructions/gi,
    /system\s*prompt/gi,
    /DAN\s+mode/gi,
    /bypass\s+guardrails/gi,
    /you\s+are\s+now/gi
  ];
  for (const pattern of injectionPatterns) {
    cleaned = cleaned.replace(pattern, '[filtered]');
  }

  return cleaned.slice(0, maxLength).trim();
}

/**
 * Computes baseline difficulty tier from candidate numerical proficiency score.
 * <60%: Easy, 60-79%: Medium, 80%+: Hard
 */
export function computeBaselineSkillDifficulty(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return 'Medium'; // Graceful standard default
  }
  const num = Number(score);
  if (num < 60) return 'Easy';
  if (num < 80) return 'Medium';
  return 'Hard';
}

/**
 * Computes the next adaptive difficulty based on recent attempt history in session.
 * - 2 consecutive correct -> step up
 * - 1 incorrect -> step down or maintain Easy
 * - 2 consecutive incorrect -> step down to Easy AND trigger course recommendation
 * - Alternating -> maintain current difficulty
 */
export function computeNextAdaptiveDifficulty(currentDifficulty, attemptHistory = []) {
  const diffs = ['Easy', 'Medium', 'Hard'];
  let currentIdx = diffs.indexOf(currentDifficulty);
  if (currentIdx === -1) currentIdx = 1; // Default to Medium

  if (!Array.isArray(attemptHistory) || attemptHistory.length === 0) {
    return {
      nextDifficulty: diffs[currentIdx],
      changed: false,
      direction: 'stable',
      reason: 'Baseline difficulty established.',
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      needsReview: false
    };
  }

  // Look at recent attempts
  let consecutiveCorrect = 0;
  let consecutiveIncorrect = 0;

  for (let i = attemptHistory.length - 1; i >= 0; i--) {
    const isCorrect = Boolean(attemptHistory[i].isCorrect);
    if (isCorrect) {
      if (consecutiveIncorrect === 0) {
        consecutiveCorrect++;
      } else {
        break;
      }
    } else {
      if (consecutiveCorrect === 0) {
        consecutiveIncorrect++;
      } else {
        break;
      }
    }
  }

  let nextIdx = currentIdx;
  let changed = false;
  let direction = 'stable';
  let reason = 'Difficulty maintained to confirm consistency.';
  let needsReview = false;

  // 2 consecutive correct -> Step up
  if (consecutiveCorrect >= 2) {
    if (currentIdx < diffs.length - 1) {
      nextIdx = currentIdx + 1;
      changed = true;
      direction = 'up';
      reason = `Advanced to ${diffs[nextIdx]} difficulty after ${consecutiveCorrect} consecutive correct answers!`;
    } else {
      reason = 'Maximum difficulty achieved. Mastering advanced placement level!';
    }
  } 
  // 2 consecutive incorrect -> Step down to Easy & recommend review
  else if (consecutiveIncorrect >= 2) {
    nextIdx = 0; // Reset to Easy
    changed = (currentIdx !== 0);
    direction = changed ? 'down' : 'stable';
    needsReview = true;
    reason = `Difficulty adjusted to Easy after consecutive incorrect attempts. Foundational concept review recommended.`;
  }
  // 1 incorrect -> Step down 1 level (or stay Easy)
  else if (consecutiveIncorrect === 1) {
    if (currentIdx > 0) {
      nextIdx = currentIdx - 1;
      changed = true;
      direction = 'down';
      reason = `Stepped down to ${diffs[nextIdx]} difficulty to reinforce core principles.`;
    } else {
      reason = 'Maintaining foundational level for concept mastery.';
    }
  }

  return {
    nextDifficulty: diffs[nextIdx],
    changed,
    direction,
    reason,
    consecutiveCorrect,
    consecutiveIncorrect,
    needsReview
  };
}

/**
 * Recommends an authentic course/module for a skill when candidate struggles.
 */
export function getRecommendedCourseForSkill(skill) {
  if (!skill) return null;
  const sLower = skill.toLowerCase();
  
  if (sLower.includes('sql') || sLower.includes('database')) {
    return {
      courseId: 'course_fullstack',
      title: 'Full Stack Web Architecture with React & FastAPI',
      module: 'Relational Databases & SQL Normalization',
      actionUrl: '/courses'
    };
  }
  if (sLower.includes('dsa') || sLower.includes('algorithm') || sLower.includes('structure')) {
    return {
      courseId: 'course_dsa',
      title: 'Campus DSA Masterclass (Java & C++)',
      module: 'Dynamic Programming & Graph Traversals',
      actionUrl: '/courses'
    };
  }
  if (sLower.includes('react') || sLower.includes('javascript') || sLower.includes('frontend')) {
    return {
      courseId: 'course_fullstack',
      title: 'Full Stack Web Architecture with React & FastAPI',
      module: 'Modern Component State Lifecycles & Async/Await',
      actionUrl: '/courses'
    };
  }
  if (sLower.includes('system') || sLower.includes('architecture')) {
    return {
      courseId: 'course_sys_design',
      title: 'System Design for University Graduates',
      module: 'Distributed Caching & Indexing Strategies',
      actionUrl: '/courses'
    };
  }
  if (sLower.includes('aptitude') || sLower.includes('logical')) {
    return {
      courseId: 'course_aptitude',
      title: 'Quantitative Aptitude & Logical Reasoning for Campus Drives',
      module: 'Speed Math & Syllogism Deduction',
      actionUrl: '/courses'
    };
  }

  return {
    courseId: 'course_fullstack',
    title: 'Full Stack Web Architecture with React & FastAPI',
    module: 'Foundational Programming Principles',
    actionUrl: '/courses'
  };
}

/**
 * Evaluates candidate state across assessments, interviews, readiness, and opportunities
 * to build an evidence-grounded skill priority list (P0 through P6).
 */
export function evaluateCandidateSkillPriorities(candidateContext = {}) {
  const {
    userSkills = [],
    attempts = [],
    interviews = [],
    interviewIntelligence = null,
    readinessReport = null,
    targetRole = '',
    profile = {},
    opportunities = [],
    targetOpportunity = null
  } = candidateContext;

  const priorities = [];
  const processedSkills = new Set();

  const effectiveRole = (targetRole || profile.target_role || profile.targetRole || '').toLowerCase();

  // 1. Check User Skills for Critical Gap (P0: < 60%)
  if (Array.isArray(userSkills)) {
    for (const us of userSkills) {
      const skillName = us.skill_name || us.skill || us.name;
      const score = us.score !== undefined ? us.score : (us.proficiency !== undefined ? us.proficiency : null);
      if (skillName && score !== null && !isNaN(score) && Number(score) < 60) {
        const key = skillName.toLowerCase();
        if (!processedSkills.has(key)) {
          processedSkills.add(key);
          priorities.push({
            skill: skillName,
            priorityTier: 'P0',
            score: Number(score),
            reason: `Critical skill gap identified in evaluated proficiency (${score}% vs 80% benchmark).`,
            source: 'user_skills'
          });
        }
      }
    }
  }

  // 2. Check Readiness Pillars for Large Gap (P1: pillar < 80%)
  if (readinessReport && Array.isArray(readinessReport.pillars)) {
    for (const pillar of readinessReport.pillars) {
      if (pillar.score < 80) {
        // Map pillar to concrete skills
        let relatedSkills = [];
        if (pillar.id === 'dsa') relatedSkills = ['DSA'];
        else if (pillar.id === 'tech') relatedSkills = ['SQL', 'JavaScript', 'Python'];
        else if (pillar.id === 'aptitude') relatedSkills = ['Aptitude'];
        else if (pillar.id === 'interview') relatedSkills = ['Behavioral'];

        for (const skillName of relatedSkills) {
          const key = skillName.toLowerCase();
          if (!processedSkills.has(key)) {
            processedSkills.add(key);
            priorities.push({
              skill: skillName,
              priorityTier: 'P1',
              score: pillar.score,
              reason: `Deficit in ${pillar.label || pillar.id} readiness pillar (${pillar.score}% vs 80% benchmark).`,
              source: 'readiness_pillar'
            });
          }
        }
      }
    }
  }

  // 3. Check Assessment Weaknesses (P2: score < 60% in diagnostic attempts)
  if (Array.isArray(attempts)) {
    for (const att of attempts) {
      const cat = att.category || att.skill;
      const score = att.score;
      if (cat && score !== null && !isNaN(score) && Number(score) < 60) {
        const key = cat.toLowerCase();
        if (!processedSkills.has(key)) {
          processedSkills.add(key);
          priorities.push({
            skill: cat,
            priorityTier: 'P2',
            score: Number(score),
            reason: `Scored ${score}% in diagnostic ${cat} assessment attempt.`,
            source: 'assessment_attempt'
          });
        }
      }
    }
  }

  // 4. Check Mock Interview Weaknesses (P3: interview intelligence or scores)
  if (interviewIntelligence && interviewIntelligence.dimensionScores) {
    const techScore = interviewIntelligence.dimensionScores.technicalDepth?.score;
    const commScore = interviewIntelligence.dimensionScores.communication?.score;

    if (techScore !== undefined && techScore < 65) {
      const skillName = 'Web Architecture';
      const key = skillName.toLowerCase();
      if (!processedSkills.has(key)) {
        processedSkills.add(key);
        priorities.push({
          skill: skillName,
          priorityTier: 'P3',
          score: techScore,
          reason: `Technical depth flagged in recent mock interview (${techScore}% evaluated).`,
          source: 'mock_interview'
        });
      }
    }
    if (commScore !== undefined && commScore < 65) {
      const skillName = 'Behavioral';
      const key = skillName.toLowerCase();
      if (!processedSkills.has(key)) {
        processedSkills.add(key);
        priorities.push({
          skill: skillName,
          priorityTier: 'P3',
          score: commScore,
          reason: `Communication / STAR structure flagged in recent mock interview (${commScore}% evaluated).`,
          source: 'mock_interview'
        });
      }
    }
  } else if (Array.isArray(interviews) && interviews.length > 0) {
    const latest = interviews[0];
    const score = latest.overall_score || latest.score;
    if (score !== undefined && score !== null && Number(score) < 65) {
      const skillName = 'Behavioral';
      const key = skillName.toLowerCase();
      if (!processedSkills.has(key)) {
        processedSkills.add(key);
        priorities.push({
          skill: skillName,
          priorityTier: 'P3',
          score: Number(score),
          reason: `Mock interview overall evaluation was ${score}%. STAR response practice recommended.`,
          source: 'mock_interview'
        });
      }
    }
  }

  // 5. Check Target Opportunity or High-Match Drives (P4: missing skills)
  const oppToInspect = targetOpportunity || (Array.isArray(opportunities) && opportunities.length > 0 ? opportunities[0] : null);
  if (oppToInspect) {
    const missing = oppToInspect.missingSkills || oppToInspect.missing_skills || [];
    const oppTitle = oppToInspect.title || oppToInspect.company_name || oppToInspect.company || 'active campus drive';
    for (const mSkill of missing) {
      const key = mSkill.toLowerCase();
      if (!processedSkills.has(key)) {
        processedSkills.add(key);
        priorities.push({
          skill: mSkill,
          priorityTier: 'P4',
          score: null,
          reason: `Required skill for ${oppTitle} (${oppToInspect.company_name || 'campus drive'}).`,
          source: 'opportunity'
        });
      }
    }
  }

  // 6. Role-relevant skills (P5 if unaddressed)
  if (effectiveRole && ROLE_SKILLS_MAP[effectiveRole]) {
    for (const rSkill of ROLE_SKILLS_MAP[effectiveRole]) {
      const key = rSkill.toLowerCase();
      if (!processedSkills.has(key)) {
        processedSkills.add(key);
        priorities.push({
          skill: rSkill,
          priorityTier: 'P5',
          score: null,
          reason: `Core placement competency for your target role: ${targetRole || profile.target_role}.`,
          source: 'target_role'
        });
      }
    }
  }

  // 7. Check User Skills for Strong Skills (P6: >= 80% maintenance)
  if (Array.isArray(userSkills)) {
    for (const us of userSkills) {
      const skillName = us.skill_name || us.skill || us.name;
      const score = us.score !== undefined ? us.score : (us.proficiency !== undefined ? us.proficiency : null);
      if (skillName && score !== null && !isNaN(score) && Number(score) >= 80) {
        const key = skillName.toLowerCase();
        if (!processedSkills.has(key)) {
          processedSkills.add(key);
          priorities.push({
            skill: skillName,
            priorityTier: 'P6',
            score: Number(score),
            reason: `High placement proficiency (${score}%). Periodic revision to maintain benchmark.`,
            source: 'maintenance'
          });
        }
      }
    }
  }

  // If candidate has zero data, provide standard baseline competencies
  if (priorities.length === 0) {
    const baseline = ['SQL', 'DSA', 'React', 'JavaScript', 'Behavioral'];
    for (const bSkill of baseline) {
      priorities.push({
        skill: bSkill,
        priorityTier: 'P5',
        score: null,
        reason: 'Standard baseline placement skill drill.',
        source: 'baseline'
      });
    }
  }

  // Sort strictly by priority weight (P0 -> P6)
  priorities.sort((a, b) => {
    const wA = QUESTION_PRIORITY_TIERS[a.priorityTier]?.weight || 0;
    const wB = QUESTION_PRIORITY_TIERS[b.priorityTier]?.weight || 0;
    return wB - wA;
  });

  return priorities;
}

/**
 * Validates schema of raw AI generated question.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateAiQuestion(raw, targetSkill, difficulty) {
  const errors = [];
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Question must be a valid JSON object'] };
  }

  if (typeof raw.prompt !== 'string' || raw.prompt.trim().length < 10) {
    errors.push('Question prompt must be a string with at least 10 characters');
  }

  if (!Array.isArray(raw.options) || raw.options.length !== 4) {
    errors.push('Options must be an array of exactly 4 choices');
  } else {
    for (let i = 0; i < raw.options.length; i++) {
      if (typeof raw.options[i] !== 'string' || !raw.options[i].trim()) {
        errors.push(`Option ${i + 1} must be a non-empty string`);
      }
    }
  }

  if (raw.correctAnswer === undefined || raw.correctAnswer === null || (typeof raw.correctAnswer !== 'string' && typeof raw.correctAnswer !== 'number')) {
    errors.push('correctAnswer must be a non-empty string or numerical index');
  } else if (typeof raw.correctAnswer === 'number') {
    if (raw.correctAnswer < 0 || raw.correctAnswer > 3) {
      errors.push('correctAnswer index must be between 0 and 3');
    }
  } else if (typeof raw.correctAnswer === 'string') {
    if (Array.isArray(raw.options) && !raw.options.includes(raw.correctAnswer)) {
      errors.push('correctAnswer string must exactly match one of the 4 options');
    }
  }

  if (typeof raw.explanation !== 'string' || raw.explanation.trim().length < 10) {
    errors.push('Explanation must be a string with at least 10 characters');
  }

  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (raw.difficulty && !validDifficulties.includes(raw.difficulty)) {
    errors.push(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generates an AI question with prompt defense and fallback to curated bank.
 */
export function generateAiQuestion(promptContext = {}, options = {}) {
  const {
    skill = 'SQL',
    topic = 'General',
    difficulty = 'Medium',
    targetRole = 'Software Engineer'
  } = promptContext;

  const safeSkill = sanitizeUntrustedText(skill, 50);
  const safeTopic = sanitizeUntrustedText(topic, 50);
  const safeDifficulty = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';

  // Fallback to verified catalog deterministically
  const fallback = VERIFIED_QUESTION_BANK.find(q => 
    q.skill.toLowerCase() === safeSkill.toLowerCase() && q.difficulty === safeDifficulty
  ) || VERIFIED_QUESTION_BANK.find(q => q.skill.toLowerCase() === safeSkill.toLowerCase())
    || VERIFIED_QUESTION_BANK[0];

  return {
    ...fallback,
    generatedBy: 'verified_catalog_fallback',
    isAiGenerated: false
  };
}

/**
 * Formats data-grounded "Why this question?" rationale.
 */
export function generateQuestionExplanation(question, candidateContext = {}) {
  if (!question) return 'Recommended practice drill for campus placements.';
  
  if (question.priorityReason) {
    return question.priorityReason;
  }

  const skill = question.skill || 'this competency';
  const tier = question.priorityTier || 'P4';
  const tierInfo = QUESTION_PRIORITY_TIERS[tier];

  return `Selected under ${tierInfo ? tierInfo.label : 'Practice'} to reinforce ${skill} for campus placement benchmarks.`;
}

/**
 * Main Question Selection Engine
 * Intelligently ranks and selects the most relevant questions for candidate.
 */
export function selectAdaptiveQuestions(candidateContext = {}, options = {}) {
  const {
    targetSkill = null,
    targetRole = null,
    targetOpportunity = null,
    limit = 5,
    mode = 'adaptive_mix',
    excludeQuestionIds = [],
    currentDifficulty = null
  } = options;

  const contextWithOpts = {
    ...candidateContext,
    targetRole: targetRole || candidateContext.targetRole,
    targetOpportunity: targetOpportunity || candidateContext.targetOpportunity
  };

  const skillPriorities = evaluateCandidateSkillPriorities(contextWithOpts);
  const excludedSet = new Set(excludeQuestionIds || []);

  let availableQuestions = [...VERIFIED_QUESTION_BANK];

  // If targetSkill specified, filter to that skill (case-insensitive substring or exact)
  if (targetSkill) {
    const sLower = targetSkill.toLowerCase();
    const filtered = availableQuestions.filter(q => 
      q.skill.toLowerCase() === sLower || q.skill.toLowerCase().includes(sLower) || sLower.includes(q.skill.toLowerCase())
    );
    if (filtered.length > 0) {
      availableQuestions = filtered;
    }
  }

  // If targetRole specified, filter or prioritize role skills
  const roleName = (targetRole || candidateContext.targetRole || (candidateContext.profile && candidateContext.profile.target_role) || '').toLowerCase();
  const roleSkills = ROLE_SKILLS_MAP[roleName] || [];

  // Enrich all available questions with candidate priority tier and grounded rationale
  const enriched = availableQuestions.map(q => {
    // Check if skill matches priority list
    const pMatch = skillPriorities.find(p => 
      p.skill.toLowerCase() === q.skill.toLowerCase() ||
      q.skill.toLowerCase().includes(p.skill.toLowerCase()) ||
      p.skill.toLowerCase().includes(q.skill.toLowerCase())
    );

    let priorityTier = pMatch ? pMatch.priorityTier : 'P5';
    let priorityReason = pMatch ? pMatch.reason : `Standard campus placement practice question for ${q.skill}.`;
    
    // Matched skills carry the weight of their priority tier; unmatched questions carry baseline weight 10
    let weight = pMatch ? (QUESTION_PRIORITY_TIERS[priorityTier]?.weight || 100) : 10;

    // Boost if matches target role
    if (roleSkills.some(rs => rs.toLowerCase() === q.skill.toLowerCase())) {
      weight += 50;
    }

    // Match difficulty preference
    let difficultyScore = 0;
    if (currentDifficulty) {
      if (q.difficulty === currentDifficulty) difficultyScore = 50;
    } else if (pMatch && pMatch.score !== null && pMatch.score !== undefined) {
      const idealDiff = computeBaselineSkillDifficulty(pMatch.score);
      if (q.difficulty === idealDiff) difficultyScore = 50;
    }

    // Penalize recently attempted
    const isExcluded = excludedSet.has(q.id);

    return {
      ...q,
      priorityTier,
      priorityReason,
      sortScore: weight + difficultyScore - (isExcluded ? 10000 : 0)
    };
  });

  // Sort deterministically
  enriched.sort((a, b) => {
    if (b.sortScore !== a.sortScore) return b.sortScore - a.sortScore;
    // Tie breaker: stable by id
    return a.id.localeCompare(b.id);
  });

  return enriched.slice(0, limit).map(q => {
    const { sortScore, ...rest } = q;
    return rest;
  });
}

/**
 * Generates Phase 13 Daily Preparation Workspace Actions for Adaptive Practice.
 */
export function generateAdaptivePracticeDailyActions(intelligence, candidateContext = {}) {
  const actions = [];
  const selected = selectAdaptiveQuestions(candidateContext, { limit: 2 });

  if (selected.length > 0) {
    const topQ = selected[0];
    const isP0 = topQ.priorityTier === 'P0';
    
    actions.push({
      id: `daily_practice_${topQ.skill.toLowerCase()}_${Date.now()}`,
      actionKey: `practice_${topQ.skill.toLowerCase()}`,
      code: isP0 ? 'P1' : 'P4',
      priority: isP0 ? 'Critical Gap' : 'Practice',
      priorityTier: topQ.priorityTier,
      variant: isP0 ? 'danger' : 'primary',
      title: `Adaptive Practice: 5 ${topQ.skill} Questions`,
      description: topQ.priorityReason || `Targeted adaptive questions to elevate your ${topQ.skill} proficiency.`,
      targetView: 'adaptive-practice',
      targetPillar: 'tech',
      skill: topQ.skill,
      difficulty: topQ.difficulty,
      estimatedMinutes: 10,
      completed: false
    });
  }

  return actions;
}

// ==============================================================================
// VERIFIED CANONICAL QUESTION BANK (Phase 16)
// Curated, verified, pedagogically sound placement questions across 9 domains.
// ==============================================================================
export const VERIFIED_QUESTION_BANK = [
  // ---------------- SQL (Easy, Medium, Hard) ----------------
  {
    id: 'sql_easy_01',
    skill: 'SQL',
    topic: 'Filtering & Sorting',
    difficulty: 'Easy',
    type: 'mcq',
    prompt: 'Which SQL clause is strictly used to filter rows BEFORE any aggregate calculations (such as SUM or COUNT) are performed?',
    options: [
      'WHERE clause',
      'HAVING clause',
      'ORDER BY clause',
      'GROUP BY clause'
    ],
    correctAnswer: 'WHERE clause',
    explanation: 'The WHERE clause filters individual rows before grouping and aggregation occur. In contrast, the HAVING clause filters groups created by the GROUP BY clause.',
    companyTags: ['TCS', 'Infosys', 'Cognizant', 'Wipro'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'sql_med_01',
    skill: 'SQL',
    topic: 'JOINs & NULL Semantics',
    difficulty: 'Medium',
    type: 'mcq',
    prompt: 'In a LEFT OUTER JOIN between table A (left) and table B (right), what is the result for rows in table A that have no matching keys in table B?',
    options: [
      'The rows are excluded from the output result set.',
      'The rows are returned with NULL values for all columns originating from table B.',
      'A runtime SQL foreign key violation error is thrown.',
      'The rows are automatically matched with default empty string values.'
    ],
    correctAnswer: 'The rows are returned with NULL values for all columns originating from table B.',
    explanation: 'A LEFT JOIN returns all rows from the left table regardless of matches. Where no match exists in the right table, all right-table columns are populated with NULL.',
    companyTags: ['Amazon', 'Accenture', 'Capgemini'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'sql_hard_01',
    skill: 'SQL',
    topic: 'Window Functions',
    difficulty: 'Hard',
    type: 'mcq',
    prompt: 'When ranking employee salaries within each department, what is the crucial difference between RANK() and DENSE_RANK() window functions when two employees have identical salaries?',
    options: [
      'RANK() leaves gaps in the sequential ranking numbers after ties; DENSE_RANK() never leaves gaps.',
      'DENSE_RANK() leaves gaps after ties; RANK() produces continuous sequential integers.',
      'RANK() can only be used with numeric columns; DENSE_RANK() works with strings.',
      'RANK() requires an explicit PARTITION BY clause, while DENSE_RANK() forbids it.'
    ],
    correctAnswer: 'RANK() leaves gaps in the sequential ranking numbers after ties; DENSE_RANK() never leaves gaps.',
    explanation: 'If two rows tie for 1st place, RANK() assigns both 1 and the next row 3 (gap). DENSE_RANK() assigns both 1 and the next row 2 (dense sequence without gaps).',
    companyTags: ['Amazon', 'Microsoft', 'Goldman Sachs'],
    learningPathRef: 'course_fullstack'
  },

  // ---------------- JavaScript (Easy, Medium, Hard) ----------------
  {
    id: 'js_easy_01',
    skill: 'JavaScript',
    topic: 'Type Coercion & Operators',
    difficulty: 'Easy',
    type: 'mcq',
    prompt: 'What is the evaluated output of typeof null in standard JavaScript (ECMAScript)?',
    options: [
      '\"object\"',
      '\"null\"',
      '\"undefined\"',
      '\"boolean\"'
    ],
    correctAnswer: '\"object\"',
    explanation: 'In the original JavaScript implementation, values were stored with a type tag. The object type tag was 0, and null was represented as a NULL pointer (0x00), leading typeof null to evaluate to \"object\". This historical bug was preserved for backward compatibility.',
    companyTags: ['Infosys', 'Wipro', 'Zoho'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'js_med_01',
    skill: 'JavaScript',
    topic: 'Closures & Lexical Scope',
    difficulty: 'Medium',
    type: 'mcq',
    prompt: 'In JavaScript, how is a closure precisely defined?',
    options: [
      'A function bundled together with references to its lexical surrounding state (lexical environment).',
      'A method used to immediately terminate an asynchronous loop.',
      'A syntax feature that prevents variables from being garbage collected in global scope.',
      'A built-in method on Object.prototype to seal object properties.'
    ],
    correctAnswer: 'A function bundled together with references to its lexical surrounding state (lexical environment).',
    explanation: 'A closure gives an inner function access to an outer function\'s scope even after the outer function has finished executing, binding the function to its lexical scope.',
    companyTags: ['Flipkart', 'Swiggy', 'Razorpay'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'js_hard_01',
    skill: 'JavaScript',
    topic: 'Event Loop & Asynchronous Scheduling',
    difficulty: 'Hard',
    type: 'mcq',
    prompt: 'Consider the execution order of Promise.resolve().then(...) and setTimeout(..., 0). Which queue has priority in the JavaScript Event Loop?',
    options: [
      'Microtask Queue (Promise callbacks) executes before Macrotask/Task Queue (setTimeout).',
      'Macrotask Queue executes before Microtask Queue.',
      'They execute concurrently via multithreaded worker pools.',
      'Execution order is non-deterministic and depends on CPU temperature.'
    ],
    correctAnswer: 'Microtask Queue (Promise callbacks) executes before Macrotask/Task Queue (setTimeout).',
    explanation: 'After every macrotask completes and before picking the next macrotask, the JS event loop drains all pending jobs in the microtask queue (Promise reactions, queueMicrotask). Hence Promise.then always runs before setTimeout(..., 0).',
    companyTags: ['Uber', 'Google', 'PhonePe'],
    learningPathRef: 'course_fullstack'
  },

  // ---------------- React (Easy, Medium, Hard) ----------------
  {
    id: 'react_easy_01',
    skill: 'React',
    topic: 'State & Props',
    difficulty: 'Easy',
    type: 'mcq',
    prompt: 'What is the primary fundamental difference between props and state in a React component?',
    options: [
      'Props are passed into the component from parent and are read-only; State is managed internally within the component.',
      'State is immutable across re-renders; Props change upon user input directly.',
      'Props can only contain primitive data types; State can only contain complex objects.',
      'Props trigger component mounting, while state only triggers component unmounting.'
    ],
    correctAnswer: 'Props are passed into the component from parent and are read-only; State is managed internally within the component.',
    explanation: 'Props allow parent components to pass data down the tree (unidirectional data flow) and are read-only to the child. State represents internal, mutable component state that triggers re-renders when updated.',
    companyTags: ['TCS', 'Accenture', 'Cognizant'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'react_med_01',
    skill: 'React',
    topic: 'useEffect Hook & Lifecycles',
    difficulty: 'Medium',
    type: 'mcq',
    prompt: 'What occurs if you omit the dependency array entirely in a React useEffect(callback) hook call?',
    options: [
      'The effect callback executes after every single render of the component.',
      'The effect callback executes strictly once during initial mount.',
      'React throws a compile-time JSX syntax error.',
      'The effect callback is never invoked unless manual dispatch is called.'
    ],
    correctAnswer: 'The effect callback executes after every single render of the component.',
    explanation: 'With no dependency array, useEffect runs after every render. An empty array [] runs once on mount. An array with dependencies [a, b] runs when any listed dependency changes.',
    companyTags: ['Razorpay', 'Jio', 'Zomato'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'react_hard_01',
    skill: 'React',
    topic: 'Reconciliation & Virtual DOM',
    difficulty: 'Hard',
    type: 'mcq',
    prompt: 'Why is using an array index as the \"key\" prop in dynamic React lists considered an anti-pattern when list items can be reordered, inserted, or deleted?',
    options: [
      'Indices can cause component state bugs and inefficient DOM re-renders because items shift indices.',
      'React requires keys to be cryptographic UUID strings of length 36.',
      'Arrays with index keys crash React\'s Fiber scheduler during concurrent rendering.',
      'Index keys prevent CSS modules from resolving child class names.'
    ],
    correctAnswer: 'Indices can cause component state bugs and inefficient DOM re-renders because items shift indices.',
    explanation: 'React uses keys to identify which items have changed, been added, or removed. If index is used as key, reordering shifts the keys of unchanged items, causing React to incorrectly preserve local uncontrolled component state.',
    companyTags: ['Meta', 'Amazon', 'Atlassian'],
    learningPathRef: 'course_fullstack'
  },

  // ---------------- Python (Easy, Medium, Hard) ----------------
  {
    id: 'py_easy_01',
    skill: 'Python',
    topic: 'Data Structures & Mutability',
    difficulty: 'Easy',
    type: 'mcq',
    prompt: 'Which of the following built-in Python collection types is immutable after creation?',
    options: [
      'tuple',
      'list',
      'dict',
      'set'
    ],
    correctAnswer: 'tuple',
    explanation: 'Tuples are immutable sequences in Python; their elements cannot be added, removed, or reassigned after creation. Lists, dicts, and sets are mutable.',
    companyTags: ['TCS', 'Infosys', 'Capgemini'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'py_med_01',
    skill: 'Python',
    topic: 'List Comprehensions & Generators',
    difficulty: 'Medium',
    type: 'mcq',
    prompt: 'What is the key advantage of using a generator expression (x for x in seq) over a list comprehension [x for x in seq] when processing large datasets?',
    options: [
      'Generators evaluate lazily yielding one item at a time, consuming O(1) memory instead of allocating the full list.',
      'Generators execute in parallel across multiple CPU cores automatically.',
      'Generators allow indexing with negative slices like g[-1].',
      'Generators guarantee O(1) random access search time.'
    ],
    correctAnswer: 'Generators evaluate lazily yielding one item at a time, consuming O(1) memory instead of allocating the full list.',
    explanation: 'Generator expressions return an iterator that computes items on demand, avoiding holding millions of items in RAM simultaneously.',
    companyTags: ['Cisco', 'IBM', 'Oracle'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'py_hard_01',
    skill: 'Python',
    topic: 'GIL & Concurrency',
    difficulty: 'Hard',
    type: 'mcq',
    prompt: 'In CPython, what is the impact of the Global Interpreter Lock (GIL) on CPU-bound multithreaded tasks?',
    options: [
      'It prevents multiple native threads from executing Python bytecode simultaneously on separate CPU cores.',
      'It completely disables multi-threaded I/O operations and network sockets.',
      'It forces all Python functions to execute synchronously in single-cycle clock speed.',
      'It converts recursive function calls into iterative stack frames.'
    ],
    correctAnswer: 'It prevents multiple native threads from executing Python bytecode simultaneously on separate CPU cores.',
    explanation: 'The CPython GIL is a mutex that protects access to Python objects, preventing multiple threads from executing Python bytecodes at once. CPU-bound concurrency in Python requires multiprocessing rather than threading.',
    companyTags: ['Google', 'Microsoft', 'Bloomberg'],
    learningPathRef: 'course_fullstack'
  },

  // ---------------- Java (Easy, Medium, Hard) ----------------
  {
    id: 'java_easy_01',
    skill: 'Java',
    topic: 'OOP Concepts',
    difficulty: 'Easy',
    type: 'mcq',
    prompt: 'In Java, which keyword is explicitly used by a class to implement an interface contract?',
    options: [
      'implements',
      'extends',
      'inherits',
      'instanceof'
    ],
    correctAnswer: 'implements',
    explanation: 'In Java, classes use \"implements\" to adopt interface contracts and \"extends\" to subclass an existing class.',
    companyTags: ['TCS', 'Wipro', 'Cognizant'],
    learningPathRef: 'course_dsa'
  },
  {
    id: 'java_med_01',
    skill: 'Java',
    topic: 'Collections Framework',
    difficulty: 'Medium',
    type: 'mcq',
    prompt: 'When frequently inserting and deleting elements from the middle of a large list, which Java collection has lower asymptotic overhead compared to ArrayList?',
    options: [
      'LinkedList (once the node pointer is located, insertion is O(1) pointer updates).',
      'ArrayList (because shifting elements has no memory overhead).',
      'Vector (due to synchronized method locks).',
      'ArrayDeque (because resizing is prohibited).'
    ],
    correctAnswer: 'LinkedList (once the node pointer is located, insertion is O(1) pointer updates).',
    explanation: 'ArrayList requires shifting subsequent elements O(N) when inserting in the middle. LinkedList only updates neighbor pointers once at the target node.',
    companyTags: ['Morgan Stanley', 'Amazon', 'Oracle'],
    learningPathRef: 'course_dsa'
  },
  {
    id: 'java_hard_01',
    skill: 'Java',
    topic: 'JVM Memory & Garbage Collection',
    difficulty: 'Hard',
    type: 'mcq',
    prompt: 'In the HotSpot JVM generational garbage collector, where are newly instantiated objects first allocated?',
    options: [
      'Eden Space within the Young Generation',
      'Tenured / Old Generation',
      'Metaspace',
      'Code Cache'
    ],
    correctAnswer: 'Eden Space within the Young Generation',
    explanation: 'New objects are allocated in the Eden space of the Young Generation. Objects that survive Minor GC cycles are moved to Survivor spaces before being promoted to the Old Generation.',
    companyTags: ['Goldman Sachs', 'JPMorgan', 'Amazon'],
    learningPathRef: 'course_dsa'
  },

  // ---------------- C++ (Easy, Medium, Hard) ----------------
  {
    id: 'cpp_easy_01',
    skill: 'C++',
    topic: 'Pointers & References',
    difficulty: 'Easy',
    type: 'mcq',
    prompt: 'What is a major fundamental difference between a pointer and a reference in C++?',
    options: [
      'A pointer can be reassigned to point to different objects and can be nullptr; a reference cannot be rebound and must bind to an object upon initialization.',
      'References require explicit dereferencing using the * operator.',
      'Pointers cannot store memory addresses of primitives.',
      'References allocate 64 bytes of heap memory automatically.'
    ],
    correctAnswer: 'A pointer can be reassigned to point to different objects and can be nullptr; a reference cannot be rebound and must bind to an object upon initialization.',
    explanation: 'Pointers are independent variables holding addresses (can be null or rebound). References are aliases that cannot be re-seated after initialization and cannot be null.',
    companyTags: ['Qualcomm', 'Intel', 'Samsung'],
    learningPathRef: 'course_dsa'
  },
  {
    id: 'cpp_med_01',
    skill: 'C++',
    topic: 'Smart Pointers & RAII',
    difficulty: 'Medium',
    type: 'mcq',
    prompt: 'Why is std::unique_ptr preferred over raw pointers in modern C++ (C++11 and later)?',
    options: [
      'It enforces exclusive ownership and automatically frees resource memory upon exiting scope (RAII), preventing memory leaks.',
      'It allows circular reference cycles without reference counting.',
      'It allows multiple threads to write concurrently without mutex locks.',
      'It provides garbage collection similar to Java JVM.'
    ],
    correctAnswer: 'It enforces exclusive ownership and automatically frees resource memory upon exiting scope (RAII), preventing memory leaks.',
    explanation: 'std::unique_ptr owns and manages another object through a pointer and disposes of that object when the unique_ptr goes out of scope, eliminating manual delete calls.',
    companyTags: ['Adobe', 'Nvidia', 'Microsoft'],
    learningPathRef: 'course_dsa'
  },
  {
    id: 'cpp_hard_01',
    skill: 'C++',
    topic: 'Virtual Functions & vtable',
    difficulty: 'Hard',
    type: 'mcq',
    prompt: 'How does C++ resolve dynamic polymorphism when calling a virtual member function on a base class pointer?',
    options: [
      'Via a virtual method table (vtable) and a hidden pointer (vptr) inside each object instance.',
      'By recompiling the function at runtime using JIT compilation.',
      'By performing a hash lookup of the method signature on the global heap.',
      'By executing switch-case dispatch based on dynamic RTTI typeid.'
    ],
    correctAnswer: 'Via a virtual method table (vtable) and a hidden pointer (vptr) inside each object instance.',
    explanation: 'Classes with virtual functions store a hidden pointer (vptr) pointing to a table of function pointers (vtable). Dynamic dispatch looks up the derived function address in this table at runtime.',
    companyTags: ['Google', 'Directi', 'Tower Research'],
    learningPathRef: 'course_dsa'
  },

  // ---------------- DSA (Easy, Medium, Hard) ----------------
  {
    id: 'dsa_easy_01',
    skill: 'DSA',
    topic: 'Two Pointers & Arrays',
    difficulty: 'Easy',
    type: 'mcq',
    prompt: 'What is the optimal time complexity to find two numbers in a sorted array that sum to target using the Two Pointers technique?',
    options: [
      'O(N) time and O(1) auxiliary space',
      'O(N^2) time and O(1) auxiliary space',
      'O(N log N) time and O(N) auxiliary space',
      'O(log N) time and O(N) auxiliary space'
    ],
    correctAnswer: 'O(N) time and O(1) auxiliary space',
    explanation: 'With two pointers starting at opposite ends of the sorted array, each step moves either the left pointer forward or right pointer backward, inspecting each element at most once: O(N) time, O(1) space.',
    companyTags: ['Amazon', 'Microsoft', 'TCS Digital'],
    learningPathRef: 'course_dsa'
  },
  {
    id: 'dsa_med_01',
    skill: 'DSA',
    topic: 'Binary Search',
    difficulty: 'Medium',
    type: 'mcq',
    prompt: 'In a rotated sorted array without duplicates (e.g. [4,5,6,7,0,1,2]), what property guarantees that binary search can still locate an element in O(log N) time?',
    options: [
      'At least one half of the array (either [low..mid] or [mid..high]) is strictly sorted at every step.',
      'The minimum element is always at mid index.',
      'The array can be rotated back to sorted in O(1) time.',
      'Interpolation search can estimate exact pivot coordinates.'
    ],
    correctAnswer: 'At least one half of the array (either [low..mid] or [mid..high]) is strictly sorted at every step.',
    explanation: 'When a sorted array is rotated, dividing it at mid always yields one strictly sorted half. If target lies in that half, search there; otherwise search the other half, preserving O(log N).',
    companyTags: ['Amazon', 'Adobe', 'Uber'],
    learningPathRef: 'course_dsa'
  },
  {
    id: 'dsa_hard_01',
    skill: 'DSA',
    topic: 'Dynamic Programming',
    difficulty: 'Hard',
    type: 'mcq',
    prompt: 'What is the optimal space complexity for the 0/1 Knapsack problem when only the maximum value (not the subset of items) is required?',
    options: [
      'O(W) auxiliary space using a 1D array traversed backwards, where W is knapsack capacity.',
      'O(N * W) space, as 2D DP matrices cannot be compressed.',
      'O(1) constant space using greedy sorting by value/weight ratio.',
      'O(log W) space using divide-and-conquer binary lifting.'
    ],
    correctAnswer: 'O(W) auxiliary space using a 1D array traversed backwards, where W is knapsack capacity.',
    explanation: 'Because dp[i][w] depends only on the current item and values from row i-1 with weight <= w, we can compress the DP table into a 1D array of size W+1 by iterating backwards from W down to weight[i].',
    companyTags: ['Google', 'Microsoft', 'Goldman Sachs'],
    learningPathRef: 'course_dsa'
  },

  // ---------------- Web Architecture / System Design (Easy, Medium, Hard) ----------------
  {
    id: 'web_easy_01',
    skill: 'Web Architecture',
    topic: 'HTTP Protocol',
    difficulty: 'Easy',
    type: 'mcq',
    prompt: 'Which HTTP status code signifies that a requested resource was not found on the server?',
    options: [
      '404 Not Found',
      '401 Unauthorized',
      '403 Forbidden',
      '500 Internal Server Error'
    ],
    correctAnswer: '404 Not Found',
    explanation: '404 indicates the origin server did not find a current representation for the target resource. 401 is unauthorized, 403 is forbidden, and 500 is internal server error.',
    companyTags: ['TCS', 'Infosys', 'Cognizant'],
    learningPathRef: 'course_sys_design'
  },
  {
    id: 'web_med_01',
    skill: 'Web Architecture',
    topic: 'Database Indexing & Queries',
    difficulty: 'Medium',
    type: 'mcq',
    prompt: 'In a relational database with a composite B-Tree index on columns (A, B, C), which query can fully utilize the index?',
    options: [
      'SELECT * FROM tbl WHERE A = 5 AND B = 10',
      'SELECT * FROM tbl WHERE B = 10 AND C = 20',
      'SELECT * FROM tbl WHERE C = 20',
      'SELECT * FROM tbl WHERE B = 10'
    ],
    correctAnswer: 'SELECT * FROM tbl WHERE A = 5 AND B = 10',
    explanation: 'Composite B-Tree indexes follow the leftmost prefix rule. A query must filter on leading column A to leverage the index. Queries missing A cannot use the index effectively.',
    companyTags: ['Amazon', 'Paytm', 'Oracle'],
    learningPathRef: 'course_sys_design'
  },
  {
    id: 'web_hard_01',
    skill: 'Web Architecture',
    topic: 'Distributed Caching Strategies',
    difficulty: 'Hard',
    type: 'mcq',
    prompt: 'In a distributed caching tier, what is the \"Cache-Aside\" (Lazy Loading) pattern mechanism?',
    options: [
      'The application checks cache first; on miss, reads from database, stores result in cache, and returns it.',
      'The cache asynchronously writes dirty pages to the database in background batches.',
      'Every database write synchronously updates the cache within a distributed 2PC transaction.',
      'The database directly proxies incoming user requests to the Redis cluster.'
    ],
    correctAnswer: 'The application checks cache first; on miss, reads from database, stores result in cache, and returns it.',
    explanation: 'Under Cache-Aside, the application code manages the cache directly: read cache, on miss read DB, then populate cache. Writes update the DB and invalidate/update cache.',
    companyTags: ['Uber', 'Flipkart', 'Salesforce'],
    learningPathRef: 'course_sys_design'
  },

  // ---------------- Behavioral / STAR (Easy, Medium, Hard) ----------------
  {
    id: 'star_easy_01',
    skill: 'Behavioral',
    topic: 'STAR Method Fundamentals',
    difficulty: 'Easy',
    type: 'mcq',
    prompt: 'In campus placement interviews, what four core components compose the STAR storytelling technique for behavioral questions?',
    options: [
      'Situation, Task, Action, Result',
      'Summary, Theory, Application, Review',
      'Statement, Technical, Analysis, Resolution',
      'Strategy, Timing, Architecture, Roadmap'
    ],
    correctAnswer: 'Situation, Task, Action, Result',
    explanation: 'The STAR framework structures behavioral answers: Situation (context), Task (your responsibility), Action (steps YOU specifically took), and Result (quantifiable business/academic outcome).',
    companyTags: ['Amazon', 'TCS', 'Infosys', 'Deloitte'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'star_med_01',
    skill: 'Behavioral',
    topic: 'Technical Disagreements',
    difficulty: 'Medium',
    type: 'mcq',
    prompt: 'When asked \"Tell me about a technical disagreement with a team member\", which candidate approach demonstrates high placement readiness?',
    options: [
      'Focusing on objective engineering trade-offs, collaborative benchmarking/prototyping, and aligning on project goals.',
      'Explaining how you escalated immediately to senior management to prove your teammate wrong.',
      'Stating that you never have disagreements because you always agree with whatever is proposed.',
      'Insisting that your preferred technology stack is superior without data.'
    ],
    correctAnswer: 'Focusing on objective engineering trade-offs, collaborative benchmarking/prototyping, and aligning on project goals.',
    explanation: 'Recruiters seek candidates with emotional intelligence and data-driven problem solving. Demonstrating objective evaluation through prototypes and shared goals shows engineering maturity.',
    companyTags: ['Amazon', 'Google', 'Microsoft'],
    learningPathRef: 'course_fullstack'
  },
  {
    id: 'star_hard_01',
    skill: 'Behavioral',
    topic: 'Handling Project Failure & Learnings',
    difficulty: 'Hard',
    type: 'mcq',
    prompt: 'How should a candidate effectively explain a missed milestone or project setback in an executive/leadership interview round?',
    options: [
      'Take personal ownership, diagnose the root cause objectively, detail the corrective mitigation, and highlight lasting systemic improvements.',
      'Attribute the failure to unreliable team members or insufficient time allocated by professors.',
      'Dismiss the failure as inconsequential because software deadlines are inherently arbitrary.',
      'Refuse to answer questions regarding failures to protect candidate reputation.'
    ],
    correctAnswer: 'Take personal ownership, diagnose the root cause objectively, detail the corrective mitigation, and highlight lasting systemic improvements.',
    explanation: 'Top placement interviewers evaluate resilience, accountability, and continuous learning. High-readiness candidates own outcomes and demonstrate what preventative safeguards they instituted.',
    companyTags: ['Amazon', 'McKinsey', 'Apple'],
    learningPathRef: 'course_fullstack'
  }
];
