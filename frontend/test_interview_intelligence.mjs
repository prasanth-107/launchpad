/**
 * test_interview_intelligence.mjs
 * Phase 15 Unit & Integration Test Suite
 * Modern Placement Launchpad - Advanced Interview Intelligence & Communication Coaching
 *
 * Tests A-Z:
 * A. Zero mock interviews scenario (hasData = false, null metrics, graceful handling)
 * B. Single interview scenario (latest score present, previous/delta null, trend = Insufficient Data)
 * C. Multi-session comparison with >= 2 interviews (latest, previous, delta computed correctly)
 * D. Chronological sorting verification (orders by created_at desc regardless of input order)
 * E. Latest, previous, delta, best, average score calculations
 * F. Best score tracking across multiple sessions with fluctuating scores
 * G. Average score precision and calculation across all completed sessions
 * H. Trend: Improving (delta >= +5)
 * I. Trend: Declining (delta <= -5)
 * J. Trend: Stable (-5 < delta < +5) & Insufficient Data (< 2 sessions)
 * K. Pillar scoring tier classification: Strong (80-100)
 * L. Pillar scoring tier classification: Needs Improvement (60-79)
 * M. Pillar scoring tier classification: Critical Gap (0-59)
 * N. Behavioral prompt detection and STAR Complete evaluation (Situation, Task, Action, Result present)
 * O. STAR Partial evaluation and missing component detection (e.g., Result missing)
 * P. STAR Missing evaluation when candidate gives unstructured/brief answer to behavioral prompt
 * Q. Technical answer depth: Deep/Exceptional (Mechanism, Architecture/Code, Complexity, Trade-offs)
 * R. Technical answer depth: Moderate (Definition & Mechanism without trade-offs/complexity)
 * S. Technical answer depth: Superficial/Deficient (Definition only, no mechanisms)
 * T. Short/evasive answer penalty and minimal explanation detection
 * U. Relevance and direct responsiveness scoring (prompt alignment & drift penalty)
 * V. Communication pattern detection: Initial Signal for single session with weakness
 * W. Communication pattern detection: Recurring Weakness for >= 2 sessions with same weakness
 * X. Role-specific interview preparation focus for target role (e.g. Full Stack, Backend, Data Engineer)
 * Y. Phase 13 Preparation Workspace action integration (P1 STAR drill or Technical depth drill injected)
 * Z. Missing data safe handling: Unassessed dimensions remain null/Not Evaluated, NEVER converted to 0
 */

import {
  INTERVIEW_SCORE_TIERS,
  STAR_COMPONENTS,
  STAR_STATUS,
  TECHNICAL_DEPTH_TIERS,
  COMMUNICATION_PATTERN_TYPES,
  INTERVIEW_TRENDS,
  INTERVIEW_READINESS_TIERS,
  classifyInterviewScore,
  analyzeStarCommunication,
  analyzeStarStructure,
  analyzeTechnicalAnswer,
  analyzeTechnicalAnswerDepth,
  analyzeAnswerQuality,
  compareInterviewHistory,
  computeInterviewReadinessSignal,
  analyzeCommunicationPatterns,
  getRoleInterviewPreparationFocus,
  generateInterviewPracticeActions,
  buildFullInterviewIntelligence
} from './src/lib/interviewIntelligenceEngine.js';

import {
  evaluateCandidateAnswer,
  computeSessionSummary
} from './src/lib/mockInterviewEngine.js';

import {
  generateDailyPreparationPlan
} from './src/lib/dailyPreparationEngine.js';

import {
  computeProgressOverview,
  analyzeInterviewProgress
} from './src/lib/progressAnalyticsEngine.js';

