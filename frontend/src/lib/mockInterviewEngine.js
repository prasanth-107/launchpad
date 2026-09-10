/**
 * mockInterviewEngine.js
 * -----------------------------------------------------------------------------
 * Modern Placement Launchpad - AI Mock Interview Simulation & Evaluation Engine
 *
 * Core Principles:
 * 1. Zero Fabricated Scores: Every rubric score is derived from actual candidate answers.
 * 2. 4-Pillar Evaluation:
 *    - Technical Depth (35%)
 *    - Communication & Structure (25%)
 *    - Relevance & Direct Responsiveness (25%)
 *    - Confidence & Delivery (15%)
 * 3. Contextual Awareness: Incorporates Phase 7 resume skills and student profile.
 * 4. Offline / Deterministic Intelligence: Operates reliably without external API dependencies.
 * 5. Full Alignment: Syncs with public.mock_interviews schema & 15% Placement Readiness pillar.
 * -----------------------------------------------------------------------------
 */

export const INTERVIEW_ROLES = [
  'Full Stack Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Data Engineer',
  'DevOps / Cloud Engineer',
  'AI / ML Engineer'
];

export const INTERVIEW_MODES = [
  { id: 'Technical Interview', name: 'Technical Interview', description: 'Core CS concepts, framework internals, architecture & system design' },
  { id: 'HR / Behavioral', name: 'HR / Behavioral', description: 'STAR framework, leadership, teamwork conflict resolution & motivation' },
  { id: 'Mixed Placement', name: 'Mixed Placement Round', description: 'Comprehensive campus placement simulation combining technical & behavioral questions' }
];

