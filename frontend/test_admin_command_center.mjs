// ==============================================================================
// PHASE 18: PLACEMENT COMMAND CENTER & ADMIN INTELLIGENCE TEST SUITE
// Tests A through L as mandated by Master Prompt specification
// ==============================================================================

import {
  READINESS_COHORT_CATEGORIES,
  classifyReadinessCategory,
  verifyAdminAccess,
  aggregateReadinessMetrics,
  aggregateSkillGaps,
  aggregateApplicationPipeline,
  aggregateOpportunityIntelligence,
  filterAndSearchStudents,
  sanitizeStudentSummary,
  buildStudentPlacementDossier,
  generateSafeExportCsv
} from './src/lib/adminCommandCenterEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n=== PHASE 18: PLACEMENT COMMAND CENTER & ADMIN INTELLIGENCE TESTS ===\n');

// --------------------------------------------------------------------------
// TEST A: Candidate denied admin data
// --------------------------------------------------------------------------
console.log('Test A: Candidate denied admin data');
const candidateUser = { id: 'cand-001', name: 'Student One', email: 'stu@uni.edu', role: 'candidate' };
const candCheck = verifyAdminAccess(candidateUser);
assert(candCheck.authorized === false, 'Candidate user is denied administrator authorization');
assert(candCheck.error.includes('Administrator role required'), 'Appropriate unauthorized access error returned');

// --------------------------------------------------------------------------
// TEST B: Admin access granted
// --------------------------------------------------------------------------
console.log('\nTest B: Admin access granted');
const adminUser = { id: 'admin-001', name: 'Placement Officer', email: 'admin@uni.edu', role: 'admin' };
const adminCheck = verifyAdminAccess(adminUser);
assert(adminCheck.authorized === true, 'Admin user successfully authorized');
assert(adminCheck.role === 'admin', 'Admin role recognized');

// --------------------------------------------------------------------------
// TEST C: Empty admin dashboard (zero-data handling)
// --------------------------------------------------------------------------
console.log('\nTest C: Empty admin dashboard');
const emptyMetrics = aggregateReadinessMetrics([]);
assert(emptyMetrics.totalRegistered === 0, 'Registered count is 0 for empty cohort');
assert(emptyMetrics.assessedStudents === 0, 'Assessed count is 0 for empty cohort');
assert(emptyMetrics.averageReadiness === null, 'Average readiness is safely null (not misleading 0%)');
assert(emptyMetrics.hasData === false, 'hasData is false for empty dashboard');
assert(emptyMetrics.distribution[READINESS_COHORT_CATEGORIES.IN_PROGRESS].count === 0, 'Distribution initialized with 0 counts');

// --------------------------------------------------------------------------
// TEST D: Aggregate readiness (real calculation & cohort distribution)
// --------------------------------------------------------------------------
console.log('\nTest D: Aggregate readiness');
const cohort = [
  { id: 's1', name: 'Alice', readinessScore: 90 }, // Placement Ready
  { id: 's2', name: 'Bob', readinessScore: 78 },   // Almost Ready
  { id: 's3', name: 'Charlie', readinessScore: 62 }, // Needs Improvement
  { id: 's4', name: 'Diana', readinessScore: 45 },   // Needs Significant Improvement
  { id: 's5', name: 'Eve', readinessScore: null }    // Assessment in Progress
];
const cohortMetrics = aggregateReadinessMetrics(cohort);
assert(cohortMetrics.totalRegistered === 5, 'Total registered is 5');
assert(cohortMetrics.assessedStudents === 4, 'Assessed students count is 4');
assert(cohortMetrics.unassessedStudents === 1, 'Unassessed count is 1');
// (90 + 78 + 62 + 45) / 4 = 275 / 4 = 68.75 -> 68.8
assert(cohortMetrics.averageReadiness === 68.8, `Average readiness computed accurately (expected 68.8, got ${cohortMetrics.averageReadiness})`);
assert(cohortMetrics.placementReadyCount === 1, 'Placement ready count is 1');
assert(cohortMetrics.almostReadyCount === 1, 'Almost ready count is 1');
assert(cohortMetrics.needsImprovementCount === 1, 'Needs improvement count is 1');
assert(cohortMetrics.needsSignificantImprovementCount === 1, 'Needs significant improvement count is 1');
assert(cohortMetrics.distribution[READINESS_COHORT_CATEGORIES.IN_PROGRESS].count === 1, 'In-progress category count is 1');