import {
  buildCareerCoachContext,
  detectUserIntent,
  generateDeterministicCoachResponse
} from './src/lib/careerCoachEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('================================================================');
console.log('PHASE 15 TEST SUITE: ADVANCED INTERVIEW INTELLIGENCE & COACHING');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test A: Zero Mock Interviews Scenario
// -----------------------------------------------------------------------------
console.log('--- Test A: Zero Mock Interviews Scenario ---');
const zeroHistory = compareInterviewHistory([]);
assert(zeroHistory.hasData === false, 'Zero interviews reports hasData: false');
assert(zeroHistory.interviewCount === 0, 'Zero interviews count is 0');
assert(zeroHistory.latestScore === null, 'Latest score is null when 0 interviews');
assert(zeroHistory.previousScore === null, 'Previous score is null when 0 interviews');
assert(zeroHistory.scoreDelta === null, 'Score delta is null when 0 interviews');
assert(zeroHistory.trend === INTERVIEW_TRENDS.INSUFFICIENT_DATA, 'Zero interviews reports Insufficient Data');

const zeroReadiness = computeInterviewReadinessSignal([]);
assert(zeroReadiness.status === INTERVIEW_READINESS_TIERS.NOT_EVALUATED.label, 'Zero interviews readiness is Not Evaluated');
assert(zeroReadiness.score === null, 'Zero interviews readiness score is null');

const zeroPatterns = analyzeCommunicationPatterns([]);
assert(zeroPatterns.hasData === false, 'Zero interviews patterns reports hasData: false');
assert(zeroPatterns.patterns.length === 0, 'Zero interviews patterns array is empty');

// -----------------------------------------------------------------------------
// Test B: Single Interview Scenario
// -----------------------------------------------------------------------------
console.log('\n--- Test B: Single Interview Scenario ---');
const singleSession = [{
  id: 'sess-1',
  target_role: 'Full Stack Developer',
  overall_score: 72,
  technical_score: 75,
  communication_score: 68,
  relevance_score: 70,
  confidence_score: 75,
  transcript: [
    { question: 'Tell me about a time you resolved a conflict in a team.', studentAnswer: 'In my final year project we disagreed on database choice so I evaluated PostgreSQL and presented data and we agreed.', evaluation: { overall_score: 70 } }
  ],
  created_at: '2026-09-01T10:00:00Z'
}];

const singleHistory = compareInterviewHistory(singleSession);
assert(singleHistory.hasData === true, 'Single interview reports hasData: true');
assert(singleHistory.interviewCount === 1, 'Single interview count is 1');
assert(singleHistory.latestScore === 72, 'Single interview latest score is 72');
assert(singleHistory.previousScore === null, 'Single interview previous score is null');
assert(singleHistory.scoreDelta === null, 'Single interview delta is null (cannot compute delta with 1 session)');
assert(singleHistory.trend === INTERVIEW_TRENDS.INSUFFICIENT_DATA, 'Single interview trend is strictly Insufficient Data');
assert(singleHistory.bestScore === 72, 'Single interview best score is 72');
assert(singleHistory.averageScore === 72, 'Single interview average score is 72');

// -----------------------------------------------------------------------------
// Test C: Multi-Session Comparison (>= 2 interviews)
// -----------------------------------------------------------------------------
console.log('\n--- Test C: Multi-Session Comparison (>= 2 sessions) ---');
const twoSessions = [
  {
    id: 'sess-1',
    overall_score: 65,
    technical_score: 60,
    communication_score: 65,
    relevance_score: 70,
    confidence_score: 65,
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: 'sess-2',
    overall_score: 78,
    technical_score: 76,
    communication_score: 80,
    relevance_score: 80,
    confidence_score: 76,
    created_at: '2026-09-05T10:00:00Z'
  }
];

const twoHistory = compareInterviewHistory(twoSessions);
assert(twoHistory.hasData === true, 'Two sessions hasData is true');
assert(twoHistory.interviewCount === 2, 'Two sessions count is 2');
assert(twoHistory.latestScore === 78, 'Two sessions latest score is 78 (most recent)');
assert(twoHistory.previousScore === 65, 'Two sessions previous score is 65');
assert(twoHistory.scoreDelta === 13, 'Two sessions scoreDelta is +13 (78 - 65)');
assert(twoHistory.trend === INTERVIEW_TRENDS.IMPROVING, 'Trend is Improving with +13 delta');

