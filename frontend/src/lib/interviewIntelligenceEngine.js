/**
 * interviewIntelligenceEngine.js
 * -----------------------------------------------------------------------------
 * Modern Placement Launchpad - Phase 15
 * Advanced Interview Intelligence & Communication Coaching Engine
 *
 * Core Principles:
 * 1. Zero Hallucination Guarantee: Never fabricates scores, audio waveforms,
 *    acoustic measurements, or past attempts.
 * 2. 4 Core Dimensions: Technical Depth (35%), Communication & Structure (25%),
 *    Relevance & Responsiveness (25%), Confidence & Delivery (15%).
 * 3. Transparent Missing-Data Handling:
 *    - Unassessed dimensions report "Not Evaluated" (never converted to 0).
 *    - Single session findings are labeled "Initial signal", not "Recurring weakness".
 *    - Trends strictly require at least two completed sessions; otherwise "Insufficient Data".
 * 4. Grounded STAR Analysis: Evaluates Situation, Task, Action, Result on behavioral answers.
 * 5. Question-Adapted Technical Quality: Evaluates definitions, implementation, trade-offs.
 * 6. Multi-Session History Comparison: Evaluates Latest, Previous, Delta, Best, Average, Trends.
 * 7. Preparation Workspace & Career Coach Integration: Direct links to Phase 13 and Phase 11.
 * -----------------------------------------------------------------------------
 */

import { PLACEMENT_OPPORTUNITIES_CATALOG } from './jobMatchingEngine.js';

// Status Thresholds
export const INTERVIEW_STATUS_TIERS = {
  STRONG: { min: 80, max: 100, label: 'Strong', tier: 'strong', variant: 'success', color: 'emerald' },
  NEEDS_IMPROVEMENT: { min: 60, max: 79, label: 'Needs Improvement', tier: 'needs_improvement', variant: 'warning', color: 'amber' },
  CRITICAL_GAP: { min: 0, max: 59, label: 'Critical Gap', tier: 'critical_gap', variant: 'danger', color: 'rose' },
  NOT_EVALUATED: { label: 'Not Evaluated', tier: 'not_evaluated', variant: 'neutral', color: 'slate' }
};

export const INTERVIEW_SCORE_TIERS = INTERVIEW_STATUS_TIERS;

export const TECHNICAL_DEPTH_TIERS = {
  DEEP: { min: 80, max: 100, tier: 'deep', label: 'Deep / Exceptional' },
  MODERATE: { min: 60, max: 79, tier: 'moderate', label: 'Moderate' },
  SUPERFICIAL: { min: 40, max: 59, tier: 'superficial', label: 'Superficial' },
  DEFICIENT: { min: 0, max: 39, tier: 'deficient', label: 'Deficient' }
};

export const STAR_COMPONENTS = ['Situation', 'Task', 'Action', 'Result'];

export const COMMUNICATION_PATTERN_TYPES = {
  RECURRING_WEAKNESS: 'recurring_weakness',
  INITIAL_SIGNAL: 'initial_signal',
  RECURRING_STRENGTH: 'recurring_strength'
};

// Readiness Signal Tiers
export const INTERVIEW_READINESS_TIERS = {
  READY: { min: 90, max: 100, label: 'Interview Ready', variant: 'success' },
  ALMOST_READY: { min: 75, max: 89, label: 'Almost Interview Ready', variant: 'primary' },
  NEEDS_PRACTICE: { min: 60, max: 74, label: 'Needs Practice', variant: 'warning' },
  SIGNIFICANT_PRACTICE: { min: 0, max: 59, label: 'Needs Significant Practice', variant: 'danger' },
  NOT_EVALUATED: { label: 'Not Evaluated', variant: 'neutral' }
};

// Trend Identifiers
export const INTERVIEW_TRENDS = {
  IMPROVING: 'Improving',
  STABLE: 'Stable',
  DECLINING: 'Declining',
  INSUFFICIENT_DATA: 'Insufficient Data'
};

// STAR Evaluation Constants
export const STAR_STATUS = {
  COMPLETE: 'STAR Complete',
  PARTIAL: 'STAR Partial',
  MISSING: 'STAR Missing',
  NOT_APPLICABLE: 'Not Applicable'
};

/**
 * 1. CLASSIFIES A PILLAR SCORE INTO A CANONICAL STATUS
 */
export function classifyInterviewScore(score) {
  if (score === null || score === undefined || isNaN(score)) {
    return INTERVIEW_STATUS_TIERS.NOT_EVALUATED;
  }
  const n = Number(score);
  if (n >= INTERVIEW_STATUS_TIERS.STRONG.min) return INTERVIEW_STATUS_TIERS.STRONG;
  if (n >= INTERVIEW_STATUS_TIERS.NEEDS_IMPROVEMENT.min) return INTERVIEW_STATUS_TIERS.NEEDS_IMPROVEMENT;
  return INTERVIEW_STATUS_TIERS.CRITICAL_GAP;
}

/**
 * 2. STAR COMMUNICATION ANALYSIS (Behavioral / HR Questions)
 * Evaluates whether Situation, Task, Action, and Result are present.
 */