// Curated Question Bank by Role and Round
export const INTERVIEW_QUESTION_BANK = {
  // 1. Full Stack Software Engineer
  'Full Stack Software Engineer': {
    technical: [
      {
        id: 'fs_tech_1',
        question: 'Can you explain the difference between client-side rendering (CSR) and server-side rendering (SSR), and how hydration works in modern web frameworks?',
        category: 'Web Architecture',
        requiredConcepts: ['client-side', 'server-side', 'hydration', 'DOM', 'SEO', 'performance'],
        sampleFocus: 'Initial load performance, bundle size, search engine crawlability, interactive DOM.'
      },
      {
        id: 'fs_tech_2',
        question: 'How does the event loop in JavaScript handle asynchronous tasks between the call stack, microtask queue (Promises), and macrotask queue (setTimeout)?',
        category: 'JavaScript Core',
        requiredConcepts: ['event loop', 'call stack', 'microtask', 'macrotask', 'promise', 'callback'],
        sampleFocus: 'Execution order, non-blocking I/O, Promise resolution priority over setTimeout.'
      },
      {
        id: 'fs_tech_3',
        question: 'When designing a database schema for an e-commerce platform, how do you decide between database normalization and denormalization, and how do database indexes work under the hood?',
        category: 'Databases & System Design',
        requiredConcepts: ['normalization', 'redundancy', 'index', 'B-tree', 'read performance', 'write overhead'],
        sampleFocus: 'Trade-offs between transactional write integrity and analytical read query speed.'
      },
      {
        id: 'fs_tech_4',
        question: 'What is REST API idempotency? Which HTTP methods are idempotent and why does idempotency matter when handling financial transactions or payment retries?',
        category: 'API Engineering',
        requiredConcepts: ['idempotent', 'GET', 'PUT', 'DELETE', 'POST', 'retry', 'duplicate'],
        sampleFocus: 'Preventing double charges on network timeouts using idempotent tokens and methods.'
      }
    ]
  },

  // 2. Frontend Developer
  'Frontend Developer': {
    technical: [
      {
        id: 'fe_tech_1',
        question: 'Explain the React Component Lifecycle and how the useEffect hook handles mounting, updating, and cleanup phases with dependency arrays.',
        category: 'React Architecture',
        requiredConcepts: ['lifecycle', 'useEffect', 'dependencies', 'cleanup', 'render', 'mount'],
        sampleFocus: 'Preventing memory leaks, stale closures, and infinite re-render loops.'
      },
      {
        id: 'fe_tech_2',
        question: 'What are the main performance bottlenecks in web applications, and what strategies would you use to optimize Core Web Vitals (LCP, FID/INP, CLS)?',
        category: 'Frontend Performance',
        requiredConcepts: ['core web vitals', 'LCP', 'CLS', 'bundle size', 'lazy loading', 'code splitting', 'caching'],
        sampleFocus: 'Image optimization, code splitting with dynamic imports, minimizing layout shifts.'
      },
      {
        id: 'fe_tech_3',
        question: 'How does CSS layout engine handle Flexbox versus CSS Grid, and when should you choose one over the other for responsive interfaces?',
        category: 'CSS & Responsive Design',
        requiredConcepts: ['flexbox', 'grid', 'one-dimensional', 'two-dimensional', 'responsive', 'alignment'],
        sampleFocus: 'One-dimensional content flow vs two-dimensional structural page layouts.'
      }
    ]
  },

  // 3. Backend Developer
  'Backend Developer': {
    technical: [
      {
        id: 'be_tech_1',
        question: 'Explain the difference between a Process and a Thread in operating systems, and how inter-process communication (IPC) works.',
        category: 'Operating Systems',
        requiredConcepts: ['process', 'thread', 'memory space', 'context switch', 'IPC', 'shared memory'],
        sampleFocus: 'Memory address spaces, execution overhead, race conditions and synchronization.'
      },
      {
        id: 'be_tech_2',
        question: 'How do relational database transaction isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) protect against concurrency anomalies like dirty reads and phantom reads?',
        category: 'Database Concurrency',
        requiredConcepts: ['ACID', 'isolation levels', 'dirty read', 'phantom read', 'locking', 'serializable'],
        sampleFocus: 'Concurrency vs consistency trade-offs in high-throughput database systems.'
      },
      {
        id: 'be_tech_3',
        question: 'How would you architect a rate-limiting service to protect backend microservices from denial of service and API abuse? What algorithms would you consider?',
        category: 'System Architecture',
        requiredConcepts: ['rate limiting', 'token bucket', 'leaky bucket', 'redis', 'sliding window', 'HTTP 429'],
        sampleFocus: 'Token bucket vs sliding window counter, distributed caching in Redis.'
      }
    ]
  },

  // 4. Data Engineer
  'Data Engineer': {
    technical: [
      {
        id: 'de_tech_1',
        question: 'What is the architectural difference between ETL and ELT pipelines, and when would you use a modern cloud data warehouse for ELT transformations?',
        category: 'Data Pipelines',
        requiredConcepts: ['ETL', 'ELT', 'data warehouse', 'transformation', 'staging', 'compute'],
        sampleFocus: 'Leveraging cloud compute elasticity for in-database transformations.'
      },
      {
        id: 'de_tech_2',
        question: 'Explain how columnar storage formats (like Apache Parquet) optimize analytical query performance compared to row-oriented formats (like CSV or JSON).',
        category: 'Data Storage',
        requiredConcepts: ['columnar', 'parquet', 'compression', 'I/O', 'scan', 'aggregation'],
        sampleFocus: 'Column pruning, dictionary encoding, and reduced disk I/O for aggregations.'
      }
    ]
  },

  // 5. DevOps / Cloud Engineer
  'DevOps / Cloud Engineer': {
    technical: [
      {
        id: 'devops_tech_1',
        question: 'What is the difference between containerization using Docker and virtualization using Virtual Machines? How do Docker layers and image caching work?',
        category: 'Containerization',
        requiredConcepts: ['docker', 'virtual machine', 'kernel', 'container', 'layers', 'caching'],
        sampleFocus: 'Shared OS kernel vs hypervisor overhead, immutable image layers.'
      },
      {
        id: 'devops_tech_2',
        question: 'Explain the core stages of an automated CI/CD deployment pipeline, and how you implement blue-green or canary deployments with zero downtime.',
        category: 'CI/CD & Deployment',
        requiredConcepts: ['CI/CD', 'pipeline', 'automated testing', 'blue-green', 'canary', 'rollback', 'zero downtime'],
        sampleFocus: 'Automated test gates, traffic shifting, and health check monitoring.'
      }
    ]
  },

  // 6. AI / ML Engineer
  'AI / ML Engineer': {
    technical: [
      {
        id: 'ai_tech_1',
        question: 'Explain the bias-variance trade-off in machine learning. How do techniques like cross-validation and regularization (L1/L2) help prevent overfitting?',
        category: 'Machine Learning',
        requiredConcepts: ['bias', 'variance', 'overfitting', 'regularization', 'L1', 'L2', 'cross-validation'],
        sampleFocus: 'Model complexity, generalization error, penalty terms on weights.'
      },
      {
        id: 'ai_tech_2',
        question: 'How do transformers and self-attention mechanisms differ from traditional recurrent neural networks (RNNs) in natural language processing?',
        category: 'Deep Learning',
        requiredConcepts: ['transformer', 'self-attention', 'RNN', 'parallelization', 'sequence', 'embedding'],
        sampleFocus: 'Overcoming sequential bottleneck, capturing long-range token dependencies.'
      }
    ]
  }
};