// -----------------------------------------------------------------------------
// Test D: Chronological Sorting Verification
// -----------------------------------------------------------------------------
console.log('\n--- Test D: Chronological Sorting Verification ---');
// Input array in reverse chronological order
const unorderedSessions = [
  { id: 'oldest', overall_score: 55, created_at: '2026-08-10T10:00:00Z' },
  { id: 'newest', overall_score: 88, created_at: '2026-09-10T10:00:00Z' },
  { id: 'middle', overall_score: 70, created_at: '2026-08-25T10:00:00Z' }
];

const sortedHistory = compareInterviewHistory(unorderedSessions);
assert(sortedHistory.latestScore === 88, 'Latest correctly picked newest session (88)');
assert(sortedHistory.previousScore === 70, 'Previous correctly picked middle session (70)');
assert(sortedHistory.scoreDelta === 18, 'Delta is calculated as newest (88) - middle (70) = +18');

// -----------------------------------------------------------------------------
// Test E: Calculations: Latest, Previous, Delta, Best, Average
// -----------------------------------------------------------------------------
console.log('\n--- Test E: Calculations of Scores ---');
const multipleSessions = [
  { id: 's1', overall_score: 60, created_at: '2026-09-01T10:00:00Z' },
  { id: 's2', overall_score: 85, created_at: '2026-09-03T10:00:00Z' },
  { id: 's3', overall_score: 75, created_at: '2026-09-05T10:00:00Z' },
  { id: 's4', overall_score: 80, created_at: '2026-09-07T10:00:00Z' }
];

const multiHistory = compareInterviewHistory(multipleSessions);
assert(multiHistory.latestScore === 80, 'Latest score is 80');
assert(multiHistory.previousScore === 75, 'Previous score is 75');
assert(multiHistory.scoreDelta === 5, 'Score delta is +5 (80 - 75)');
assert(multiHistory.bestScore === 85, 'Best score across all sessions is 85');
// Average: (60 + 85 + 75 + 80) / 4 = 300 / 4 = 75
assert(multiHistory.averageScore === 75, 'Average score is 75');

// -----------------------------------------------------------------------------
// Test F: Best Score Tracking
// -----------------------------------------------------------------------------
console.log('\n--- Test F: Best Score Tracking ---');
const bestTrackingSessions = [
  { id: 's1', overall_score: 92, created_at: '2026-08-01T10:00:00Z' },
  { id: 's2', overall_score: 70, created_at: '2026-08-15T10:00:00Z' },
  { id: 's3', overall_score: 74, created_at: '2026-09-01T10:00:00Z' }
];
const bestHistory = compareInterviewHistory(bestTrackingSessions);
assert(bestHistory.bestScore === 92, 'Best score remains 92 even when recent scores dipped');
assert(bestHistory.latestScore === 74, 'Latest score is accurately 74');

// -----------------------------------------------------------------------------
// Test G: Average Score Precision
// -----------------------------------------------------------------------------
console.log('\n--- Test G: Average Score Precision ---');
const precisionSessions = [
  { id: 's1', overall_score: 70, created_at: '2026-08-01T10:00:00Z' },
  { id: 's2', overall_score: 71, created_at: '2026-08-15T10:00:00Z' },
  { id: 's3', overall_score: 73, created_at: '2026-09-01T10:00:00Z' }
];
// (70 + 71 + 73) / 3 = 214 / 3 = 71.3333 -> 71.3
const precHistory = compareInterviewHistory(precisionSessions);
assert(precHistory.averageScore === 71.3, 'Average score is rounded to 1 decimal place (71.3)');

// -----------------------------------------------------------------------------
// Test H: Trend Improving (delta >= +5)
// -----------------------------------------------------------------------------
console.log('\n--- Test H: Trend Improving (delta >= +5) ---');
const improvingSessions = [
  { id: 's1', overall_score: 65, created_at: '2026-09-01T10:00:00Z' },
  { id: 's2', overall_score: 70, created_at: '2026-09-05T10:00:00Z' }
];
const impHistory = compareInterviewHistory(improvingSessions);
assert(impHistory.scoreDelta === 5, 'Delta is +5');
assert(impHistory.trend === INTERVIEW_TRENDS.IMPROVING, 'Trend is Improving when delta is >= +5');

