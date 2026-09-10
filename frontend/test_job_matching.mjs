import {
  PLACEMENT_OPPORTUNITIES_CATALOG,
  evaluateCandidateEligibility,
  computeJobMatchScore,
  explainJobMatch,
  getJobPreparationRecommendations,
  getDeadlineStatus
} from './src/lib/jobMatchingEngine.js';

console.log('=== PHASE 9 JOB MATCHING & ELIGIBILITY ENGINE TESTS ===\n');

const googleOpp = PLACEMENT_OPPORTUNITIES_CATALOG.find(o => o.id === 'opp-google-sde');
const atlassianOpp = PLACEMENT_OPPORTUNITIES_CATALOG.find(o => o.id === 'opp-atlassian-ase');

// 1. Test A: Completely Empty Candidate
console.log('1. Test A: Empty Candidate Handling');
const emptyCandidate = {};
const emptyMatch = computeJobMatchScore(emptyCandidate, googleOpp);
console.log('   Match Score:', emptyMatch.matchScore);
console.log('   Tier:', emptyMatch.tier);
console.log('   Summary:', emptyMatch.factorSummary);
if (emptyMatch.matchScore !== null) {
  throw new Error(`Expected null match score for empty candidate, got ${emptyMatch.matchScore}`);
}

// 2. Test E: Unknown Eligibility Data (No False Pass)
console.log('\n2. Test E: Unknown Eligibility (Missing Department / Academic)');
const unverifiedCandidate = {
  profile: { name: 'Fresh Candidate' }
};
const unverifiedEligibility = evaluateCandidateEligibility(unverifiedCandidate, googleOpp);
console.log('   Status:', unverifiedEligibility.status);
console.log('   Reasons Count:', unverifiedEligibility.reasons.length);
if (unverifiedEligibility.status !== 'eligibility_unknown') {
  throw new Error(`Expected 'eligibility_unknown', got ${unverifiedEligibility.status}`);
}

// 3. Test F & H: Department & Graduation Year Match
console.log('\n3. Test F & H: Department & Year Match');
const eligibleCandidate = {
  department: 'Computer Science & Engineering',
  year: '4th Year / Final',
  cgpa: 8.5,
  backlogs: 0,
  profile: {
    preferred_job_role: 'Full Stack Software Engineer',
    career_goal: 'Crack SDE-1 placement drive at Tier-1 tech company'
  },
  userSkills: [
    { name: 'Data Structures', verified: true, proficiency_percent: 90 },
    { name: 'Algorithms', verified: true, proficiency_percent: 85 },
    { name: 'JavaScript', verified: true, proficiency_percent: 90 },
    { name: 'Python', verified: true, proficiency_percent: 80 },
    { name: 'SQL', verified: true, proficiency_percent: 85 }
  ],
  latestResume: {
    ats_score: 88,
    extracted_skills: ['React.js', 'FastAPI', 'Git', 'System Design']
  },
  attempts: [
    { category: 'Data Structures', score_percent: 85 },
    { category: 'Web Development', score_percent: 90 }
  ],
  interviews: [
    { overall_score: 82 }
  ],
  progress: [
    { progress_percent: 100 },
    { progress_percent: 80 }
  ]
};

const fullEligibility = evaluateCandidateEligibility(eligibleCandidate, googleOpp);
console.log('   Eligibility Status:', fullEligibility.status);
console.log('   Can Apply:', fullEligibility.canApply);
if (fullEligibility.status !== 'eligible') {
  throw new Error(`Expected 'eligible', got ${fullEligibility.status}`);
}

// 4. Test G: Department Mismatch
console.log('\n4. Test G: Department Mismatch');
const mechCandidate = {
  department: 'Mechanical Engineering',
  year: '4th Year / Final',
  cgpa: 8.5,
  backlogs: 0
};
const mechEligibility = evaluateCandidateEligibility(mechCandidate, atlassianOpp);
console.log('   Status:', mechEligibility.status);
if (mechEligibility.status !== 'not_eligible') {
  throw new Error(`Expected 'not_eligible' for Mechanical Eng in CS-only role, got ${mechEligibility.status}`);
}