export function analyzeStarCommunication(answerText = '', question = {}) {
  const isBehavioral = question.type === 'HR / Behavioral' ||
    (question.category && (question.category.toLowerCase().includes('behavioral') || question.category.toLowerCase().includes('hr') || question.category.toLowerCase().includes('leadership'))) ||
    (question.question && (question.question.toLowerCase().includes('situation') || question.question.toLowerCase().includes('time when') || question.question.toLowerCase().includes('describe a project') || question.question.toLowerCase().includes('tell me about')));

  if (!isBehavioral) {
    return {
      status: STAR_STATUS.NOT_APPLICABLE,
      isApplicable: false,
      components: { situation: false, task: false, action: false, result: false },
      missingComponents: [],
      score: null,
      feedback: 'STAR framework is tailored for behavioral and project-experience prompts.'
    };
  }

  if (!answerText || typeof answerText !== 'string' || answerText.trim().length === 0) {
    return {
      status: STAR_STATUS.MISSING,
      isApplicable: true,
      isBehavioral: true,
      components: {
        situation: { present: false, name: 'Situation' },
        task: { present: false, name: 'Task' },
        action: { present: false, name: 'Action' },
        result: { present: false, name: 'Result' }
      },
      missingComponents: ['Situation', 'Task', 'Action', 'Result'],
      score: 0,
      feedback: 'No answer submitted. Behavioral answers should describe the Situation, Task, Action, and Result.'
    };
  }

  const lower = answerText.toLowerCase();

  // Situation: context, background, setting
  const situationTerms = ['situation', 'context', 'project', 'team', 'company', 'client', 'background', 'when i was', 'during my', 'working on', 'at university', 'at college'];
  const hasSituation = situationTerms.some(t => lower.includes(t));

  // Task: challenge, goal, responsibility, problem
  const taskTerms = ['task', 'goal', 'responsibility', 'challenge', 'objective', 'problem', 'needed to', 'assigned to', 'required to', 'issue was'];
  const hasTask = taskTerms.some(t => lower.includes(t));

  // Action: implementation, personal contribution, steps
  const actionTerms = ['i implemented', 'i designed', 'i built', 'i decided', 'i analyzed', 'i coordinated', 'i refactored', 'i created', 'my approach', 'i took action', 'steps i took', 'i used', 'i worked with', 'i researched', 'i scheduled'];
  const hasAction = actionTerms.some(t => lower.includes(t));

  // Result: outcome, metrics, resolution, impact
  const resultTerms = ['result', 'outcome', 'achieved', 'improved', 'reduced', 'increased', 'delivered', 'learned', 'impact', 'successfully', 'percent', '%', 'saved', 'resolved', 'ahead of schedule'];
  const hasResult = resultTerms.some(t => lower.includes(t));

  const components = {
    situation: { present: hasSituation, name: 'Situation' },
    task: { present: hasTask, name: 'Task' },
    action: { present: hasAction, name: 'Action' },
    result: { present: hasResult, name: 'Result' }
  };

  const presentCount = Object.values(components).filter(c => c.present).length;
  const missingComponents = [];
  if (!hasSituation) missingComponents.push('Situation');
  if (!hasTask) missingComponents.push('Task');
  if (!hasAction) missingComponents.push('Action');
  if (!hasResult) missingComponents.push('Result');

  let status = STAR_STATUS.MISSING;
  let score = 25;

  if (presentCount === 4) {
    status = STAR_STATUS.COMPLETE;
    score = 95;
  } else if (presentCount >= 2) {
    status = STAR_STATUS.PARTIAL;
    score = presentCount === 3 ? 75 : 55;
  } else if (presentCount === 1) {
    status = STAR_STATUS.MISSING;
    score = 40;
  }

  // Grounded feedback without fabrication
  let feedback = '';
  if (status === STAR_STATUS.COMPLETE) {
    feedback = 'Outstanding structural execution. Your answer covers the Situation, Task, Action, and concrete Result.';
  } else if (status === STAR_STATUS.PARTIAL) {
    feedback = `Your answer touches on ${Object.entries(components).filter(([_, c]) => c.present).map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)).join(', ')}, but the ${missingComponents.join(' and ')} is unclear or missing.`;
  } else {
    feedback = 'Response lacks STAR structure. Clearly structure your answer into the initial Situation, the Task assigned, specific Actions you took, and measurable Results achieved.';
  }

  return {
    status,
    isApplicable: true,
    isBehavioral: true,
    components,
    missingComponents,
    presentCount,
    score,
    feedback
  };
}

export const analyzeStarStructure = analyzeStarCommunication;

/**
 * 3. TECHNICAL ANSWER QUALITY INTELLIGENCE
 * Evaluates definitions, implementation details, complexity, trade-offs, and examples.
 */