// -----------------------------------------------------------------------------
// Test I: Trend Declining (delta <= -5)
// -----------------------------------------------------------------------------
console.log('\n--- Test I: Trend Declining (delta <= -5) ---');
const decliningSessions = [
  { id: 's1', overall_score: 80, created_at: '2026-09-01T10:00:00Z' },
  { id: 's2', overall_score: 73, created_at: '2026-09-05T10:00:00Z' }
];
const decHistory = compareInterviewHistory(decliningSessions);
assert(decHistory.scoreDelta === -7, 'Delta is -7');
assert(decHistory.trend === INTERVIEW_TRENDS.DECLINING, 'Trend is Declining when delta is <= -5');

// -----------------------------------------------------------------------------
// Test J: Trend Stable & Insufficient Data
// -----------------------------------------------------------------------------
console.log('\n--- Test J: Trend Stable & Insufficient Data ---');
const stableSessions = [
  { id: 's1', overall_score: 75, created_at: '2026-09-01T10:00:00Z' },
  { id: 's2', overall_score: 77, created_at: '2026-09-05T10:00:00Z' }
];
const stabHistory = compareInterviewHistory(stableSessions);
assert(stabHistory.scoreDelta === 2, 'Delta is +2');
assert(stabHistory.trend === INTERVIEW_TRENDS.STABLE, 'Trend is Stable when -5 < delta < +5');

// -----------------------------------------------------------------------------
// Test K: Scoring Tier Classification: Strong (80-100)
// -----------------------------------------------------------------------------
console.log('\n--- Test K: Scoring Tier: Strong (80-100) ---');
const strongTier = classifyInterviewScore(85);
assert(strongTier.tier === 'strong', '85 is classified as strong');
assert(strongTier.label === INTERVIEW_SCORE_TIERS.STRONG.label, 'Label is Strong (80-100%)');
assert(strongTier.variant === 'success', 'Variant is success');

const strongEdge = classifyInterviewScore(80);
assert(strongEdge.tier === 'strong', '80 boundary is classified as strong');

// -----------------------------------------------------------------------------
// Test L: Scoring Tier Classification: Needs Improvement (60-79)
// -----------------------------------------------------------------------------
console.log('\n--- Test L: Scoring Tier: Needs Improvement (60-79) ---');
const needsImpTier = classifyInterviewScore(68);
assert(needsImpTier.tier === 'needs_improvement', '68 is classified as needs_improvement');
assert(needsImpTier.label === INTERVIEW_SCORE_TIERS.NEEDS_IMPROVEMENT.label, 'Label is Needs Improvement (60-79%)');
assert(needsImpTier.variant === 'warning', 'Variant is warning');

const needsImpEdge = classifyInterviewScore(60);
assert(needsImpEdge.tier === 'needs_improvement', '60 boundary is classified as needs_improvement');

// -----------------------------------------------------------------------------
// Test M: Scoring Tier Classification: Critical Gap (0-59)
// -----------------------------------------------------------------------------
console.log('\n--- Test M: Scoring Tier: Critical Gap (0-59) ---');
const criticalTier = classifyInterviewScore(45);
assert(criticalTier.tier === 'critical_gap', '45 is classified as critical_gap');
assert(criticalTier.label === INTERVIEW_SCORE_TIERS.CRITICAL_GAP.label, 'Label is Critical Gap (0-59%)');
assert(criticalTier.variant === 'danger', 'Variant is danger');

const criticalEdge = classifyInterviewScore(59);
assert(criticalEdge.tier === 'critical_gap', '59 boundary is classified as critical_gap');

// -----------------------------------------------------------------------------
// Test N: Behavioral Prompt & STAR Complete Evaluation
// -----------------------------------------------------------------------------
console.log('\n--- Test N: Behavioral Prompt & STAR Complete Evaluation ---');
const behavioralQuestion = {
  question: 'Describe a situation where you had a disagreement with a team member and how you resolved it.',
  category: 'Behavioral'
};

