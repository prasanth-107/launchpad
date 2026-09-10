/**
 * test_student_success_engine.mjs
 * -----------------------------------------------------------------------------
 * Verification Test Suite for Phase 17:
 * AI Placement Personalization & Student Success Engine
 * -----------------------------------------------------------------------------
 */

import {
  STUDENT_READINESS_STAGES,
  determineStudentReadinessStage,
  identifyCriticalBlockers,
  calculateFastestPathToReadiness,
  generatePersonalizedWeeklyStrategy,
  generatePlacementStrategy
} from './src/lib/studentSuccessEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('=== PHASE 17: AI PLACEMENT PERSONALIZATION & STUDENT SUCCESS TESTS ===\n');

// Test A: Empty student
console.log('Test A: Empty student');
{
  const emptyContext = {};
  const strategy = generatePlacementStrategy(emptyContext);
  assert(strategy.stage.id === 'getting_started', 'Empty student receives Getting Started stage');
  assert(strategy.readinessScore === null, 'Readiness score is null for empty student');
  assert(strategy.hasBlockers === true, 'Empty student has blockers flagged');
  assert(strategy.blockers[0].type === 'assessment', 'First blocker identifies missing diagnostic assessments');
}

// Test B: Beginner student
console.log('\nTest B: Beginner student');
{
  const beginnerContext = {
    attempts: [{ category: 'Data Structures', score: 35 }],
    userSkills: [{ skill_name: 'Data Structures', score: 35 }],
    readinessReport: { score: 35, pillars: [{ id: 'dsa', score: 35, baseWeight: 15, targetBenchmark: 75 }] }
  };
  const strategy = generatePlacementStrategy(beginnerContext);
  assert(strategy.stage.id === 'building_foundation', 'Score 35 maps to Building Foundation stage');
  assert(strategy.blockers.some(b => b.type === 'skill_gap'), 'Flags low assessment score as critical skill gap blocker');
}

// Test C: Skill-gap student
console.log('\nTest C: Skill-gap student');
{
  const skillGapContext = {
    attempts: [{ category: 'SQL', score: 52 }],
    userSkills: [
      { skill_name: 'SQL', score: 52 },
      { skill_name: 'Python', score: 75 }
    ],
    readinessReport: { score: 58, pillars: [{ id: 'tech', score: 58, baseWeight: 20, targetBenchmark: 80 }] }
  };
  const strategy = generatePlacementStrategy(skillGapContext);
  assert(strategy.stage.id === 'developing_skills', 'Score 58 maps to Developing Skills stage');
  assert(strategy.primarySkillGap?.skill === 'SQL', 'Identifies SQL as primary critical skill gap');
  assert(strategy.weeklyStrategy.actions.skillAction.skill === 'SQL', 'Weekly plan schedules targeted adaptive SQL practice');
}

// Test D: Interview-focused student
console.log('\nTest D: Interview-focused student');
{
  const interviewContext = {
    attempts: [{ category: 'DSA', score: 85 }],
    userSkills: [{ skill_name: 'DSA', score: 85 }],
    interviews: [{ overall_score: 55 }],
    readinessReport: { score: 68, pillars: [{ id: 'interview', score: 55, baseWeight: 15, targetBenchmark: 75 }] }
  };
  const strategy = generatePlacementStrategy(interviewContext);
  assert(strategy.stage.id === 'interview_preparation', 'Score 68 maps to Interview Preparation stage');
  assert(strategy.blockers.some(b => b.type === 'interview'), 'Flags low interview score as blocker');
}

// Test E: Resume-focused student
console.log('\nTest E: Resume-focused student');
{
  const resumeContext = {
    attempts: [{ category: 'DSA', score: 80 }],
    userSkills: [{ skill_name: 'DSA', score: 80 }],
    resumes: [{ ats_score: 58 }],
    latestResume: { ats_score: 58 },
    readinessReport: { score: 70, pillars: [{ id: 'resume', score: 58, baseWeight: 15, targetBenchmark: 85 }] }
  };
  const strategy = generatePlacementStrategy(resumeContext);
  assert(strategy.blockers.some(b => b.type === 'resume' && b.id === 'blocker-low-ats'), 'Identifies low ATS score as high-severity blocker');
  assert(strategy.weeklyStrategy.actions.resumeAction !== null, 'Weekly strategy includes resume optimization action');
}