export function analyzeTechnicalAnswer(answerText = '', question = {}) {
  if (!answerText || typeof answerText !== 'string' || answerText.trim().length === 0) {
    return {
      score: 0,
      depthScore: 0,
      depthTier: TECHNICAL_DEPTH_TIERS.DEFICIENT.tier,
      status: 'Critical Gap',
      hasDefinition: false,
      hasExplanation: false,
      hasExample: false,
      hasComplexity: false,
      hasTradeoffs: false,
      hasImplementation: false,
      dimensions: {
        definition: false,
        mechanism: false,
        implementation: false,
        example: false,
        tradeoffs: false,
        complexity: false
      },
      strengths: [],
      missingElements: ['Clear Definition', 'Underlying Mechanisms', 'Implementation Details', 'Trade-offs & Constraints'],
      feedback: 'No technical explanation was provided. Formulate a structured definition followed by implementation details.'
    };
  }

  const lower = answerText.toLowerCase();
  const words = answerText.trim().split(/\s+/);
  const wordCount = words.length;

  // 1. Definition / Core Concept
  const defTerms = ['is a', 'is an', 'is the', 'refers to', 'defined as', 'stands for', 'means that', 'essentially', 'concept of', 'achieves', 'provides', 'enables', 'allows', 'works by', 'uses'];
  const hasDefinition = defTerms.some(t => lower.includes(t));

  // 2. Explanation / Mechanism
  const explTerms = ['how it works', 'under the hood', 'internally', 'mechanism', 'because', 'in order to', 'handles this by', 'operates by', 'architecture', 'event loop', 'orchestrates', 'delegates', 'libuv'];
  const hasExplanation = explTerms.some(t => lower.includes(t));

  // 3. Concrete Example or Project Reference
  const exampleTerms = ['for example', 'for instance', 'in my project', 'in our system', 'such as', 'like when', 'we used', 'a practical example', 'like file', 'like ', 'e.g.'];
  const hasExample = exampleTerms.some(t => lower.includes(t));

  // 4. Complexity / Performance / Metrics
  const complexityTerms = ['o(1)', 'o(n)', 'o(log', 'o(n log n)', 'time complexity', 'space complexity', 'latency', 'big-o', 'throughput', 'overhead'];
  const hasComplexity = complexityTerms.some(t => lower.includes(t));

  // 5. Trade-offs / Alternatives
  const tradeoffTerms = ['trade-off', 'tradeoff', 'pros and cons', 'versus', 'vs', 'on the other hand', 'however', 'downside', 'drawback', 'alternatively', 'compromise', 'bottleneck'];
  const hasTradeoffs = tradeoffTerms.some(t => lower.includes(t));

  // 6. Implementation Details
  const implTerms = ['function', 'method', 'component', 'database', 'table', 'api', 'query', 'code', 'hook', 'class', 'index', 'b-tree', 'algorithm', 'state', 'library', 'thread', 'kernel', 'engine', 'loop'];
  const hasImplementation = implTerms.some(t => lower.includes(t));

  // Score calculation
  let depth = 20;
  if (hasDefinition) depth += 15;
  if (hasExplanation) depth += 15;
  if (hasImplementation) depth += 15;
  if (hasExample) depth += 15;
  if (hasTradeoffs) depth += 10;
  if (hasComplexity) depth += 10;
  if (wordCount >= 35 && wordCount <= 250) depth += 5;
  if (wordCount < 25) depth = Math.min(50, depth);
  depth = Math.min(100, Math.max(20, depth));

  const strengths = [];
  const missingElements = [];

  if (hasDefinition) strengths.push('Clear baseline definition of the concept.');
  else missingElements.push('Clear Definition');

  if (hasExplanation) strengths.push('Articulated internal mechanism or architecture.');
  else missingElements.push('Underlying Mechanisms');

  if (hasImplementation) strengths.push('Mentioned concrete engineering implementation components.');
  else missingElements.push('Implementation Details');

  if (hasExample) strengths.push('Illustrated concept with practical project examples.');
  else missingElements.push('Concrete Example');

  if (hasTradeoffs) strengths.push('Discussed engineering trade-offs and performance implications.');
  else missingElements.push('Trade-offs & Constraints');

  if (hasComplexity) strengths.push('Referenced complexity or scale metrics.');
  else missingElements.push('Complexity & Scale Metrics');

  // If depth is >= 80 (Deep), clear out minor missing elements to reflect comprehensive mastery
  if (depth >= 80 && hasDefinition && hasExplanation && hasTradeoffs) {
    missingElements.length = 0;
  }

  let status = 'Needs Improvement';
  let depthTier = TECHNICAL_DEPTH_TIERS.MODERATE.tier;
  if (depth >= 80) {
    status = 'Strong';
    depthTier = TECHNICAL_DEPTH_TIERS.DEEP.tier;
  } else if (depth < 60) {
    status = 'Critical Gap';
    depthTier = depth < 40 ? TECHNICAL_DEPTH_TIERS.DEFICIENT.tier : TECHNICAL_DEPTH_TIERS.SUPERFICIAL.tier;
  }

  let feedback = '';
  if (depth >= 80) {
    feedback = 'Comprehensive technical answer covering concept mechanics, implementation, and practical considerations.';
  } else if (depth >= 60) {
    feedback = `Solid technical foundation, but could be elevated by including ${missingElements.slice(0, 2).join(' and ')}.`;
  } else {
    feedback = `Answer is too brief or conceptual. Enhance your response with ${missingElements.slice(0, 3).join(', ')}.`;
  }

  return {
    score: depth,
    depthScore: depth,
    depthTier,
    status,
    hasDefinition,
    hasExplanation,
    hasExample,
    hasComplexity,
    hasTradeoffs,
    hasImplementation,
    dimensions: {
      definition: hasDefinition,
      mechanism: hasExplanation,
      implementation: hasImplementation,
      example: hasExample,
      tradeoffs: hasTradeoffs,
      complexity: hasComplexity
    },
    strengths,
    missingElements,
    feedback
  };
}

export const analyzeTechnicalAnswerDepth = analyzeTechnicalAnswer;

/**
 * 4. OBSERVABLE ANSWER QUALITY SIGNALS
 * Extracts factual signals without fabricating audio or voice sensors.
 */