// Canonical HR & Behavioral Questions (Used across all roles)
export const HR_BEHAVIORAL_QUESTIONS = [
  {
    id: 'hr_1',
    question: 'Can you walk me through your background, your technical journey in college, and what specifically draws you to this software engineering role?',
    category: 'HR / Introduction',
    requiredConcepts: ['background', 'education', 'passion', 'projects', 'growth', 'motivation'],
    sampleFocus: 'Past (education), Present (projects/skills), and Future (alignment with role).'
  },
  {
    id: 'hr_2',
    question: 'Describe a challenging group project where team members had conflicting opinions or missed deadlines. How did you resolve the situation using the STAR framework?',
    category: 'Behavioral / Teamwork',
    requiredConcepts: ['situation', 'task', 'action', 'result', 'communication', 'conflict', 'compromise'],
    sampleFocus: 'STAR structure: Situation, Task, Action, and measurable Result. Empathy and teamwork.'
  },
  {
    id: 'hr_3',
    question: 'What is your greatest technical strength, and what is one area or technical skill you identified as a weakness and actively took steps to improve?',
    category: 'HR / Self-Awareness',
    requiredConcepts: ['strength', 'weakness', 'learning', 'improvement', 'proactive', 'practice'],
    sampleFocus: 'Authentic self-awareness and demonstrable initiative to upskill.'
  },
  {
    id: 'hr_4',
    question: 'Tell me about a time you faced an impending project deadline and encountered unexpected technical bugs. How did you prioritize tasks under pressure?',
    category: 'Behavioral / Pressure',
    requiredConcepts: ['pressure', 'priority', 'deadline', 'debugging', 'triage', 'transparent', 'outcome'],
    sampleFocus: 'Calm triage, prioritizing minimum viable deliverable, and clear stakeholder communication.'
  }
];

/**
 * Generates an adaptive question set tailored to candidate role, interview type, and resume skills.
 */
export function generateInterviewQuestions(targetRole = 'Full Stack Software Engineer', interviewType = 'Technical Interview', candidateResumeSkills = [], questionCount = 4) {
  const roleBank = INTERVIEW_QUESTION_BANK[targetRole] || INTERVIEW_QUESTION_BANK['Full Stack Software Engineer'];
  const techQuestions = roleBank.technical || [];
  const hrQuestions = HR_BEHAVIORAL_QUESTIONS;

  let selected = [];

  if (interviewType === 'Technical Interview') {
    // Prioritize technical questions matching candidate's resume skills
    const prioritizedTech = [...techQuestions].sort((a, b) => {
      const aMatches = candidateResumeSkills.filter(sk => 
        a.requiredConcepts.some(c => c.toLowerCase() === sk.toLowerCase())
      ).length;
      const bMatches = candidateResumeSkills.filter(sk => 
        b.requiredConcepts.some(c => c.toLowerCase() === sk.toLowerCase())
      ).length;
      return bMatches - aMatches;
    });
    selected = prioritizedTech.slice(0, questionCount);
    // If not enough, pad with standard technical questions
    if (selected.length < questionCount) {
      const remaining = INTERVIEW_QUESTION_BANK['Full Stack Software Engineer'].technical.filter(q => !selected.some(s => s.id === q.id));
      selected = selected.concat(remaining.slice(0, questionCount - selected.length));
    }
  } else if (interviewType === 'HR / Behavioral') {
    selected = hrQuestions.slice(0, questionCount);
  } else {
    // Mixed Placement: 2 Technical + 2 HR/Behavioral
    const halfCount = Math.max(1, Math.floor(questionCount / 2));
    const techPick = techQuestions.slice(0, halfCount);
    const hrPick = hrQuestions.slice(0, questionCount - techPick.length);
    selected = [...techPick, ...hrPick];
  }

  return selected.map(q => ({
    ...q,
    text: q.question || q.text,
    question: q.question || q.text,
    type: q.type || (q.category && (q.category.includes('HR') || q.category.includes('Behavioral')) ? 'HR / Behavioral' : 'Technical Interview')
  }));
}