const fullStarAnswer = `In our third-year capstone project, our frontend and backend teams faced a severe disagreement on whether to use REST or GraphQL for API communication. My task as backend lead was to establish an agreed-upon contract before the milestone deadline. I scheduled a technical review meeting, prepared benchmark data comparing response times and payload sizes, and implemented a small prototype showcasing both approaches. As a result, the team unanimously adopted GraphQL with cached queries, reducing API turnaround time by 35% and delivering our project one week ahead of schedule.`;

const starAnalysis = analyzeStarCommunication(fullStarAnswer, behavioralQuestion);
assert(starAnalysis.isBehavioral === true, 'Question correctly identified as behavioral');
assert(starAnalysis.status === STAR_STATUS.COMPLETE, 'STAR status is Complete');
assert(starAnalysis.components.situation.present === true, 'Situation is present');
assert(starAnalysis.components.task.present === true, 'Task is present');
assert(starAnalysis.components.action.present === true, 'Action is present');
assert(starAnalysis.components.result.present === true, 'Result is present');
assert(starAnalysis.score >= 80, 'Complete STAR answer scores >= 80%');
assert(starAnalysis.missingComponents.length === 0, 'No missing components in full STAR answer');

// Also test analyzeStarStructure alias
const aliasStar = analyzeStarStructure(fullStarAnswer, behavioralQuestion);
assert(aliasStar.status === STAR_STATUS.COMPLETE, 'analyzeStarStructure alias produces identical Complete status');

// -----------------------------------------------------------------------------
// Test O: STAR Partial Evaluation & Missing Result Detection
// -----------------------------------------------------------------------------
console.log('\n--- Test O: STAR Partial Evaluation (Missing Result) ---');
const partialStarAnswer = `When our team was working on a distributed chat application, the challenge was handling socket disconnects during network switches. My responsibility was making sure offline messages were queued properly. I researched Redis pub/sub and implemented persistent client-side message buffers with exponential backoff retries.`;

const partialStar = analyzeStarCommunication(partialStarAnswer, behavioralQuestion);
assert(partialStar.status === STAR_STATUS.PARTIAL, 'STAR status is Partial');
assert(partialStar.components.result.present === false, 'Result component is detected as missing');
assert(partialStar.missingComponents.includes('Result'), 'missingComponents array lists Result');
assert(partialStar.score >= 50 && partialStar.score < 80, 'Partial STAR score is in intermediate bracket');

// -----------------------------------------------------------------------------
// Test P: STAR Missing Evaluation for Unstructured/Short Answer
// -----------------------------------------------------------------------------
console.log('\n--- Test P: STAR Missing Evaluation for Unstructured Answer ---');
const missingStarAnswer = 'I usually just talk to my colleagues and we work things out peacefully.';
const missingStar = analyzeStarCommunication(missingStarAnswer, behavioralQuestion);
assert(missingStar.status === STAR_STATUS.MISSING, 'Unstructured answer status is Missing');
assert(missingStar.score <= 40, 'Missing STAR score is <= 40');
assert(missingStar.missingComponents.length >= 3, 'At least 3 components are missing');

// -----------------------------------------------------------------------------
// Test Q: Technical Answer Depth: Deep/Exceptional
// -----------------------------------------------------------------------------
console.log('\n--- Test Q: Technical Answer Depth: Deep/Exceptional ---');
const techQuestion = {
  question: 'Explain how Node.js handles asynchronous I/O and the role of the Event Loop.',
  category: 'Technical'
};

const deepTechAnswer = `Node.js achieves non-blocking asynchronous I/O using the V8 engine and libuv library. In the libuv architecture, an event loop orchestrates asynchronous tasks across distinct phases: timers, pending callbacks, idle/prepare, poll, check (setImmediate), and close callbacks. When an I/O operation like file reading or network socket request is invoked, libuv delegates it to the operating system kernel via epoll or kqueue, or to a worker thread pool. The time complexity for dispatching is O(1). However, the trade-off is that heavy CPU-bound computations block the single main thread, causing event loop lag. To mitigate this latency bottleneck, production systems offload intensive CPU processing to worker_threads or external microservices.`;