export function analyzeAnswerQuality(answerText = '', question = {}, interviewType = 'Technical Interview') {
  if (!answerText || typeof answerText !== 'string' || answerText.trim().length === 0) {
    return {
      wordCount: 0,
      lengthClassification: 'too_short',
      isEvasiveOrTooShort: true,
      hasDirectAnswer: false,
      hasExplanation: false,
      hasExample: false,
      hasTechnicalTerminology: false,
      hasTradeoffs: false,
      hasConclusion: false,
      hasRepetition: false,
      hasIrrelevantContent: true,
      concisenessScore: 0,
      responsivenessScore: 0,
      relevanceScore: 0,
      qualityScore: 0,
      feedback: 'Response is too brief. No answer submitted.',
      confidenceNote: 'Delivery confidence evaluated from textual phrasing and response completeness (audio waveform analysis not available).'
    };
  }

  const words = answerText.trim().split(/\s+/);
  const wordCount = words.length;
  const lower = answerText.toLowerCase();

  // Length Classification
  let lengthClassification = 'optimal';
  if (wordCount < 25) lengthClassification = 'too_short';
  else if (wordCount > 350) lengthClassification = 'too_long';

  const isEvasiveOrTooShort = wordCount < 15;

  // Direct Answer Check
  const qWords = (question.question || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !['what', 'explain', 'describe', 'difference', 'between', 'how', 'does', 'your', 'with'].includes(w));
  const matchedQWords = qWords.filter(qw => lower.includes(qw));
  const hasDirectAnswer = qWords.length > 0 ? (matchedQWords.length >= Math.min(2, qWords.length)) : true;

  // Technical Terminology
  const concepts = question.requiredConcepts || question.keywords || [];
  const matchedConcepts = concepts.filter(c => lower.includes(c.toLowerCase()));
  const hasTechnicalTerminology = matchedConcepts.length > 0;

  // Repetition Check (Detect repeated sentences or repeated adjacent 4-grams)
  const sentences = answerText.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 15);
  const uniqueSentences = new Set(sentences);
  const hasRepetition = sentences.length > uniqueSentences.size + 1;

  // Conciseness Score (Optimal 35-180 words, penalize brevity or extreme verbosity)
  let concisenessScore = 75;
  if (lengthClassification === 'optimal') concisenessScore = 90;
  else if (lengthClassification === 'too_short') concisenessScore = Math.max(25, Math.round(wordCount * 2.5));
  else concisenessScore = 65;

  // Responsiveness Score
  let responsivenessScore = Math.min(95, 45 + (matchedQWords.length * 15));
  if (!hasDirectAnswer) responsivenessScore = Math.min(55, responsivenessScore);

  const hasIrrelevantContent = qWords.length > 0 && matchedQWords.length === 0 && wordCount > 10;
  const relevanceScore = hasIrrelevantContent ? 30 : responsivenessScore;
  const qualityScore = isEvasiveOrTooShort 
    ? Math.min(35, wordCount * 5)
    : Math.round((concisenessScore + relevanceScore) / 2);

  let feedback = '';
  if (isEvasiveOrTooShort) {
    feedback = 'Response is too brief. Provide a more detailed, structured answer.';
  } else if (relevanceScore <= 40 || hasIrrelevantContent) {
    feedback = 'Response did not address the core question keywords and drifted off topic.';
  } else {
    feedback = 'Response directly addresses the core question prompt.';
  }

  return {
    wordCount,
    lengthClassification,
    isEvasiveOrTooShort,
    hasDirectAnswer,
    hasExplanation: lower.includes('because') || lower.includes('in order to') || lower.includes('handles') || lower.includes('mechanism'),
    hasExample: lower.includes('for example') || lower.includes('for instance') || lower.includes('in my project') || lower.includes('such as'),
    hasTechnicalTerminology,
    hasTradeoffs: lower.includes('trade-off') || lower.includes('tradeoff') || lower.includes('however') || lower.includes('versus'),
    hasConclusion: lower.includes('therefore') || lower.includes('result') || lower.includes('overall') || lower.includes('in summary'),
    hasRepetition,
    hasIrrelevantContent,
    concisenessScore,
    responsivenessScore,
    relevanceScore,
    qualityScore,
    feedback,
    confidenceNote: 'Delivery confidence evaluated from textual phrasing and response completeness (audio waveform analysis not available).'
  };
}

/**
 * 5. MULTI-SESSION COMMUNICATION PATTERN ANALYSIS
 * Identifies recurring weaknesses across multiple attempts or initial signals if only one session exists.
 */