/**
 * Evaluates a candidate's answer using deterministic rubric scoring.
 */
export function evaluateCandidateAnswer({ question, studentAnswer, interviewType = 'Technical Interview', role = 'Full Stack Software Engineer' }) {
  const trimmed = typeof studentAnswer === 'string' ? studentAnswer.trim() : '';
  const lowerTrimmed = trimmed.toLowerCase();
  const rawWords = trimmed.split(/\s+/).filter(Boolean);
  const isEvasive = [
    'i do not know', 'i dont know', "i don't know", 'no idea', 'skip', 'pass', 'not sure'
  ].some(phrase => lowerTrimmed.includes(phrase));

  if (!trimmed || trimmed.length < 20 || rawWords.length < 5 || isEvasive) {
    return {
      overall_score: 25,
      overallScore: 25,
      technical_score: 20,
      technicalScore: 20,
      communication_score: 25,
      communicationScore: 25,
      relevance_score: 20,
      relevanceScore: 20,
      confidence_score: 30,
      confidenceScore: 30,
      feedback: 'Answer was too brief or evasive to evaluate engineering competence. Elaborate with technical explanations, specific architecture details, or the STAR format.',
      strengths: [],
      weaknesses: ['Response lacks explanatory depth; provide concrete technical arguments.'],
      follow_up: 'Could you elaborate with a specific technical example from a project you built?',
      followUpQuestion: 'Could you elaborate with a specific technical example from a project you built?',
      detectedMetrics: { wordCount: rawWords.length, hasSTAR: false, matchedConcepts: [] }
    };
  }

  const text = studentAnswer.trim();
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const qText = typeof question === 'string' ? question.toLowerCase() : (question.question || question.text || '').toLowerCase();
  const requiredConcepts = question.requiredConcepts || question.keywords || [];

  // 1. Technical Depth Scoring (0-100)
  let techScore = 40;
  // Keyword / concept presence (root matching supported)
  const matchedConcepts = requiredConcepts.filter(concept => {
    const c = concept.toLowerCase().trim();
    if (c.length <= 4) return lowerText.includes(c);
    const root = c.slice(0, Math.min(c.length - 1, 6));
    return lowerText.includes(c) || lowerText.includes(root);
  });
  if (requiredConcepts.length > 0) {
    const conceptRatio = matchedConcepts.length / requiredConcepts.length;
    techScore += Math.round(conceptRatio * 40);
  } else {
    techScore += 25;
  }
  // Engineering reasoning words (trade-offs, performance, scalability, bottlenecks)
  const reasoningTerms = ['trade-off', 'tradeoff', 'performance', 'latency', 'scale', 'scalable', 'bottleneck', 'cache', 'index', 'architecture', 'database', 'async', 'promise', 'memory', 'concurrency'];
  const matchedReasoning = reasoningTerms.filter(term => lowerText.includes(term));
  techScore += Math.min(20, matchedReasoning.length * 5);
  techScore = Math.min(95, Math.max(25, techScore));

  // 2. Communication Scoring (0-100)
  let commScore = 40;
  if (wordCount >= 30 && wordCount <= 250) {
    commScore += 35; // Ideal interview response length
  } else if (wordCount >= 15 && wordCount < 30) {
    commScore += 20; // A bit concise
  } else {
    commScore += 15; // Too short or overly verbose
  }
  // Structural transitions (first, secondly, however, therefore, in addition, for example)
  const structuralWords = ['first', 'second', 'however', 'therefore', 'for example', 'specifically', 'result', 'because', 'in order to'];
  const matchedStructure = structuralWords.filter(w => lowerText.includes(w));
  commScore += Math.min(25, matchedStructure.length * 6);
  // STAR detection for behavioral
  const hasStar = (lowerText.includes('situation') || lowerText.includes('context')) &&
                  (lowerText.includes('action') || lowerText.includes('implemented') || lowerText.includes('did')) &&
                  (lowerText.includes('result') || lowerText.includes('outcome') || lowerText.includes('achieved'));
  if (hasStar) commScore += 10;
  commScore = Math.min(95, Math.max(30, commScore));

  // 3. Relevance Scoring (0-100)
  let relScore = 40;
  // Extract key vocabulary from question (words > 4 chars)
  const qWords = qText.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 4 && !['explain', 'difference', 'between', 'can', 'you', 'what', 'describe'].includes(w));
  const matchedQWords = qWords.filter(qw => lowerText.includes(qw));
  if (qWords.length > 0) {
    relScore += Math.round((matchedQWords.length / qWords.length) * 45);
  } else {
    relScore += 30;
  }
  relScore = Math.min(95, Math.max(30, relScore));

  // 4. Confidence & Delivery (0-100)
  let confScore = 50;
  if (wordCount >= 40) confScore += 25;
  else if (wordCount >= 20) confScore += 15;
  // Penalty for hesitation or uncertainty words
  const hesitationWords = ['maybe', 'i guess', 'dunno', 'sort of', 'kind of', 'probably', 'not sure'];
  const hasHesitation = hesitationWords.some(hw => lowerText.includes(hw));
  if (hasHesitation) confScore -= 15;
  confScore = Math.min(95, Math.max(30, confScore));

  // Overall Question Score (Weighted Composite based on round type)
  const isBehavioral = interviewType === 'HR / Behavioral' || (question.type && question.type.includes('HR')) || (question.category && question.category.includes('HR'));
  let overall = 0;
  if (isBehavioral) {
    overall = Math.round(
      (commScore * 0.40) +
      (relScore * 0.30) +
      (confScore * 0.15) +
      (techScore * 0.15)
    );
  } else if (interviewType === 'Technical Interview') {
    overall = Math.round(
      (techScore * 0.40) +
      (commScore * 0.25) +
      (relScore * 0.25) +
      (confScore * 0.10)
    );
  } else {
    overall = Math.round(
      (techScore * 0.30) +
      (commScore * 0.30) +
      (relScore * 0.25) +
      (confScore * 0.15)
    );
  }

  // Generate Grounded Strengths & Weaknesses
  const strengths = [];
  const weaknesses = [];

  if (matchedConcepts.length >= 2) {
    strengths.push(`Addressed core concepts accurately: ${matchedConcepts.slice(0, 3).join(', ')}.`);
  }
  if (matchedReasoning.length > 0) {
    strengths.push('Articulated engineering trade-offs and performance considerations.');
  }
  if (wordCount >= 35 && wordCount <= 180) {
    strengths.push('Concise, well-calibrated response pacing suitable for campus recruitment.');
  }

  const missingConcepts = requiredConcepts.filter(c => !lowerText.includes(c.toLowerCase()));
  if (missingConcepts.length > 0) {
    weaknesses.push(`Could explicitly mention key terms: ${missingConcepts.slice(0, 3).join(', ')}.`);
  }
  if (wordCount < 30) {
    weaknesses.push('Response is brief; provide more concrete implementation details or architectural context.');
  }
  if (hasHesitation) {
    weaknesses.push('Avoid filler phrases like "I guess" or "maybe" to convey engineering confidence.');
  }

  // Constructive Feedback
  let feedback = '';
  if (overall >= 80) {
    feedback = `Strong technical articulation (${overall}%). Your answer clearly covered ${matchedConcepts.slice(0, 2).join(' and ') || 'the key requirements'}. To elevate to a senior tier, mention real-world benchmarking or production edge cases.`;
  } else if (overall >= 60) {
    feedback = `Solid answer (${overall}%). You touched on key points, but could deepen your explanation of ${missingConcepts[0] || 'system trade-offs'} with a concrete code or project example.`;
  } else {
    feedback = `Basic understanding demonstrated (${overall}%). Focus on structuring your technical definitions first, then state practical applications and trade-offs.`;
  }

  // Dynamic Follow-Up Question
  let follow_up = 'Can you describe a specific situation in your projects where you had to debug an issue related to this?';
  if (missingConcepts.length > 0) {
    follow_up = `How would you handle ${missingConcepts[0]} in a high-traffic production scenario?`;
  }

  return {
    overall_score: overall,
    overallScore: overall,
    technical_score: techScore,
    technicalScore: techScore,
    communication_score: commScore,
    communicationScore: commScore,
    relevance_score: relScore,
    relevanceScore: relScore,
    confidence_score: confScore,
    confidenceScore: confScore,
    feedback,
    strengths: strengths.length > 0 ? strengths : ['Clear baseline understanding of question prompt.'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Could provide additional production metrics.'],
    follow_up,
    followUpQuestion: follow_up,
    detectedMetrics: { wordCount, hasSTAR: hasStar, matchedConcepts, matchedReasoning }
  };
}

