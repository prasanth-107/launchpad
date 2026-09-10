import { parseResumeText, evaluateResumeAts } from './src/lib/resumeAtsEngine.js';

console.log('--- Testing resumeAtsEngine.js ---');

// Test 1: Empty text
const emptyParsed = parseResumeText('');
const emptyEval = evaluateResumeAts(emptyParsed);
console.log('Test 1 - Empty ATS Score:', emptyEval.atsScore); // Expect null
console.log('Test 1 - Empty Status:', emptyEval.status); // Expect 'Analysis unavailable'
if (emptyEval.atsScore !== null) throw new Error('Test 1 Failed: empty text should have null score');

// Test 2: Fresher resume with projects and skills, but no professional experience
const fresherResume = `
Prasanth V
prasanth@example.com | +91 9876543210
linkedin.com/in/prasanth-dev | github.com/prasanth-code
B.Tech in Computer Science and Engineering
National Institute of Technology | CGPA: 8.8 / 10.0 | 2026

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL, HTML, CSS
Frameworks & Libraries: React, Node.js, FastAPI, Tailwind CSS, Express
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, GitHub, Docker, Postman, Linux
Fundamentals: Data Structures, Algorithms, OOP, DBMS, RESTful APIs

PROJECTS
1. Placement Launchpad Platform
Architected and developed a full-stack automated assessment platform using React, FastAPI, and PostgreSQL. Integrated real-time test timing, interactive code execution, and dynamic skill scoring. Reduced candidate screening evaluation latency by 45% across 200 test sessions.

2. Distributed Task Scheduler
Engineered a distributed asynchronous task queue in Python and Redis. Optimized query processing throughput by 30% handling 5,000 requests per minute with automated health check monitors.

ACHIEVEMENTS
- Finalist in National Level Hackathon FUSIONX 2026
- Solved 350+ DSA problems on LeetCode and GeeksforGeeks
`;

const parsedFresher = parseResumeText(fresherResume);
console.log('Test 2 - Parsed Fresher Name:', parsedFresher.contact.name);
console.log('Test 2 - Parsed Fresher Email:', parsedFresher.contact.email);
console.log('Test 2 - Parsed Fresher Degree:', parsedFresher.education.degree);
console.log('Test 2 - Parsed Fresher Skills Count:', parsedFresher.skills.all.length);
console.log('Test 2 - Is Fresher:', parsedFresher.isFresher);

const fresherEval = evaluateResumeAts(parsedFresher, 'Full Stack Software Engineer');
console.log('Test 2 - Fresher ATS Score:', fresherEval.atsScore);
console.log('Test 2 - Fresher Status Tier:', fresherEval.statusTier);
console.log('Test 2 - Fresher Breakdown:', JSON.stringify(fresherEval.breakdown));
console.log('Test 2 - Fresher Role Match:', fresherEval.roleMatch.matchPercent + '%');
console.log('Test 2 - Fresher Strengths:', fresherEval.strengths.length);
console.log('Test 2 - Fresher Weaknesses:', fresherEval.weaknesses.length);
console.log('Test 2 - Fresher Recommendations:', fresherEval.recommendations.length);

if (fresherEval.atsScore < 70 || fresherEval.atsScore > 100) {
  throw new Error(`Test 2 Failed: Expected score between 70 and 100, got ${fresherEval.atsScore}`);
}
if (!parsedFresher.isFresher) {
  throw new Error('Test 2 Failed: Should identify as fresher');
}

// Test 3: Sum of breakdown components equals atsScore
const b = fresherEval.breakdown;
const sum = b.contact.score + b.structure.score + b.sections.score + b.technicalSkills.score + b.keywordRelevance.score + b.actionAndMetrics.score + b.education.score;
console.log('Test 3 - Breakdown sum:', sum, 'atsScore:', fresherEval.atsScore);
if (sum !== fresherEval.atsScore) {
  throw new Error(`Test 3 Failed: Breakdown sum ${sum} != atsScore ${fresherEval.atsScore}`);
}

console.log('ALL UNIT TESTS PASSED SUCCESSFULLY!');