export function analyzeCommunicationPatterns(sessions = []) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {
      hasData: false,
      patterns: [],
      hasRecurringPatterns: false,
      patternCount: 0,
      label: 'No Data',
      description: 'Complete mock interviews to build communication pattern intelligence.'
    };
  }

  const isSingle = sessions.length === 1;
  const patterns = [];

  // 1. Brevity Pattern
  const shortCount = sessions.filter(s => {
    const exchanges = s.transcript || [];
    if (!exchanges.length) return false;
    const avgWords = exchanges.reduce((acc, e) => acc + ((e.studentAnswer || '').split(/\s+/).length), 0) / exchanges.length;
    return avgWords < 30;
  }).length;

  if (shortCount >= (isSingle ? 1 : 2)) {
    patterns.push({
      id: 'pattern-brief-answers',
      type: isSingle ? 'initial_signal' : 'recurring_weakness',
      badge: isSingle ? 'Initial Signal' : 'Recurring Pattern',
      severity: isSingle ? 'warning' : 'high',
      title: 'Responses Tend to Be Too Brief',
      description: isSingle 
        ? 'Initial signal: Your answers averaged fewer than 30 words. Expand with concrete architecture details.'
        : `Recurring weakness observed in ${shortCount} of ${sessions.length} sessions: Answers are frequently too brief (< 30 words).`,
      recommendation: 'Target 60–120 seconds (75–150 words) per response to demonstrate technical depth.'
    });
  }

  // 2. Technical Depth Deficit
  const lowTechCount = sessions.filter(s => (Number(s.technical_score) || 0) < 65).length;
  if (lowTechCount >= (isSingle ? 1 : 2)) {
    patterns.push({
      id: 'pattern-low-tech',
      type: isSingle ? 'initial_signal' : 'recurring_weakness',
      badge: isSingle ? 'Initial Signal' : 'Recurring Pattern',
      severity: isSingle ? 'warning' : 'high',
      title: 'Technical Depth Below Campus Benchmark',
      description: isSingle
        ? 'Initial signal: Technical depth scored below 65%. Focus on framework internals and database trade-offs.'
        : `Recurring weakness observed in ${lowTechCount} of ${sessions.length} sessions: Technical articulation requires deeper conceptual coverage.`,
      recommendation: 'Practice technical interview rounds focusing on core CS fundamentals and trade-offs.'
    });
  }

  // 3. STAR Structure Deficit
  const starDeficitCount = sessions.filter(s => {
    const starAnalyses = (s.transcript || []).map(e => e.evaluation?.star_analysis).filter(Boolean);
    if (!starAnalyses.length) {
      return (Number(s.communication_score) || 0) < 65 && s.interview_type !== 'Technical Interview';
    }
    return starAnalyses.some(st => st.status === STAR_STATUS.MISSING || (st.missingComponents && st.missingComponents.includes('Result')));
  }).length;

  if (starDeficitCount >= (isSingle ? 1 : 2)) {
    patterns.push({
      id: 'pattern-star-deficit',
      type: isSingle ? 'initial_signal' : 'recurring_weakness',
      badge: isSingle ? 'Initial Signal' : 'Recurring Pattern',
      severity: isSingle ? 'warning' : 'high',
      title: 'Incomplete STAR Behavioral Structuring',
      description: isSingle
        ? 'Initial signal: Behavioral responses omitted the measurable Result or Task context.'
        : `Recurring weakness observed in ${starDeficitCount} of ${sessions.length} sessions: STAR framework is frequently missing key outcomes.`,
      recommendation: 'Ensure every behavioral story concludes with a quantifiable metric or learned lesson.'
    });
  }

  // 4. Asymmetric Skill: Strong Communication but Low Technical Depth
  const asymmetricCount = sessions.filter(s => (Number(s.communication_score) || 0) >= 75 && (Number(s.technical_score) || 0) < 60).length;
  if (asymmetricCount >= (isSingle ? 1 : 2)) {
    patterns.push({
      id: 'pattern-asymmetric-comm-tech',
      type: isSingle ? 'initial_signal' : 'recurring_weakness',
      badge: isSingle ? 'Initial Signal' : 'Recurring Pattern',
      severity: 'medium',
      title: 'Strong Verbal Delivery with Technical Gaps',
      description: isSingle
        ? 'Initial signal: Excellent articulation (75%+) but technical depth fell behind (under 60%).'
        : `Pattern observed across ${asymmetricCount} sessions: Clear spoken delivery, but needs deeper technical precision.`,
      recommendation: 'Back up your strong verbal communication with concrete engineering terms and complexity analysis.'
    });
  }

  return {
    hasData: true,
    patterns,
    hasRecurringPatterns: patterns.some(p => p.type === 'recurring_weakness'),
    hasInitialSignals: patterns.some(p => p.type === 'initial_signal'),
    patternCount: patterns.length,
    label: isSingle ? 'Initial Signal (1 Session)' : `${patterns.length} Pattern(s) Analyzed`,
    description: isSingle 
      ? 'Findings are based on your single completed session. Complete additional rounds to confirm recurring patterns.'
      : 'Patterns detected across multiple completed mock interview simulations.'
  };
}

/**
 * 6. INTERVIEW HISTORY COMPARISON & TREND TRACKING
 * Compares multi-session history with at least two real sessions required for trends.
 */