// --------------------------------------------------------------------------
// TEST E: Skill gap aggregation
// --------------------------------------------------------------------------
console.log('\nTest E: Skill gap aggregation');
const skillData = [
  { name: 'SQL', score: 55 },
  { name: 'SQL', score: 40 },
  { name: 'SQL', score: 85 },
  { name: 'React', score: 90 },
  { name: 'React', score: 75 }
];
const skillGaps = aggregateSkillGaps(skillData);
assert(skillGaps.length === 2, 'Two unique skills aggregated');
assert(skillGaps[0].name === 'SQL', 'SQL ranked first due to higher critical gaps');
assert(skillGaps[0].criticalGapCount === 2, 'SQL correctly shows 2 critical gaps');
assert(skillGaps[1].name === 'React', 'React ranked second');
assert(skillGaps[1].criticalGapCount === 0, 'React has 0 critical gaps');

// --------------------------------------------------------------------------
// TEST F: Application pipeline aggregation
// --------------------------------------------------------------------------
console.log('\nTest F: Application pipeline aggregation');
const applications = [
  { id: 'a1', status: 'applied', company: 'Google', private_notes: 'Secret note 1' },
  { id: 'a2', status: 'assessment', company: 'Amazon', private_notes: 'Secret note 2' },
  { id: 'a3', status: 'interview', company: 'Microsoft', private_notes: 'Secret note 3' },
  { id: 'a4', status: 'offer', company: 'Uber', private_notes: 'Secret note 4' },
  { id: 'a5', status: 'selected', company: 'Stripe', private_notes: 'Secret note 5' },
  { id: 'a6', status: 'rejected', company: 'Netflix' }
];
const pipelineMetrics = aggregateApplicationPipeline(applications);
assert(pipelineMetrics.totalApplications === 6, 'Total applications is 6');
assert(pipelineMetrics.appliedCount === 1, 'Applied count is 1');
assert(pipelineMetrics.interviewCount === 1, 'Interview count is 1');
assert(pipelineMetrics.offerCount === 1, 'Offer count is 1');
assert(pipelineMetrics.selectedCount === 1, 'Selected count is 1');
assert(pipelineMetrics.rejectedCount === 1, 'Rejected count is 1');
assert(pipelineMetrics.activePipelineCount === 4, 'Active pipeline count is 4 (applied, assessment, interview, offer)');
assert(pipelineMetrics.interviewRate !== null, 'Interview rate calculated');
assert(pipelineMetrics.selectionRate !== null, 'Selection rate calculated');

// Empty applications pipeline test for zero-denominator safety
const emptyPipeline = aggregateApplicationPipeline([]);
assert(emptyPipeline.interviewRate === null, 'Interview rate returns null when no applications exist');
assert(emptyPipeline.offerRate === null, 'Offer rate returns null when no applications exist');

// --------------------------------------------------------------------------
// TEST G: Opportunity aggregation
// --------------------------------------------------------------------------
console.log('\nTest G: Opportunity aggregation');
const opportunities = [
  { id: 'opp-1', company: 'Google', deadline: new Date(Date.now() + 2 * 86400000).toISOString(), status: 'open', priority: 'high' },
  { id: 'opp-2', company: 'Amazon', deadline: new Date(Date.now() + 10 * 86400000).toISOString(), status: 'open', priority: 'normal' },
  { id: 'opp-3', company: 'Meta', deadline: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'closed', priority: 'normal' }
];
const oppApps = [
  { id: 'ap1', opportunity_id: 'opp-1' },
  { id: 'ap2', opportunity_id: 'opp-1' }
];
const oppMetrics = aggregateOpportunityIntelligence(opportunities, oppApps);
assert(oppMetrics.totalOpportunities === 3, 'Total opportunities is 3');
assert(oppMetrics.activeCount === 2, 'Active opportunities count is 2');
assert(oppMetrics.closingSoonCount === 1, 'Closing soon count is 1 (2 days left)');
assert(oppMetrics.highPriorityCount === 1, 'High priority count is 1');
assert(oppMetrics.opportunities[0].id === 'opp-1', 'Most applied opportunity ranked first');
assert(oppMetrics.opportunities[0].applicantCount === 2, 'Applicant count calculated correctly');