const techAnalysis = analyzeTechnicalAnswer(deepTechAnswer, techQuestion);
assert(techAnalysis.depthTier === TECHNICAL_DEPTH_TIERS.DEEP.tier, 'Depth tier is classified as Deep');
assert(techAnalysis.score >= 80, 'Deep technical answer scores >= 80%');
assert(techAnalysis.dimensions.definition === true, 'Definition dimension is present');
assert(techAnalysis.dimensions.mechanism === true, 'Mechanism dimension is present');
assert(techAnalysis.dimensions.tradeoffs === true, 'Trade-offs dimension is present');
assert(techAnalysis.missingElements.length === 0, 'Zero missing elements in comprehensive technical answer');

// Also test analyzeTechnicalAnswerDepth alias
const aliasTech = analyzeTechnicalAnswerDepth(deepTechAnswer, techQuestion);
assert(aliasTech.depthTier === TECHNICAL_DEPTH_TIERS.DEEP.tier, 'analyzeTechnicalAnswerDepth alias works');

// -----------------------------------------------------------------------------
// Test R: Technical Answer Depth: Moderate (Definition & Mechanism only)
// -----------------------------------------------------------------------------
console.log('\n--- Test R: Technical Answer Depth: Moderate ---');
const moderateTechAnswer = `Node.js uses the event loop in libuv to handle async I/O. The event loop loops through timers, poll phase, and check phase, and executes callbacks when I/O operations complete without blocking.`;
const modAnalysis = analyzeTechnicalAnswer(moderateTechAnswer, techQuestion);
assert(modAnalysis.depthTier === TECHNICAL_DEPTH_TIERS.MODERATE.tier, 'Depth tier is classified as Moderate');
assert(modAnalysis.score >= 60 && modAnalysis.score < 80, 'Moderate technical score is in 60-79 bracket');
assert(modAnalysis.missingElements.includes('Trade-offs & Constraints') || modAnalysis.missingElements.includes('Complexity & Scale Metrics'), 'Missing elements notes trade-offs or complexity');

// -----------------------------------------------------------------------------
// Test S: Technical Answer Depth: Superficial/Deficient
// -----------------------------------------------------------------------------
console.log('\n--- Test S: Technical Answer Depth: Superficial/Deficient ---');
const superficialTechAnswer = `Node.js is an asynchronous runtime that is single-threaded and fast for building web APIs.`;
const supAnalysis = analyzeTechnicalAnswer(superficialTechAnswer, techQuestion);
assert(supAnalysis.depthTier === TECHNICAL_DEPTH_TIERS.SUPERFICIAL.tier || supAnalysis.depthTier === TECHNICAL_DEPTH_TIERS.DEFICIENT.tier, 'Superficial answer classified as superficial or deficient');
assert(supAnalysis.score < 60, 'Superficial score is < 60');
assert(supAnalysis.missingElements.includes('Underlying Mechanisms'), 'Identifies missing underlying mechanisms');

// -----------------------------------------------------------------------------
// Test T: Short/Evasive Answer Penalty
// -----------------------------------------------------------------------------
console.log('\n--- Test T: Short/Evasive Answer Penalty ---');
const shortAnswer = 'I know this. Node is async.';
const shortQuality = analyzeAnswerQuality(shortAnswer, techQuestion, 'Technical');
assert(shortQuality.isEvasiveOrTooShort === true, 'Identified as evasive or too short');
assert(shortQuality.wordCount <= 6, 'Word count accurately counted');
assert(shortQuality.qualityScore <= 35, 'Quality score penalized to <= 35');
assert(shortQuality.feedback.includes('Response is too brief'), 'Includes actionable brevity feedback');