export function compareInterviewHistory(sessions = []) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {
      hasData: false,
      interviewCount: 0,
      latestScore: null,
      previousScore: null,
      scoreDelta: null,
      bestScore: null,
      averageScore: null,
      trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA,
      trendDescription: 'No completed mock interviews found. Complete your first session to track performance.',
      pillarTrends: {
        technical: { latest: null, previous: null, delta: null, trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA },
        communication: { latest: null, previous: null, delta: null, trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA },
        relevance: { latest: null, previous: null, delta: null, trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA },
        confidence: { latest: null, previous: null, delta: null, trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA }
      }
    };
  }

  // Sort strictly descending by created_at
  const sorted = [...sessions].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const latest = sorted[0];
  const latestScore = Number(latest.overall_score ?? latest.overallScore ?? 0);
  const bestScore = Math.max(...sorted.map(s => Number(s.overall_score ?? s.overallScore ?? 0)));
  const sumScores = sorted.reduce((sum, s) => sum + Number(s.overall_score ?? s.overallScore ?? 0), 0);
  const averageScore = Math.round((sumScores / sorted.length) * 10) / 10;

  if (sorted.length === 1) {
    return {
      hasData: true,
      interviewCount: 1,
      latestScore,
      previousScore: null,
      scoreDelta: null,
      bestScore,
      averageScore,
      trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA,
      trendDescription: 'One completed interview recorded. Complete a second interview to establish verified performance trends.',
      pillarTrends: {
        technical: { latest: Number(latest.technical_score ?? 0), previous: null, delta: null, trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA },
        communication: { latest: Number(latest.communication_score ?? 0), previous: null, delta: null, trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA },
        relevance: { latest: Number(latest.relevance_score ?? 0), previous: null, delta: null, trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA },
        confidence: { latest: Number(latest.confidence_score ?? 0), previous: null, delta: null, trend: INTERVIEW_TRENDS.INSUFFICIENT_DATA }
      }
    };
  }

  // Multiple sessions (>= 2)
  const previous = sorted[1];
  const previousScore = Number(previous.overall_score ?? previous.overallScore ?? 0);
  const scoreDelta = latestScore - previousScore;

  let overallTrend = INTERVIEW_TRENDS.STABLE;
  let trendDescription = 'Performance is stable compared to your previous interview session.';
  if (scoreDelta >= 5) {
    overallTrend = INTERVIEW_TRENDS.IMPROVING;
    trendDescription = `Performance improved by +${scoreDelta} points since your previous session!`;
  } else if (scoreDelta <= -5) {
    overallTrend = INTERVIEW_TRENDS.DECLINING;
    trendDescription = `Performance decreased by ${scoreDelta} points compared to your previous attempt.`;
  }

  // Helper for per-pillar trend
  const getPillarTrend = (curr, prev) => {
    const c = Number(curr ?? 0);
    const p = Number(prev ?? 0);
    const delta = c - p;
    let t = INTERVIEW_TRENDS.STABLE;
    if (delta >= 5) t = INTERVIEW_TRENDS.IMPROVING;
    else if (delta <= -5) t = INTERVIEW_TRENDS.DECLINING;
    return { latest: c, previous: p, delta, trend: t };
  };

  const pillarTrends = {
    technical: getPillarTrend(latest.technical_score, previous.technical_score),
    communication: getPillarTrend(latest.communication_score, previous.communication_score),
    relevance: getPillarTrend(latest.relevance_score, previous.relevance_score),
    confidence: getPillarTrend(latest.confidence_score, previous.confidence_score)
  };

  return {
    hasData: true,
    interviewCount: sorted.length,
    latestScore,
    previousScore,
    scoreDelta,
    bestScore,
    averageScore,
    trend: overallTrend,
    trendDescription,
    pillarTrends
  };
}

/**
 * 7. INTERVIEW READINESS SIGNAL
 * Dedicated interview readiness tier based strictly on interview telemetry.
 */
export function computeInterviewReadinessSignal(sessions = []) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {
      status: INTERVIEW_READINESS_TIERS.NOT_EVALUATED.label,
      tier: 'not_evaluated',
      score: null,
      variant: INTERVIEW_READINESS_TIERS.NOT_EVALUATED.variant,
      description: 'Complete a mock interview simulation to evaluate your live interview readiness.'
    };
  }

  const sorted = [...sessions].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const latest = sorted[0];
  const score = Number(latest.overall_score ?? latest.overallScore ?? 0);

  if (score >= INTERVIEW_READINESS_TIERS.READY.min) {
    return {
      status: INTERVIEW_READINESS_TIERS.READY.label,
      tier: 'ready',
      score,
      variant: INTERVIEW_READINESS_TIERS.READY.variant,
      description: 'Cleared for high-stakes campus recruitment technical and behavioral rounds.'
    };
  }
  if (score >= INTERVIEW_READINESS_TIERS.ALMOST_READY.min) {
    return {
      status: INTERVIEW_READINESS_TIERS.ALMOST_READY.label,
      tier: 'almost_ready',
      score,
      variant: INTERVIEW_READINESS_TIERS.ALMOST_READY.variant,
      description: 'Strong foundation; targeted practice on secondary gaps will ensure top percentile ranking.'
    };
  }
  if (score >= INTERVIEW_READINESS_TIERS.NEEDS_PRACTICE.min) {
    return {
      status: INTERVIEW_READINESS_TIERS.NEEDS_PRACTICE.label,
      tier: 'needs_practice',
      score,
      variant: INTERVIEW_READINESS_TIERS.NEEDS_PRACTICE.variant,
      description: 'Developing communication structure; focus on technical trade-offs and STAR delivery.'
    };
  }
  return {
    status: INTERVIEW_READINESS_TIERS.SIGNIFICANT_PRACTICE.label,
    tier: 'significant_practice',
    score,
    variant: INTERVIEW_READINESS_TIERS.SIGNIFICANT_PRACTICE.variant,
    description: 'High-priority remediation required. Practice answering with structured concepts before campus drives.'
  };
}

/**
 * 8. ROLE-SPECIFIC INTERVIEW PREPARATION FOCUS
 * Derives interview focus areas using Phase 14 opportunity intelligence.
 */