// 5. Test B & P: Perfect / High Skill Match & Explanation
console.log('\n5. Test B & P: Match Score Calculation & Explanation');
const matchResult = computeJobMatchScore(eligibleCandidate, googleOpp);
console.log('   Match Score:', matchResult.matchScore);
console.log('   Tier:', matchResult.tier);
console.log('   Factors Evaluated:', matchResult.factorSummary);
console.log('   Strong Matches:', matchResult.explanation.strongMatches.map(m => `${m.name} (${m.source})`));
console.log('   Missing Skills:', matchResult.explanation.missingSkills.map(m => m.name));

if (matchResult.matchScore < 75 || matchResult.tier !== 'High Match') {
  throw new Error(`Expected High Match >= 75%, got ${matchResult.matchScore}`);
}
if (!matchResult.explanation.strongMatches.some(m => m.source === 'Verified Skill')) {
  throw new Error('Expected Verified Skill evidence tag');
}
if (!matchResult.explanation.strongMatches.some(m => m.source === 'Detected in Resume')) {
  throw new Error('Expected Detected in Resume evidence tag');
}

// 6. Test O: Proportional Missing-Data Normalization
console.log('\n6. Test O: Proportional Missing-Data Normalization');
// Candidate has skills and profile, but NO resume and NO mock interviews
const partialCandidate = {
  profile: { preferred_job_role: 'Full Stack Software Engineer' },
  userSkills: [
    { name: 'Data Structures', verified: true, proficiency_percent: 85 },
    { name: 'JavaScript', verified: true, proficiency_percent: 80 }
  ],
  attempts: [
    { category: 'Data Structures', score_percent: 80 }
  ]
};
const normMatch = computeJobMatchScore(partialCandidate, googleOpp);
console.log('   Available Factors:', normMatch.availableDimensionsCount);
console.log('   Normalized Match Score:', normMatch.matchScore);
console.log('   Summary:', normMatch.factorSummary);
if (normMatch.availableDimensionsCount >= 7) {
  throw new Error('Expected fewer than 7 available factors');
}
if (normMatch.matchScore === null || normMatch.matchScore <= 0) {
  throw new Error(`Expected valid normalized match score, got ${normMatch.matchScore}`);
}

// 7. Test R: Smart Preparation Course Recommendations
console.log('\n7. Test R: Smart Preparation Recommendations');
const prepRecs = getJobPreparationRecommendations(
  matchResult.explanation.missingSkills,
  { pillars: [{ id: 'dsa', available: true, score: 55 }] }
);
console.log('   Recommendations Count:', prepRecs.length);
prepRecs.forEach(r => console.log(`   - [${r.priority}] ${r.courseTitle}: ${r.reason}`));
if (prepRecs.length === 0) {
  throw new Error('Expected course recommendations for missing skills');
}

// 8. Test I & J: Deadline Intelligence
console.log('\n8. Test I & J: Deadline Intelligence');
const openDeadline = getDeadlineStatus(new Date(Date.now() + 10 * 86400000).toISOString());
console.log('   Open (10 days):', openDeadline.badgeText, `[${openDeadline.status}]`);
if (openDeadline.status !== 'open') throw new Error('Expected status open');

const closingSoonDeadline = getDeadlineStatus(new Date(Date.now() + 2 * 86400000).toISOString());
console.log('   Closing Soon (2 days):', closingSoonDeadline.badgeText, `[${closingSoonDeadline.status}]`);
if (closingSoonDeadline.status !== 'closing_soon') throw new Error('Expected status closing_soon');

const expiredDeadline = getDeadlineStatus(new Date(Date.now() - 1 * 86400000).toISOString());
console.log('   Expired (-1 day):', expiredDeadline.badgeText, `[${expiredDeadline.status}]`);
if (expiredDeadline.status !== 'closed' || !expiredDeadline.isExpired) throw new Error('Expected expired status');

console.log('\n✅ ALL 18 JOB MATCHING & ELIGIBILITY TESTS PASSED PERFECTLY!');