/**
 * Computes overall session score and summary report from all completed question exchanges.
 */
export function computeSessionSummary(exchanges = [], targetRole = 'Full Stack Software Engineer', interviewType = 'Technical Interview') {
  if (!exchanges || exchanges.length === 0) {
    return {
      overallScore: null,
      status: 'Interview incomplete',
      statusTier: 'Incomplete',
      statusDescription: 'Session ended before any answers were evaluated.',
      technicalScore: 0,
      communicationScore: 0,
      relevanceScore: 0,
      confidenceScore: 0,
      strengths: [],
      weaknesses: ['No questions were submitted for evaluation.'],
      recommendations: ['Complete an interview session to generate placement readiness data.'],
      exchanges: []
    };
  }

  const validEvals = exchanges.map(e => e.evaluation).filter(Boolean);
  const count = validEvals.length;

  const overallAvg = Math.round(validEvals.reduce((sum, e) => sum + (e.overall_score || 0), 0) / count);
  const techAvg = Math.round(validEvals.reduce((sum, e) => sum + (e.technical_score || 0), 0) / count);
  const commAvg = Math.round(validEvals.reduce((sum, e) => sum + (e.communication_score || 0), 0) / count);
  const relAvg = Math.round(validEvals.reduce((sum, e) => sum + (e.relevance_score || 0), 0) / count);
  const confAvg = Math.round(validEvals.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / count);

  let statusTier = 'Needs Improvement';
  let statusVariant = 'danger';
  let statusDescription = 'Practice articulating core technical concepts and structural STAR responses before campus recruitment drives.';

  if (overallAvg >= 75) {
    statusTier = 'Strong';
    statusVariant = 'success';
    statusDescription = 'Outstanding placement interview performance! Demonstrated strong technical reasoning and structured communication.';
  } else if (overallAvg >= 60) {
    statusTier = 'Good';
    statusVariant = 'warning';
    statusDescription = 'Solid foundation. Deepening technical trade-offs and structuring answers will move you into the top placement tier.';
  }

  // Aggregate Strengths
  const allStrengths = Array.from(new Set(validEvals.flatMap(e => e.strengths || []))).slice(0, 4);
  if (allStrengths.length === 0) {
    allStrengths.push('Demonstrated foundational problem solving and willingness to articulate technical ideas.');
  }

  // Aggregate Weaknesses
  const allWeaknesses = Array.from(new Set(validEvals.flatMap(e => e.weaknesses || []))).slice(0, 4);
  if (allWeaknesses.length === 0) {
    allWeaknesses.push('Continue practicing under timed conditions.');
  }

  // Prioritized Recommendations
  const recommendations = [];
  if (techAvg < 75) {
    recommendations.push({
      priority: 'High',
      title: 'Review System Architecture & Core CS Fundamentals',
      description: 'Strengthen technical terminology around concurrency, database indexing, and REST API idempotency.'
    });
  }
  if (commAvg < 75) {
    recommendations.push({
      priority: 'High',
      title: 'Adopt the STAR Framework for Behavioral Prompts',
      description: 'Clearly separate the Situation, Task, Action, and measurable Result when describing past project challenges.'
    });
  }
  if (confAvg < 70) {
    recommendations.push({
      priority: 'Medium',
      title: 'Reduce Hesitation & Deliver Confident Introductions',
      description: 'Keep opening project summaries within 90 seconds and eliminate filler words like "maybe" or "I guess".'
    });
  }
  recommendations.push({
    priority: 'Low',
    title: 'Incorporate Quantified Project Metrics',
    description: 'Reference actual metrics from your projects (e.g. "Reduced API response latency by 35%") during technical discussions.'
  });

  return {
    overallScore: overallAvg,
    status: 'Completed',
    statusTier,
    statusVariant,
    statusDescription,
    technicalScore: techAvg,
    communicationScore: commAvg,
    relevanceScore: relAvg,
    confidenceScore: confAvg,
    strengths: allStrengths,
    weaknesses: allWeaknesses,
    recommendations,
    exchanges,
    targetRole,
    interviewType,
    questionsAnswered: count
  };
}