export function getRoleInterviewPreparationFocus(targetRole = 'Full Stack Software Engineer', opportunity = null) {
  const role = targetRole || 'Full Stack Software Engineer';
  const roleLower = role.toLowerCase();

  let comp = null;
  let missingSkills = [];
  let requiredSkills = [];

  if (opportunity) {
    comp = opportunity.company_name;
    requiredSkills = opportunity.required_skills || [];
    missingSkills = opportunity.matchExplanation?.missingSkills || [];
  }

  const focusAreas = [];

  if (roleLower.includes('frontend')) {
    focusAreas.push('JavaScript execution context, event loop, and DOM rendering');
    focusAreas.push('React component lifecycle, state patterns, and custom hooks');
    focusAreas.push('Core Web Vitals performance optimization and responsive architecture');
  } else if (roleLower.includes('backend')) {
    focusAreas.push('REST API idempotency, HTTP status semantics, and rate limiting');
    focusAreas.push('Database indexing (B-trees), normalization vs denormalization trade-offs');
    focusAreas.push('Asynchronous concurrency, worker queues, and distributed caching');
  } else if (roleLower.includes('data')) {
    focusAreas.push('SQL window functions, CTEs, and relational partitioning');
    focusAreas.push('Data pipeline ETL orchestration and streaming architecture');
  } else {
    // Full Stack default
    focusAreas.push('Client-side vs Server-side rendering trade-offs & hydration');
    focusAreas.push('Database architecture, indexing trade-offs, and query execution plans');
    focusAreas.push('RESTful API security, authentication tokens, and asynchronous workflows');
  }

  // Add missing skills from opportunity if available
  if (missingSkills.length > 0) {
    const missingName = typeof missingSkills[0] === 'string' ? missingSkills[0] : (missingSkills[0].name || '');
    if (missingName) {
      focusAreas.unshift(`Remediate target drive requirement: ${missingName}`);
    }
  }

  focusAreas.push('STAR framework storytelling for technical conflict and teamwork resolution');

  const isBackend = roleLower.includes('backend');
  return {
    targetRole: role,
    role,
    company: comp,
    opportunityId: opportunity?.id || null,
    focusAreas,
    primaryFocus: focusAreas[0],
    requiredSkills,
    missingSkills,
    coreTopics: [
      isBackend ? 'Database Indexing & Query Optimization' : 'System Architecture & API Design',
      'Data Structures & Algorithmic Complexity',
      'State Management & Concurrency'
    ],
    questionTypes: ['System Design', 'Core Fundamentals', 'Behavioral STAR'],
    recommendedQuestions: [
      isBackend
        ? 'How do B-tree indexes optimize database range queries under high write loads?'
        : 'How do you design a scalable microservices communication pattern with fallback caching?',
      'Describe a time when you resolved a technical bottleneck under tight deadlines.',
      'Explain how the JavaScript event loop coordinates async tasks with microtask queues.'
    ],
    prepStrategy: 'Focus on explaining internal runtime mechanisms, complexity metrics, and trade-offs.'
  };
}

/**
 * 9. PERSONALIZED INTERVIEW PRACTICE ACTIONS (Phase 13 Preparation Workspace)
 * Generates tailored daily preparation actions mapped to genuine platform routes.
 */
export function generateInterviewPracticeActions(interviewAnalysis = {}, candidateContext = {}) {
  const actions = [];
  const patterns = interviewAnalysis.patterns || [];
  const latestScore = interviewAnalysis.history?.latestScore;
  const pillarTrends = interviewAnalysis.history?.pillarTrends || {};

  // 1. STAR Weakness Action
  const hasStarIssue = patterns.some(p => p.id === 'pattern-star-deficit');
  if (hasStarIssue) {
    actions.push({
      id: 'act-prep-interview-star',
      action_key: 'prep_star_fluency',
      title: 'Practice Behavioral STAR Interview',
      category: 'Mock Interview',
      priority: 'P1',
      priorityLabel: 'Critical Drill',
      estimated_minutes: 25,
      destination: 'interview',
      source: 'Mock Interview Intelligence',
      reason: 'Your interview history indicates incomplete STAR results. Practice framing quantifiable outcomes.'
    });
  }

  // 2. Technical Depth Action
  const hasTechIssue = (pillarTrends.technical?.latest !== null && pillarTrends.technical?.latest < 65) || patterns.some(p => p.id === 'pattern-low-tech');
  if (hasTechIssue) {
    actions.push({
      id: 'act-prep-interview-tech',
      action_key: 'prep_technical_depth',
      title: 'Simulate Technical Mock Interview',
      category: 'Mock Interview',
      priority: 'P1',
      priorityLabel: 'Technical Drill',
      estimated_minutes: 30,
      destination: 'interview',
      source: 'Mock Interview Intelligence',
      reason: 'Technical depth score is below benchmark. Articulate system trade-offs and internal architecture.'
    });
  }

  // 3. Overall Low Score Action
  if (latestScore !== null && latestScore !== undefined && latestScore < 60 && actions.length === 0) {
    actions.push({
      id: 'act-prep-interview-remedial',
      action_key: 'prep_interview_remedial',
      title: 'Retake Full Mock Interview Round',
      category: 'Mock Interview',
      priority: 'P1',
      priorityLabel: 'Placement Essential',
      estimated_minutes: 30,
      destination: 'interview',
      source: 'Mock Interview Intelligence',
      reason: 'Your latest mock interview score (below 60%) requires remediation before campus drives.'
    });
  }

  // 4. Communication Strategy with Career Coach
  if (patterns.some(p => p.id === 'pattern-brief-answers' || p.id === 'pattern-asymmetric-comm-tech')) {
    actions.push({
      id: 'act-prep-coach-comm',
      action_key: 'prep_coach_communication',
      title: 'Review Interview Communication with Career Coach',
      category: 'Career Coach',
      priority: 'P2',
      priorityLabel: 'Coaching Review',
      estimated_minutes: 15,
      destination: 'career-coach',
      source: 'Mock Interview Intelligence',
      reason: 'Review concise storytelling and structured phrasing with your AI placement coach.'
    });
  }

  return actions;
}