// -----------------------------------------------------------------------------
// Test U: Relevance & Direct Responsiveness Scoring
// -----------------------------------------------------------------------------
console.log('\n--- Test U: Relevance & Direct Responsiveness Scoring ---');
// An answer talking about CSS when asked about Node.js event loop
const offTopicAnswer = `Cascading Style Sheets (CSS) flexbox and grid allow developers to build responsive UI layouts with flexible box models and media queries.`;
const offTopicQuality = analyzeAnswerQuality(offTopicAnswer, techQuestion, 'Technical');
assert(offTopicQuality.relevanceScore <= 40, 'Off-topic answer receives low relevance score (<= 40)');
assert(offTopicQuality.feedback.includes('did not address the core question keywords'), 'Feedback identifies keyword drift');

// -----------------------------------------------------------------------------
// Test V: Communication Patterns: Initial Signal for Single Session
// -----------------------------------------------------------------------------
console.log('\n--- Test V: Communication Patterns: Initial Signal for Single Session ---');
const singleWeakSession = [{
  id: 'sess-weak-1',
  overall_score: 55,
  technical_score: 50,
  communication_score: 52,
  relevance_score: 55,
  confidence_score: 50,
  transcript: [
    { question: 'Tell me about a project challenge.', studentAnswer: 'It was hard but I did it.', evaluation: { overall_score: 50, communication_score: 45 } }
  ],
  created_at: '2026-09-01T10:00:00Z'
}];

const singleWeakPatterns = analyzeCommunicationPatterns(singleWeakSession);
assert(singleWeakPatterns.hasData === true, 'Single weak session hasData: true');
assert(singleWeakPatterns.patterns.length > 0, 'Patterns detected for weak answer');
// All patterns in single session MUST be labeled 'initial_signal', NOT 'recurring_weakness'
const nonInitial = singleWeakPatterns.patterns.filter(p => p.type === 'recurring_weakness');
assert(nonInitial.length === 0, 'Single session NEVER labels weaknesses as recurring_weakness');
const initialSignals = singleWeakPatterns.patterns.filter(p => p.type === 'initial_signal');
assert(initialSignals.length > 0, 'Single session weakness is properly labeled as initial_signal');

// -----------------------------------------------------------------------------
// Test W: Communication Patterns: Recurring Weakness for >= 2 Sessions
// -----------------------------------------------------------------------------
console.log('\n--- Test W: Communication Patterns: Recurring Weakness for >= 2 Sessions ---');
const recurringWeakSessions = [
  {
    id: 'sess-rec-1',
    overall_score: 55,
    communication_score: 50,
    transcript: [{ question: 'Tell me about a conflict.', studentAnswer: 'I spoke to my manager.', evaluation: {} }],
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: 'sess-rec-2',
    overall_score: 58,
    communication_score: 52,
    transcript: [{ question: 'Describe a leadership situation.', studentAnswer: 'I led the meeting.', evaluation: {} }],
    created_at: '2026-09-05T10:00:00Z'
  }
];

const recurringPatterns = analyzeCommunicationPatterns(recurringWeakSessions);
assert(recurringPatterns.hasData === true, 'Recurring sessions hasData: true');
const recurringWeaknesses = recurringPatterns.patterns.filter(p => p.type === 'recurring_weakness');
assert(recurringWeaknesses.length > 0, '>= 2 sessions with persistent gap produces recurring_weakness');
assert(recurringWeaknesses[0].badge === 'Recurring Pattern', 'Recurring weakness has badge "Recurring Pattern"');

// -----------------------------------------------------------------------------
// Test X: Role-Specific Interview Preparation Focus
// -----------------------------------------------------------------------------
console.log('\n--- Test X: Role-Specific Interview Preparation Focus ---');
const fullStackFocus = getRoleInterviewPreparationFocus('Full Stack Software Engineer');
assert(fullStackFocus.role === 'Full Stack Software Engineer', 'Focus specifies target role');
assert(fullStackFocus.coreTopics.includes('System Architecture & API Design'), 'Includes system architecture');
assert(fullStackFocus.recommendedQuestions.length > 0, 'Provides recommended questions');

const backendFocus = getRoleInterviewPreparationFocus('Backend Developer');
assert(backendFocus.coreTopics.includes('Database Indexing & Query Optimization'), 'Backend focus includes database indexing');

