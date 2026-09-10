import {
  INTERVIEW_ROLES,
  INTERVIEW_MODES,
  generateInterviewQuestions,
  evaluateCandidateAnswer,
  computeSessionSummary
} from './src/lib/mockInterviewEngine.js';

console.log('=== TESTING MOCK INTERVIEW ENGINE ===\n');

// 1. Check roles and modes
console.log('1. Supported Roles count:', INTERVIEW_ROLES.length);
console.log('   Supported Modes count:', INTERVIEW_MODES.length);

// 2. Generate questions
const questions = generateInterviewQuestions('Full Stack Software Engineer', 'Mixed Placement', ['React', 'Node.js', 'PostgreSQL'], 3);
console.log('\n2. Generated Questions count:', questions.length);
questions.forEach((q, idx) => {
  console.log(`   [Q${idx + 1}] (${q.type}): ${q.text.substring(0, 60)}...`);
});

if (questions.length !== 3) {
  throw new Error(`Expected 3 questions, got ${questions.length}`);
}

// 3. Evaluate an empty answer
console.log('\n3. Testing Empty / Minimal Answer Evaluation:');
const emptyEval = evaluateCandidateAnswer({
  question: questions[0],
  studentAnswer: 'I do not know.',
  interviewType: 'Mixed Placement',
  role: 'Full Stack Software Engineer'
});
console.log('   Overall Score:', emptyEval.overallScore);
console.log('   Technical Score:', emptyEval.technicalScore);
console.log('   Feedback:', emptyEval.feedback);
if (emptyEval.overallScore > 35) {
  throw new Error(`Empty answer score too high: ${emptyEval.overallScore}`);
}

// 4. Evaluate a strong technical answer
console.log('\n4. Testing Strong Technical Answer:');
const techQuestion = {
  id: 'tech_sql_indexing',
  text: 'How do database indexes (like B-trees) work, and how would you optimize a slow PostgreSQL query?',
  keywords: ['b-tree', 'index', 'explain analyze', 'postgresql', 'execution plan', 'latency', 'scan'],
  type: 'Technical Interview'
};
const strongTechAnswer = `In PostgreSQL, B-tree indexes organize data into balanced tree hierarchies so lookups happen in O(log n) time rather than doing an expensive full sequential scan. When diagnosing slow queries, I run EXPLAIN ANALYZE to inspect the query planner execution plan and see if sequential scans or nested loops are causing bottlenecks. I check index selectivity, add composite indexes on high-cardinality filter columns, and use partial indexes for filtered subsets to minimize disk I/O and reduce query latency significantly.`;

const techEval = evaluateCandidateAnswer({
  question: techQuestion,
  studentAnswer: strongTechAnswer,
  interviewType: 'Technical Interview',
  role: 'Backend Developer'
});
console.log('   Overall Score:', techEval.overallScore);
console.log('   Technical Depth:', techEval.technicalScore);
console.log('   Communication:', techEval.communicationScore);
console.log('   Relevance:', techEval.relevanceScore);
console.log('   Confidence:', techEval.confidenceScore);
console.log('   Strengths:', techEval.strengths);
console.log('   Follow-up:', techEval.followUpQuestion);

if (techEval.overallScore < 75) {
  throw new Error(`Expected high score for strong technical answer, got ${techEval.overallScore}`);
}

// 5. Evaluate STAR Behavioral Answer
console.log('\n5. Testing STAR Behavioral Answer:');
const hrQuestion = {
  id: 'hr_conflict',
  text: 'Tell me about a time you had a technical disagreement with a teammate. How did you resolve it?',
  keywords: ['disagreement', 'data', 'benchmark', 'compromise', 'collaboration', 'alignment'],
  type: 'HR / Behavioral'
};
const starAnswer = `In my previous capstone project, our team had a major disagreement about whether to use Redux or React Query for state caching. The situation caused friction because deadlines were tight. My task was to lead the frontend architecture decision objectively. The action I took was creating an empirical benchmark demo comparing boilerplate size and network refetch times, followed by a collaborative discussion with the team to align on maintainability. As a result, we adopted React Query, which cut our boilerplate code by 40% and enabled us to deliver the sprint 2 days ahead of schedule.`;

const starEval = evaluateCandidateAnswer({
  question: hrQuestion,
  studentAnswer: starAnswer,
  interviewType: 'HR / Behavioral',
  role: 'Full Stack Software Engineer'
});
console.log('   Overall Score:', starEval.overallScore);
console.log('   Communication:', starEval.communicationScore);
console.log('   STAR detected:', starEval.detectedMetrics.hasSTAR);
console.log('   Feedback:', starEval.feedback);

if (!starEval.detectedMetrics.hasSTAR) {
  throw new Error('Expected STAR structure to be detected');
}
if (starEval.overallScore < 75) {
  throw new Error(`Expected high score for STAR answer, got ${starEval.overallScore}`);
}

// 6. Test Overall Session Summary
console.log('\n6. Testing Overall Session Summary:');
const sessionSummary = computeSessionSummary([
  { question: techQuestion, studentAnswer: strongTechAnswer, evaluation: techEval },
  { question: hrQuestion, studentAnswer: starAnswer, evaluation: starEval }
], 'Full Stack Software Engineer', 'Mixed Placement');

console.log('   Session Overall Score:', sessionSummary.overallScore);
console.log('   Status Tier:', sessionSummary.statusTier);
console.log('   Strengths Count:', sessionSummary.strengths.length);
console.log('   Weaknesses Count:', sessionSummary.weaknesses.length);
console.log('   Recommendations Count:', sessionSummary.recommendations.length);

if (sessionSummary.overallScore < 70 || sessionSummary.statusTier !== 'Strong') {
  throw new Error(`Expected Strong tier, got ${sessionSummary.statusTier} (${sessionSummary.overallScore})`);
}

console.log('\n✅ ALL MOCK INTERVIEW ENGINE TESTS PASSED PERFECTLY!');