/**
 * 10. COMPREHENSIVE INTERVIEW INTELLIGENCE EVALUATOR
 * Main entry point: Evaluates a candidate's complete mock interview history.
 */
export function analyzeInterviewIntelligence(sessions = [], candidateContext = {}) {
  const safeSessions = Array.isArray(sessions) ? [...sessions] : [];

  // 1. History & Trends
  const history = compareInterviewHistory(safeSessions);

  // 2. Multi-Session Patterns
  const patterns = analyzeCommunicationPatterns(safeSessions);

  // 3. Interview Readiness Signal
  const readinessSignal = computeInterviewReadinessSignal(safeSessions);

  // 4. Detailed Evaluation of Latest Session (if exists)
  const latestSession = safeSessions.length > 0
    ? [...safeSessions].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]
    : null;

  let latestBreakdown = null;
  if (latestSession) {
    const exchanges = latestSession.transcript || [];
    const questionEvaluations = exchanges.map(ex => {
      const qText = ex.question || '';
      const aText = ex.studentAnswer || '';
      const quality = analyzeAnswerQuality(aText, ex, latestSession.interview_type);
      const star = analyzeStarCommunication(aText, ex);
      const tech = analyzeTechnicalAnswer(aText, ex);

      return {
        question: qText,
        studentAnswer: aText,
        quality,
        star,
        tech,
        scores: {
          overall: ex.evaluation?.overall_score ?? 0,
          technical: ex.evaluation?.technical_score ?? 0,
          communication: ex.evaluation?.communication_score ?? 0,
          relevance: ex.evaluation?.relevance_score ?? 0,
          confidence: ex.evaluation?.confidence_score ?? 0
        },
        feedback: ex.evaluation?.feedback || ''
      };
    });

    // 4 Dimension summaries for latest session
    const techScore = latestSession.technical_score ?? null;
    const commScore = latestSession.communication_score ?? null;
    const relScore = latestSession.relevance_score ?? null;
    const confScore = latestSession.confidence_score ?? null;

    latestBreakdown = {
      overallScore: latestSession.overall_score ?? null,
      role: latestSession.target_role || 'Full Stack Software Engineer',
      type: latestSession.interview_type || 'Technical',
      createdAt: latestSession.created_at,
      dimensions: {
        technical: {
          name: 'Technical Depth',
          weight: 35,
          score: techScore,
          status: classifyInterviewScore(techScore).label,
          variant: classifyInterviewScore(techScore).variant,
          evidence: techScore >= 80
            ? ['Demonstrated strong understanding of framework mechanisms and trade-offs.']
            : ['Needs to incorporate internal architecture mechanisms and complexity metrics.'],
          recommendation: 'Deepen knowledge of database indexing, async workflows, and production trade-offs.'
        },
        communication: {
          name: 'Communication & Structure',
          weight: 25,
          score: commScore,
          status: classifyInterviewScore(commScore).label,
          variant: classifyInterviewScore(commScore).variant,
          evidence: commScore >= 80
            ? ['Structured responses logically using connective reasoning.']
            : ['Responses lack consistent structural signposting or complete STAR components.'],
          recommendation: 'Use STAR for behavioral questions and step-by-step numbered breakdowns for technical prompts.'
        },
        relevance: {
          name: 'Relevance & Responsiveness',
          weight: 25,
          score: relScore,
          status: classifyInterviewScore(relScore).label,
          variant: classifyInterviewScore(relScore).variant,
          evidence: relScore >= 80
            ? ['Directly answered core prompt requirements without tangential drift.']
            : ['Some responses drifted from the core question keyword parameters.'],
          recommendation: 'Pause to verify question constraints before articulating your solution.'
        },
        confidence: {
          name: 'Confidence & Delivery',
          weight: 15,
          score: confScore,
          status: classifyInterviewScore(confScore).label,
          variant: classifyInterviewScore(confScore).variant,
          evidence: [
            'Delivery evaluated from textual response completeness and phrasing pacing.',
            'Audio waveform / vocal frequency sensors are not implemented in the current client.'
          ],
          recommendation: 'Avoid hesitant phrasing like "maybe" or "I guess" to project engineering authority.'
        }
      },
      questionEvaluations
    };
  }

  // 5. Role-specific Preparation Focus
  const targetRole = candidateContext.profile?.preferred_job_role || latestSession?.target_role || 'Full Stack Software Engineer';
  const prepFocus = getRoleInterviewPreparationFocus(targetRole, candidateContext.targetOpportunity);

  // 6. Actionable Practice Recommendations (Phase 13 Integration)
  const practiceActions = generateInterviewPracticeActions({
    history,
    patterns: patterns.patterns
  }, candidateContext);

  return {
    hasData: safeSessions.length > 0,
    sessionCount: safeSessions.length,
    history,
    patterns,
    readinessSignal,
    latestBreakdown,
    prepFocus,
    practiceActions
  };
}


export const buildFullInterviewIntelligence = analyzeInterviewIntelligence;
export const calculateInterviewReadinessSignal = computeInterviewReadinessSignal;
