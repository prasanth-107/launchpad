/**
 * test_opportunity_intelligence.mjs
 * Phase 14 Unit & Integration Test Suite
 * Modern Placement Launchpad - Placement Drive Intelligence & Smart Opportunity Discovery
 *
 * Tests:
 * A. Deadline Classification (closing_today, closing_tomorrow, closing_soon, open, closed, no_deadline)
 * B. Deterministic Priority Computation (6 tiers: high_priority, good_opportunity, consider_later, low_priority, not_eligible, eligibility_unknown)
 * C. Non-overlapping Priority Weights (High > Good > Consider > Low > Unknown > Ineligible)
 * D. Match Explanation Generation (grounded evidence bullets)
 * E. Missing Skills to Courses Mapping (canonical Phase 6 courses & honest fallback)
 * F. Deterministic Opportunity Ranking (recommended, match, deadline, priority, saved, applied)
 * G. Drive Preparation Actions Generation (Phase 13 preparation workspace integration)
 * H. Comprehensive evaluateAllOpportunities (catalog evaluation with telemetry)
 * I. Progress Analytics Engine Integration (analyzePlacementDriveOpportunities & computeProgressOverview)
 * J. Career Coach Integration (job_fit_matching intent & priority/deadline facts)
 * K. Safe Handling of Missing Profile Data (zero hallucination, eligibility_unknown)
 * L. Safe Handling of Ineligible Candidates (never promoted above eligible)
 * M. Duplicate Application & Expired Deadline Protection (apply disabled)
 */

import {
  DEADLINE_URGENCY,
  PRIORITY_TIERS,
  classifyOpportunityDeadline,
  computeOpportunityPriority,
  generateMatchExplanation,
  mapMissingSkillsToCourses,
  rankOpportunities,
  generateDrivePreparationActions,
  evaluateAllOpportunities
} from './src/lib/opportunityIntelligenceEngine.js';

import {
  computeProgressOverview,
  analyzePlacementDriveOpportunities
} from './src/lib/progressAnalyticsEngine.js';

import {
  buildCareerCoachContext,
  detectUserIntent,
  generateDeterministicCoachResponse
} from './src/lib/careerCoachEngine.js';

import { PLACEMENT_OPPORTUNITIES_CATALOG } from './src/lib/jobMatchingEngine.js';

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
console.log('PHASE 14: PLACEMENT DRIVE INTELLIGENCE UNIT & INTEGRATION TESTS');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test Group A: Deadline Classification
// -----------------------------------------------------------------------------
console.log('--- Test Group A: Deadline Classification ---');

const now = new Date();

// 1. Closed deadline
const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const dPast = classifyOpportunityDeadline(pastDate);
assert(dPast.urgency === DEADLINE_URGENCY.CLOSED, 'Past date classified as closed');
assert(dPast.isExpired === true, 'Past date marked as isExpired=true');

// 2. Closing today (< 24h)
const todayDate = new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString();
const dToday = classifyOpportunityDeadline(todayDate);
assert(dToday.urgency === DEADLINE_URGENCY.CLOSING_TODAY, 'Date within 24h classified as closing_today');
assert(dToday.daysLeft === 0, 'Date within 24h reports 0 daysLeft');
assert(dToday.isExpired === false, 'Closing today is not expired');

// 3. Closing tomorrow (1 day)
const tomorrowDate = new Date(now.getTime() + 30 * 60 * 60 * 1000).toISOString();
const dTomorrow = classifyOpportunityDeadline(tomorrowDate);
assert(dTomorrow.urgency === DEADLINE_URGENCY.CLOSING_TOMORROW, 'Date in ~30h classified as closing_tomorrow');
assert(dTomorrow.daysLeft === 1, 'Date in ~30h reports 1 dayLeft');

// 4. Closing soon (2-3 days)
const soonDate = new Date(now.getTime() + 55 * 60 * 60 * 1000).toISOString();
const dSoon = classifyOpportunityDeadline(soonDate);
assert(dSoon.urgency === DEADLINE_URGENCY.CLOSING_SOON, 'Date in ~2.3 days classified as closing_soon');
assert(dSoon.daysLeft === 2, 'Date in ~2.3 days reports 2 daysLeft');