// -----------------------------------------------------------------------------
// Test Y: Phase 13 Preparation Workspace Action Integration
// -----------------------------------------------------------------------------
console.log('\n--- Test Y: Phase 13 Preparation Workspace Action Integration ---');
const mockIntelligence = buildFullInterviewIntelligence([
  {
    id: 's1',
    overall_score: 58,
    technical_score: 55,
    communication_score: 50,
    relevance_score: 60,
    confidence_score: 60,
    transcript: [
      { question: 'Tell me about a team conflict.', studentAnswer: 'I just spoke to them.', evaluation: {} }
    ],
    created_at: '2026-09-01T10:00:00Z'
  }
]);

const prepPlan = generateDailyPreparationPlan({
  interviewIntelligence: mockIntelligence,
  interviewHistory: mockIntelligence.history
});

assert(prepPlan.actions.length > 0, 'Daily preparation plan generates actions');
const interviewAction = prepPlan.actions.find(a => a.category === 'Mock Interview' || a.action_key.startsWith('prep_interview') || a.action_key.startsWith('prep_star') || a.action_key.startsWith('prep_technical'));
assert(Boolean(interviewAction), 'Phase 13 preparation workspace received targeted interview drill action');
assert(interviewAction.priority === 'P1', 'Targeted interview drill action has P1 priority');

// -----------------------------------------------------------------------------
// Test Z: Missing Data Safe Handling (Null / Not Evaluated, Zero Fabrication)
// -----------------------------------------------------------------------------
console.log('\n--- Test Z: Missing Data Safe Handling ---');
// Unassessed score should be null, NOT 0
const nullClassification = classifyInterviewScore(null);
assert(nullClassification.tier === 'not_evaluated', 'null score classifies as not_evaluated');
assert(nullClassification.label === 'Not Evaluated', 'null score label is "Not Evaluated"');

const undefinedClassification = classifyInterviewScore(undefined);
assert(undefinedClassification.tier === 'not_evaluated', 'undefined score classifies as not_evaluated');

// Also test mockInterviewEngine evaluateCandidateAnswer integration
const liveEval = evaluateCandidateAnswer(
  'Explain database transactions and ACID properties.',
  'ACID stands for Atomicity, Consistency, Isolation, and Durability. In PostgreSQL, transactions use WAL and MVCC mechanisms so concurrent queries do not block reads.',
  [],
  'Technical'
);

assert(liveEval.star_analysis !== undefined, 'evaluateCandidateAnswer produces star_analysis');
assert(liveEval.technical_analysis !== undefined, 'evaluateCandidateAnswer produces technical_analysis');
assert(liveEval.answer_quality !== undefined, 'evaluateCandidateAnswer produces answer_quality');
assert(liveEval.technical_analysis.dimensions.mechanism === true, 'Live eval recognized MVCC and WAL mechanisms');

// Test Career Coach Integration
const coachContext = buildCareerCoachContext({
  interviews: [
    { id: 'i1', overall_score: 65, created_at: '2026-09-01T10:00:00Z' },
    { id: 'i2', overall_score: 75, created_at: '2026-09-05T10:00:00Z' }
  ]
});

assert(coachContext.interviews.history.latestScore === 75, 'Career coach context includes latest interview score 75');
assert(coachContext.interviews.history.trend === 'Improving', 'Career coach context includes Improving trend');

const interviewIntent = detectUserIntent('How can I improve my behavioral STAR answers for technical interviews?');
assert(interviewIntent === 'interview_preparation', 'detectUserIntent routes STAR behavioral queries to interview_preparation');

const coachResponse = generateDeterministicCoachResponse(interviewIntent, coachContext, 'How is my interview performance?');
assert(coachResponse.groundedFacts.some(f => f.includes('Latest Mock Interview Score: 75%')), 'Coach response contains grounded fact for 75% score');
assert(coachResponse.groundedFacts.some(f => f.includes('Score Trajectory: Improving')), 'Coach response contains grounded fact for Improving trend');

console.log('\n================================================================');
console.log(`PHASE 15 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