// --------------------------------------------------------------------------
// TEST H: Student search & filtering
// --------------------------------------------------------------------------
console.log('\nTest H: Student search');
const studentList = [
  { id: '1', name: 'Prasanth Rao', department: 'Computer Science', year: '4th Year', readinessScore: 88 },
  { id: '2', name: 'Aditi Sharma', department: 'Information Technology', year: '3rd Year', readinessScore: 65 },
  { id: '3', name: 'Rohan Gupta', department: 'Computer Science', year: '4th Year', readinessScore: 42 },
  { id: '4', name: 'Kavita Patel', department: 'Electronics', year: '3rd Year', readinessScore: null }
];

const nameSearch = filterAndSearchStudents(studentList, { query: 'Prasanth' });
assert(nameSearch.length === 1 && nameSearch[0].name === 'Prasanth Rao', 'Found student by name query');

const deptFilter = filterAndSearchStudents(studentList, { department: 'Computer Science' });
assert(deptFilter.length === 2, 'Filtered students by department');

const rangeFilter = filterAndSearchStudents(studentList, { readinessRange: '85+' });
assert(rangeFilter.length === 1 && rangeFilter[0].name === 'Prasanth Rao', 'Filtered by 85+ readiness range');

const unassessedFilter = filterAndSearchStudents(studentList, { readinessRange: 'unassessed' });
assert(unassessedFilter.length === 1 && unassessedFilter[0].name === 'Kavita Patel', 'Filtered unassessed students');

// --------------------------------------------------------------------------
// TEST I: Unauthorized access
// --------------------------------------------------------------------------
console.log('\nTest I: Unauthorized access');
const nullUserCheck = verifyAdminAccess(null);
assert(nullUserCheck.authorized === false, 'Null user blocked from admin access');
const anonymousUserCheck = verifyAdminAccess({});
assert(anonymousUserCheck.authorized === false, 'Anonymous user blocked from admin access');
const candidateRoleCheck = verifyAdminAccess({ role: 'student' });
assert(candidateRoleCheck.authorized === false, 'Student role blocked from admin access');

// --------------------------------------------------------------------------
// TEST J: RLS enforcement
// --------------------------------------------------------------------------
console.log('\nTest J: RLS enforcement');
// Verify dossier build strips private notes and credentials
const rawStudentData = {
  id: 'cand-xyz',
  name: 'Candidate X',
  password_hash: '$2b$12$secretpasswordhash',
  auth_token: 'bearer-token-12345'
};
const rawContext = {
  applications: [
    { id: 'app-99', company: 'Goldman Sachs', private_notes: 'Negotiate salary to 25 LPA, recruiter contact 9876543210' }
  ]
};
const dossier = buildStudentPlacementDossier(rawStudentData, rawContext);
assert(dossier.password_hash === undefined, 'Password hash strictly excluded from student placement dossier');
assert(dossier.auth_token === undefined, 'Auth token strictly excluded from student placement dossier');
assert(dossier.applications[0].private_notes === undefined, 'Private notes strictly stripped from admin application view');

// --------------------------------------------------------------------------
// TEST K: No sensitive data leakage
// --------------------------------------------------------------------------
console.log('\nTest K: No sensitive data leakage');
const sanitized = sanitizeStudentSummary({
  id: 'u1',
  name: 'Safe Student',
  secret_key: 'sk_live_12345',
  password: 'plaintext_password',
  token: 'access_jwt'
});
assert(sanitized.secret_key === undefined, 'Secret key omitted');
assert(sanitized.password === undefined, 'Password omitted');
assert(sanitized.token === undefined, 'Token omitted');

const csvExport = generateSafeExportCsv([rawStudentData]);
assert(!csvExport.includes('password_hash'), 'CSV export does not contain password_hash');
assert(!csvExport.includes('secretpasswordhash'), 'CSV export does not contain password values');
assert(!csvExport.includes('bearer-token'), 'CSV export does not contain tokens');

// --------------------------------------------------------------------------
// TEST L: No fabricated metrics
// --------------------------------------------------------------------------
console.log('\nTest L: No fabricated metrics');
const unassessedStudent = { id: 'u0', name: 'New Student' };
const unassessedSummary = sanitizeStudentSummary(unassessedStudent);
assert(unassessedSummary.readinessScore === null, 'Unassessed student readinessScore is null (not 0 or 70)');
assert(unassessedSummary.readinessCategory === 'Assessment in Progress', 'Category accurately reflects Assessment in Progress');

const zeroMetricCheck = aggregateReadinessMetrics([{ id: '1' }]);
assert(zeroMetricCheck.averageReadiness === null, 'Average readiness is null when 0 students have taken tests');

console.log(`\n==================================================`);
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`==================================================\n`);

if (failed > 0) {
  process.exit(1);
}