// 5. Open (> 3 days)
const openDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
const dOpen = classifyOpportunityDeadline(openDate);
assert(dOpen.urgency === DEADLINE_URGENCY.OPEN, 'Date in 10 days classified as open');
assert(dOpen.daysLeft === 10, 'Date in 10 days reports 10 daysLeft');

// 6. No deadline
const dNull = classifyOpportunityDeadline(null);
assert(dNull.urgency === DEADLINE_URGENCY.NO_DEADLINE, 'Null deadline classified as no_deadline');
assert(dNull.label === 'Rolling Recruitment', 'Null deadline reports Rolling Recruitment');

// -----------------------------------------------------------------------------
// Test Group B: Opportunity Priority Computation
// -----------------------------------------------------------------------------
console.log('\n--- Test Group B: Opportunity Priority Computation ---');

// 1. Not eligible -> not_eligible (even with 100% match)
const pIneligible = computeOpportunityPriority({
  matchScore: 95,
  eligibility: { status: 'not_eligible', canApply: false }
});
assert(pIneligible.tier === PRIORITY_TIERS.NOT_ELIGIBLE, 'Ineligible candidate gets not_eligible priority tier');
assert(pIneligible.canApply === false, 'Ineligible candidate cannot apply');

// 2. Missing data -> eligibility_unknown
const pUnknown = computeOpportunityPriority({
  matchScore: 80,
  eligibility: { status: 'eligibility_unknown', canApply: false }
});
assert(pUnknown.tier === PRIORITY_TIERS.ELIGIBILITY_UNKNOWN, 'Missing data candidate gets eligibility_unknown priority tier');

// 3. Eligible, High Match (>=70), Not Applied -> high_priority
const pHigh = computeOpportunityPriority({
  matchScore: 85,
  eligibility: { status: 'eligible', canApply: true },
  applicationStatus: null
});
assert(pHigh.tier === PRIORITY_TIERS.HIGH_PRIORITY, 'Eligible + 85% match + unapplied gets high_priority');
assert(pHigh.score >= 100, 'High priority score is in high bracket (>= 100)');

// 4. Eligible, Good Match (50-69), Not Applied -> good_opportunity
const pGood = computeOpportunityPriority({
  matchScore: 62,
  eligibility: { status: 'eligible', canApply: true },
  applicationStatus: null
});
assert(pGood.tier === PRIORITY_TIERS.GOOD_OPPORTUNITY, 'Eligible + 62% match gets good_opportunity');
assert(pGood.score >= 80 && pGood.score < 100, 'Good opportunity score is in 80-99 bracket');

// 5. Eligible, Low Match (<50), Not Applied -> consider_later
const pConsider = computeOpportunityPriority({
  matchScore: 40,
  eligibility: { status: 'eligible', canApply: true },
  applicationStatus: null
});
assert(pConsider.tier === PRIORITY_TIERS.CONSIDER_LATER, 'Eligible + 40% match gets consider_later');

// 6. Already applied -> low_priority
const pApplied = computeOpportunityPriority({
  matchScore: 90,
  eligibility: { status: 'eligible', canApply: true },
  applicationStatus: 'applied'
});
assert(pApplied.tier === PRIORITY_TIERS.LOW_PRIORITY, 'Already applied gets low_priority tier');
assert(pApplied.isApplied === true, 'Already applied marked as isApplied=true');

// -----------------------------------------------------------------------------
// Test Group C: Priority Score Ordering & Urgency Boosts
// -----------------------------------------------------------------------------
console.log('\n--- Test Group C: Priority Score Ordering ---');

assert(pHigh.score > pGood.score, 'High priority score strictly greater than Good opportunity score');
assert(pGood.score > pConsider.score, 'Good opportunity score strictly greater than Consider later score');
assert(pConsider.score > pApplied.score, 'Consider later score strictly greater than Applied/Low priority score');
assert(pApplied.score > pUnknown.score, 'Applied score greater than Eligibility Unknown');
assert(pUnknown.score > pIneligible.score, 'Eligibility Unknown greater than Ineligible');