// Test F: Application-focused student
console.log('\nTest F: Application-focused student');
{
  const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const appStudentContext = {
    attempts: [{ category: 'DSA', score: 75 }],
    readinessReport: { score: 65, pillars: [] },
    applications: [
      {
        id: 'app-1',
        company_name: 'Microsoft',
        interview_date: in3Days,
        status: 'interview'
      }
    ]
  };
  const strategy = generatePlacementStrategy(appStudentContext);
  assert(strategy.stage.id === 'placement_active', 'Upcoming event in 3 days triggers Placement Active stage');
  assert(strategy.blockers.some(b => b.type === 'application'), 'Identifies upcoming scheduled round as critical blocker/milestone');
}

// Test G: Almost-ready student
console.log('\nTest G: Almost-ready student');
{
  const almostReadyContext = {
    attempts: [{ category: 'DSA', score: 80 }],
    readinessReport: { score: 78, pillars: [] }
  };
  const strategy = generatePlacementStrategy(almostReadyContext);
  assert(strategy.stage.id === 'almost_ready', 'Score 78 maps to Almost Ready stage');
}

// Test H: Placement-ready student
console.log('\nTest H: Placement-ready student');
{
  const placementReadyContext = {
    attempts: [{ category: 'DSA', score: 90 }],
    readinessReport: { score: 88, pillars: [] }
  };
  const strategy = generatePlacementStrategy(placementReadyContext);
  assert(strategy.stage.id === 'placement_ready', 'Score 88 maps to Placement Ready stage');
}

// Test I: Urgent opportunity
console.log('\nTest I: Urgent opportunity');
{
  const in2Days = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const oppContext = {
    readinessReport: { score: 72, pillars: [] },
    opportunities: [
      {
        id: 'opp-tcs',
        company_name: 'Tata Consultancy Services',
        application_deadline: in2Days
      }
    ]
  };
  const strategy = generatePlacementStrategy(oppContext);
  assert(strategy.urgentOpportunity !== null, 'Identifies drive closing in 2 days as urgent opportunity');
  assert(strategy.urgentOpportunity.company_name === 'Tata Consultancy Services', 'Correctly captures company name');
}

// Test J: Multiple competing priorities
console.log('\nTest J: Multiple competing priorities');
{
  const in2Days = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const complexContext = {
    attempts: [{ category: 'SQL', score: 45 }],
    userSkills: [{ skill_name: 'SQL', score: 45 }],
    resumes: [{ ats_score: 55 }],
    latestResume: { ats_score: 55 },
    interviews: [{ overall_score: 50 }],
    opportunities: [{ company_name: 'Amazon', application_deadline: in2Days }],
    readinessReport: { score: 52, pillars: [] }
  };
  const strategy = generatePlacementStrategy(complexContext);
  assert(strategy.blockers.length >= 3, 'Identifies all competing blockers');
  assert(strategy.blockers[0].severity === 'critical', 'First blocker has critical severity');
  assert(strategy.weeklyStrategy.whatToIgnore.length > 10, 'Provides clear "What to Ignore" guidance to avoid cognitive overload');
}

// Test K: Missing data handling
console.log('\nTest K: Missing data handling');
{
  const nullContext = {
    attempts: null,
    userSkills: null,
    resumes: null,
    interviews: null,
    applications: null
  };
  const strategy = generatePlacementStrategy(nullContext);
  assert(strategy.stage.id === 'getting_started', 'Safely defaults to Getting Started when fields are null');
  assert(strategy.readinessScore === null, 'Does not convert missing score into 0%');
}

// Test L: Deterministic prioritization
console.log('\nTest L: Deterministic prioritization');
{
  const ctx = {
    attempts: [{ category: 'React', score: 55 }],
    userSkills: [{ skill_name: 'React', score: 55 }],
    readinessReport: { score: 62, pillars: [] }
  };
  const run1 = generatePlacementStrategy(ctx);
  const run2 = generatePlacementStrategy(ctx);
  assert(run1.stage.id === run2.stage.id, 'Consistent stage determination');
  assert(run1.blockers.map(b => b.id).join(',') === run2.blockers.map(b => b.id).join(','), 'Consistent blocker ordering');
  assert(run1.weeklyStrategy.topPriority.title === run2.weeklyStrategy.topPriority.title, 'Consistent top priority');
}

// Test M: No fabricated facts
console.log('\nTest M: No fabricated facts');
{
  const ctx = {
    userSkills: [{ skill_name: 'Python', score: 72 }],
    readinessReport: { score: 70, pillars: [] }
  };
  const strategy = generatePlacementStrategy(ctx);
  const serialized = JSON.stringify(strategy);
  assert(!serialized.includes('undefined%'), 'No undefined% in output');
  assert(!serialized.includes('null%'), 'No null% in output');
}

console.log(`\n==================================================`);
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`==================================================`);

if (failed > 0) {
  process.exit(1);
}