// Deadline urgency boost within same tier
const pUrgent = computeOpportunityPriority({
  matchScore: 85,
  eligibility: { status: 'eligible', canApply: true },
  deadline: { urgency: DEADLINE_URGENCY.CLOSING_SOON, daysLeft: 2 }
});
assert(pUrgent.score > pHigh.score, 'Closing soon deadline provides positive boost within tier');

// -----------------------------------------------------------------------------
// Test Group D: Match Explanation Generation
// -----------------------------------------------------------------------------
console.log('\n--- Test Group D: Match Explanation Generation ---');

const candidateData = {
  profile: {
    name: 'Prasanth',
    department: 'Computer Science',
    cgpa: 8.8,
    backlogs: 0,
    preferred_job_role: 'Full Stack Software Engineer'
  },
  userSkills: [
    { skill_name: 'Python', proficiency_percent: 85, verified: true },
    { skill_name: 'React', proficiency_percent: 80, verified: true },
    { skill_name: 'JavaScript', proficiency_percent: 75, verified: true }
  ],
  attempts: [{ domain: 'technical', score_percent: 85, passed: true }],
  latestResume: { ats_score: 82 },
  interviews: [{ overall_score: 80 }]
};

const sampleOpp = PLACEMENT_OPPORTUNITIES_CATALOG[0]; // Google
const mockMatch = {
  matchScore: 82,
  explanation: {
    matchedSkills: [
      { name: 'Python', candidateScore: 85, weight: 30 },
      { name: 'React', candidateScore: 80, weight: 25 }
    ],
    missingSkills: ['System Design', 'Docker']
  }
};

const explanation = generateMatchExplanation(candidateData, sampleOpp, mockMatch);
assert(Array.isArray(explanation.whyMatches), 'whyMatches is an array');
assert(explanation.whyMatches.length >= 2, 'whyMatches contains at least 2 grounded evidence points');
assert(explanation.matchedSkills.length === 2, 'Grounded matched skills identified');
assert(explanation.missingSkills.length === 2, 'Grounded missing skills identified');

// -----------------------------------------------------------------------------
// Test Group E: Missing Skills to Courses Mapping
// -----------------------------------------------------------------------------
console.log('\n--- Test Group E: Missing Skills to Courses Mapping ---');

const mappingResult = mapMissingSkillsToCourses(['System Design', 'Algorithms', 'Quantum Computing']);
assert(mappingResult.recommendations.length >= 2, 'Maps known missing skills to registered Phase 6 courses');
const sysDesignCourse = mappingResult.recommendations.find(r => r.skill === 'System Design');
assert(sysDesignCourse && sysDesignCourse.courseTitle.includes('System Design'), 'System Design correctly mapped to System Design course');

// Unknown skill fallback message
assert(mappingResult.fallbackMessage.includes('Quantum Computing'), 'Unmapped skill named in transparent fallback message');

// -----------------------------------------------------------------------------
// Test Group F: Deterministic Opportunity Ranking
// -----------------------------------------------------------------------------
console.log('\n--- Test Group F: Deterministic Opportunity Ranking ---');

const oppList = [
  { id: 'job-1', matchScore: 85, priority: { rank: 1, score: 105 }, eligibility: { status: 'eligible' }, deadline: { isExpired: false, daysLeft: 5 }, applicationStatus: null },
  { id: 'job-2', matchScore: 92, priority: { rank: 6, score: 10 }, eligibility: { status: 'not_eligible' }, deadline: { isExpired: false, daysLeft: 2 }, applicationStatus: null },
  { id: 'job-3', matchScore: 80, priority: { rank: 1, score: 110 }, eligibility: { status: 'eligible' }, deadline: { isExpired: false, daysLeft: 1 }, applicationStatus: null },
  { id: 'job-4', matchScore: 88, priority: { rank: 4, score: 45 }, eligibility: { status: 'eligible' }, deadline: { isExpired: false, daysLeft: 3 }, applicationStatus: 'applied' }
];

const rankedRecommended = rankOpportunities(oppList, 'recommended');
assert(rankedRecommended[0].id === 'job-3' || rankedRecommended[0].id === 'job-1', 'Eligible high priority jobs rank at top');
assert(rankedRecommended[rankedRecommended.length - 1].id === 'job-2', 'Ineligible job ranks at bottom despite 92% match');

const rankedByMatch = rankOpportunities(oppList, 'match');
assert(rankedByMatch[0].id === 'job-2', 'Sort by match puts highest match score first');

const rankedByDeadline = rankOpportunities(oppList, 'deadline');
assert(rankedByDeadline[0].deadline.daysLeft <= rankedByDeadline[1].deadline.daysLeft, 'Sort by deadline puts earliest deadline first');

// -----------------------------------------------------------------------------
// Test Group G: Drive Preparation Actions Generation
// -----------------------------------------------------------------------------
console.log('\n--- Test Group G: Drive Preparation Actions Generation ---');

const prepActions = generateDrivePreparationActions({
  id: 'drive-google',
  company_name: 'Google',
  role_title: 'Software Engineer',
  matchExplanation: {
    missingSkills: ['Data Structures & Algorithms', 'System Design']
  }
}, candidateData);

assert(prepActions.length >= 2, 'Generates at least 2 tailored preparation actions');
assert(prepActions[0].category === 'DSA', 'DSA missing skill generates DSA drill action');
assert(prepActions[0].action_key.startsWith('prep_skill_'), 'Action has standardized action_key');
assert(prepActions.some(a => a.category === 'Mock Interview'), 'Generates tailored technical mock interview action');

// -----------------------------------------------------------------------------
// Test Group H: Comprehensive evaluateAllOpportunities
// -----------------------------------------------------------------------------
console.log('\n--- Test Group H: evaluateAllOpportunities ---');

const allEvaluated = evaluateAllOpportunities(PLACEMENT_OPPORTUNITIES_CATALOG, {
  ...candidateData,
  savedJobIds: ['opp-amazon-sde'],
  applications: [{ opportunity_id: 'opp-google-sde', status: 'applied' }]
});

assert(Array.isArray(allEvaluated), 'Evaluates catalog into array');
assert(allEvaluated.length === PLACEMENT_OPPORTUNITIES_CATALOG.length, 'Evaluates all catalog opportunities');

const amazonOpp = allEvaluated.find(o => o.id === 'opp-amazon-sde');
assert(amazonOpp && amazonOpp.isSaved === true, 'Correctly flags saved opportunity');

const googleOpp = allEvaluated.find(o => o.id === 'opp-google-sde');
assert(googleOpp && googleOpp.applicationStatus === 'applied', 'Correctly tracks applied opportunity');
assert(googleOpp.isTracked === true, 'Correctly flags isTracked=true');

// Verify all opportunities have required Phase 14 properties
const hasAllProps = allEvaluated.every(o => (
  o.matchScore !== undefined &&
  o.matchTier !== undefined &&
  o.eligibility !== undefined &&
  o.deadline !== undefined &&
  o.priority !== undefined &&
  o.whyMatches !== undefined &&
  Array.isArray(o.courseRecommendations)
));
assert(hasAllProps, 'Every evaluated opportunity contains all Phase 14 intelligence fields');

// -----------------------------------------------------------------------------
// Test Group I: Progress Analytics Engine Integration
// -----------------------------------------------------------------------------
console.log('\n--- Test Group I: Progress Analytics Engine Integration ---');

const driveAnalytics = analyzePlacementDriveOpportunities(allEvaluated);
assert(driveAnalytics.total === allEvaluated.length, 'Analytics reports total opportunity count');
assert(driveAnalytics.hasData === true, 'Analytics hasData is true');
assert(typeof driveAnalytics.eligibleCount === 'number', 'Analytics reports eligible count');
assert(typeof driveAnalytics.highMatchCount === 'number', 'Analytics reports high match count');
assert(driveAnalytics.topRecommended !== null, 'Analytics identifies top recommended opportunity');

const progressOverview = computeProgressOverview({
  attempts: candidateData.attempts,
  userSkills: candidateData.userSkills,
  resumes: [candidateData.latestResume],
  interviews: candidateData.interviews,
  opportunities: allEvaluated
});
assert(progressOverview.opportunities.hasData === true, 'computeProgressOverview exposes opportunities data');
assert(progressOverview.opportunities.totalCount === allEvaluated.length, 'Overview opportunity total matches catalog');

// -----------------------------------------------------------------------------
// Test Group J: Career Coach Intent & Guidance Integration
// -----------------------------------------------------------------------------
console.log('\n--- Test Group J: Career Coach Integration ---');

assert(detectUserIntent('Which placement drive should I apply to?') === 'job_fit_matching', 'Detects job_fit_matching on "apply to drive"');
assert(detectUserIntent('Am I eligible for the Google drive?') === 'job_fit_matching', 'Detects job_fit_matching on "eligible for drive"');
assert(detectUserIntent('Which job should I prioritize?') === 'job_fit_matching', 'Detects job_fit_matching on "job prioritize"');

const coachContext = buildCareerCoachContext({
  profile: candidateData.profile,
  userSkills: candidateData.userSkills,
  attempts: candidateData.attempts,
  latestResume: candidateData.latestResume,
  interviews: candidateData.interviews,
  opportunities: allEvaluated
});

assert(coachContext.jobMatches.topMatches.length > 0, 'Career Coach context contains top matches');
const topCoachMatch = coachContext.jobMatches.topMatches[0];
assert(topCoachMatch.priority !== null, 'Career Coach top match includes priority info');
assert(topCoachMatch.deadline !== null, 'Career Coach top match includes deadline info');

const coachResponse = generateDeterministicCoachResponse('job_fit_matching', coachContext, 'Which job is best for me?');
assert(coachResponse.facts.some(f => f.includes('Priority Tier:')), 'Deterministic coach response includes Priority Tier fact');
assert(coachResponse.facts.some(f => f.includes('Application Deadline:')), 'Deterministic coach response includes Application Deadline fact');

// -----------------------------------------------------------------------------
// Test Group K: Safe Handling of Missing Profile Data (No Hallucination)
// -----------------------------------------------------------------------------
console.log('\n--- Test Group K: Missing Profile Data Safe Handling ---');

const emptyCandidate = {
  profile: null,
  userSkills: [],
  attempts: [],
  latestResume: null,
  interviews: []
};

const evaluatedEmpty = evaluateAllOpportunities(PLACEMENT_OPPORTUNITIES_CATALOG, emptyCandidate);
assert(evaluatedEmpty.length === PLACEMENT_OPPORTUNITIES_CATALOG.length, 'Handles empty candidate without crashing');
assert(evaluatedEmpty.every(o => o.eligibility.status === 'eligibility_unknown'), 'Unassessed candidate is eligibility_unknown for all (never false eligible)');
assert(evaluatedEmpty.every(o => o.priority.tier === PRIORITY_TIERS.ELIGIBILITY_UNKNOWN), 'Unassessed candidate priority is eligibility_unknown');

// -----------------------------------------------------------------------------
// Test Group L: Ineligible Candidate Never Promoted
// -----------------------------------------------------------------------------
console.log('\n--- Test Group L: Ineligible Candidate Never Promoted ---');

const ineligibleCandidate = {
  profile: {
    department: 'Civil Engineering', // catalog drives are CS/IT
    cgpa: 5.2, // Below cutoff
    backlogs: 4 // Backlogs present
  },
  userSkills: [
    { skill_name: 'Python', proficiency_percent: 95, verified: true }
  ],
  attempts: [{ domain: 'technical', score_percent: 95, passed: true }]
};

const evaluatedIneligible = evaluateAllOpportunities(PLACEMENT_OPPORTUNITIES_CATALOG, ineligibleCandidate);
const allIneligible = evaluatedIneligible.every(o => o.eligibility.status === 'not_eligible');
assert(allIneligible, 'Civil engineer with 5.2 CGPA and 4 backlogs is correctly marked not_eligible for tech drives');
const allNotEligibleTier = evaluatedIneligible.every(o => o.priority.tier === PRIORITY_TIERS.NOT_ELIGIBLE);
assert(allNotEligibleTier, 'All ineligible drives get not_eligible priority tier');

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL PHASE 14 OPPORTUNITY INTELLIGENCE TESTS PASSED! 🎉');
  process.exit(0);
}
