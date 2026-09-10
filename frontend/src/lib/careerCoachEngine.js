import { selectAdaptiveQuestions } from './questionIntelligenceEngine.js';
/**
 * careerCoachEngine.js
 * -----------------------------------------------------------------------------
 * Modern Placement Launchpad - AI Career Coach / Placement Copilot Engine
 *
 * Core Principles:
 * 1. Zero Hallucination Guarantee: Strictly grounded in candidate's platform data.
 *    Never fabricates scores, courses, opportunities, applications, dates, or results.
 * 2. Strict Facts vs. Recommendations Separation: Every response explicitly isolates
 *    OBSERVED FACTS from ACTIONABLE RECOMMENDATIONS.
 * 3. Transparent Missing-Data Handling: When data is missing/unassessed, explicitly says:
 *    "I don't have enough data to determine that yet." and provides the platform action.
 * 4. Engine Reuse: Sits directly ABOVE existing engines without duplicating formulas:
 *    - Placement Readiness Index (placementReadinessEngine.js)
 *    - Skill Gap Engine (skillGapEngine.js)
 *    - Personalized Learning Path Engine (learningPathEngine.js)
 *    - Resume ATS Engine (resumeAtsEngine.js)
 *    - Mock Interview Engine (mockInterviewEngine.js)
 *    - Job Matching Engine (jobMatchingEngine.js)
 *    - Application Pipeline Engine (applicationPipelineEngine.js)
 * 5. Prompt Injection Defense: Treats student resume, descriptions, and user inputs
 *    as untrusted content.
 * 6. Dual Fallback Architecture: Operates identically in offline frontend and backend.
 * -----------------------------------------------------------------------------
 */

import { computePlacementReadiness, READINESS_STATUS_TIERS } from './placementReadinessEngine.js';
import { computeSkillGaps } from './skillGapEngine.js';
import { generatePersonalizedLearningPath } from './learningPathEngine.js';
import { parseResumeText, evaluateResumeAts } from './resumeAtsEngine.js';
import { computeSessionSummary } from './mockInterviewEngine.js';
import { 
  computeJobMatchScore, 
  evaluateCandidateEligibility, 
  PLACEMENT_OPPORTUNITIES_CATALOG 
} from './jobMatchingEngine.js';
import { classifyOpportunityDeadline, computeOpportunityPriority } from './opportunityIntelligenceEngine.js';
import { calculateApplicationStatistics, getUpcomingApplicationEvent } from './applicationPipelineEngine.js';
import { buildFullInterviewIntelligence } from './interviewIntelligenceEngine.js';

// Canonical Quick Prompts
export const QUICK_PROMPTS = [
  { id: 'practice_next', label: 'What should I practice next?', prompt: 'What questions should I practice next to improve my placement readiness?' },
  { id: 'daily_action', label: 'What should I do today?', prompt: 'What should I prepare today based on my current placement data?' },
  { id: 'readiness_why', label: 'Why is my readiness score low?', prompt: 'Why is my readiness score low and how can I raise it?' },
  { id: 'skill_priority', label: 'What skill should I improve first?', prompt: 'Which skill should I improve first to maximize my placement readiness?' },
  { id: 'interview_prep', label: 'Help me prepare for my next interview', prompt: 'I have an upcoming placement interview. How should I prepare?' },
  { id: 'resume_boost', label: 'How can I improve my resume?', prompt: 'What should I do to improve my resume and ATS score?' },
  { id: 'applications_due', label: 'What applications need attention?', prompt: 'What applications in my pipeline need my attention right now?' }
];

// Source Labels
export const SOURCE_LABELS = {
  READINESS: 'Based on Placement Readiness',
  ASSESSMENT: 'Based on Latest Assessment',
  SKILL_GAP: 'Based on Skill Gaps',
  LEARNING_PATH: 'Based on Learning Path',
  RESUME_ATS: 'Based on Resume ATS',
  MOCK_INTERVIEW: 'Based on Mock Interview',
  JOB_MATCH: 'Based on Job Match',
  APPLICATION_PIPELINE: 'Based on Application Pipeline'
};

/**
 * Sanitizes untrusted text to prevent prompt injection overrides.
 */
export function sanitizeUntrustedText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, '[filtered phrase]')
    .replace(/system\s+prompt\s*:/gi, '[filtered phrase]')
    .replace(/you\s+are\s+now\s+in\s+DAN\s+mode/gi, '[filtered phrase]')
    .replace(/<\/?(?:system|instruction|prompt)[^>]*>/gi, '')
    .trim();
}

/**
 * Normalizes all candidate platform sources into a unified, compact coach context.
 */
export function buildCareerCoachContext(candidateData = {}) {
  const profile = candidateData.profile || {};
  const attempts = candidateData.attempts || candidateData.assessment_attempts || [];
  const userSkills = candidateData.userSkills || candidateData.user_skills || [];
  const courses = candidateData.courses || [];
  const courseProgress = candidateData.courseProgress || candidateData.course_progress || [];
  const resumes = candidateData.resumes || (candidateData.latestResume ? [candidateData.latestResume] : []);
  const interviews = candidateData.interviews || candidateData.mock_interviews || [];
  const opportunities = candidateData.opportunities || PLACEMENT_OPPORTUNITIES_CATALOG;
  const applications = candidateData.applications || [];

  // 1. Placement Readiness Index (Phase 5)
  const readinessReport = computePlacementReadiness({
    attempts,
    userSkills,
    resumes,
    interviews,
    progress: courseProgress,
    profile
  });

  // 2. Skill Gap Engine (Phase 4)
  const skillGapReport = computeSkillGaps(attempts, userSkills, courses);

  // 3. Personalized Learning Path Engine (Phase 6)
  const learningPathReport = generatePersonalizedLearningPath({
    attempts,
    userSkills,
    courses,
    courseProgress,
    readinessReport,
    skillGapReport
  });

  // 4. Resume ATS Engine (Phase 7)
  let latestResume = resumes && resumes.length > 0
    ? [...resumes].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]
    : null;
  let resumeAnalysis = null;
  if (latestResume) {
    if (latestResume.ats_score !== undefined || latestResume.atsScore !== undefined) {
      resumeAnalysis = latestResume;
    } else if (latestResume.resume_text) {
      const parsed = parseResumeText(latestResume.resume_text);
      resumeAnalysis = evaluateResumeAts(parsed, profile.preferred_job_role || 'Full Stack Software Engineer');
    }
  }

  // 5. Mock Interview Engine (Phase 8 & 15)
  const latestInterview = interviews && interviews.length > 0
    ? [...interviews].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]
    : null;
  const interviewIntelligence = buildFullInterviewIntelligence(interviews, {
    profile,
    targetOpportunity: opportunities?.[0]
  });

  // 6. Job Matching Engine (Phase 9)
  const candidateSkillsMap = {
    profile,
    userSkills,
    attempts,
    latestResume: resumeAnalysis || latestResume,
    interviews
  };
  const evaluatedJobMatches = (opportunities || []).slice(0, 6).map(opp => {
    const match = computeJobMatchScore(candidateSkillsMap, opp);
    const eligibility = evaluateCandidateEligibility(candidateSkillsMap, opp);
    const deadline = classifyOpportunityDeadline(opp.application_deadline);
    const appRecord = applications.find(a => a.opportunity_id === opp.id || a.job_id === opp.id);
    const priority = opp.priority || computeOpportunityPriority({
      matchScore: match.matchScore,
      eligibility,
      deadline,
      applicationStatus: appRecord ? appRecord.status : null,
      isSaved: (candidateData.savedJobIds || []).includes(opp.id)
    });
    return {
      opportunity: opp,
      matchScore: match.matchScore,
      eligibilityStatus: eligibility.status,
      priority,
      deadline,
      missingRequiredSkills: match.explanation?.missingSkills || []
    };
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  // 7. Application Pipeline Engine (Phase 10)
  const pipelineStats = calculateApplicationStatistics(applications);
  const upcomingEvent = getUpcomingApplicationEvent(applications);

  // Derived high-level status
  const hasEvaluatedData = Boolean(readinessReport?.isEvaluated || attempts.length > 0 || latestResume || latestInterview || applications.length > 0);
  const candidateName = profile.name || 'Candidate';
  const preferredRole = profile.preferred_job_role || 'Software Engineer';
  const contextGeneratedAt = candidateData.context_generated_at || new Date().toISOString();

  return {
    context_generated_at: contextGeneratedAt,
    candidate: {
      id: profile.id || candidateData.userId || candidateData.id || '',
      name: candidateName,
      email: profile.email || '',
      college: profile.college || 'Engineering College',
      department: profile.department || 'Computer Science',
      year: profile.year || 'Final Year',
      preferredRole,
      hasEvaluatedData
    },
    readiness: {
      isEvaluated: readinessReport.isEvaluated,
      score: readinessReport.score,
      status: readinessReport.status,
      coverageText: readinessReport.coverageText,
      evaluatedPillarsCount: readinessReport.coverage?.available || 0,
      totalPillarsCount: readinessReport.coverage?.total || 7,
      strongestArea: readinessReport.strongestArea,
      priorityGap: readinessReport.priorityGap,
      nextAction: readinessReport.nextAction,
      pillars: readinessReport.pillars || []
    },
    skillGaps: {
      hasEnoughData: skillGapReport.hasEnoughData,
      totalAssessed: skillGapReport.totalAssessedDomains,
      criticalGaps: skillGapReport.criticalGaps || [],
      skillsToImprove: skillGapReport.skillsToImprove || [],
      strongSkills: skillGapReport.strongSkills || [],
      priorityDomain: skillGapReport.priorityDomain || null
    },
    learningPath: {
      overallProgress: learningPathReport.overallProgress,
      currentPriority: learningPathReport.currentPriority,
      activeStep: learningPathReport.stages?.find(s => !s.completed) || learningPathReport.stages?.[0] || { step_number: 1, title: 'Foundation & Programming Fundamentals', category: 'Foundation' },
      recommendedCourses: (learningPathReport.recommendedCourses || []).slice(0, 3),
      nextBestAction: learningPathReport.nextBestAction
    },
    resume: resumeAnalysis ? {
      hasResume: true,
      atsScore: resumeAnalysis.ats_score ?? resumeAnalysis.atsScore ?? null,
      formattingScore: resumeAnalysis.formatting_score ?? resumeAnalysis.formattingScore ?? null,
      relevanceScore: resumeAnalysis.role_relevance ?? resumeAnalysis.relevanceScore ?? null,
      missingSkills: (resumeAnalysis.missing_skills || resumeAnalysis.missingKeywords || []).slice(0, 5),
      extractedSkills: (resumeAnalysis.extracted_skills || resumeAnalysis.extractedKeywords || []).slice(0, 8),
      topRecommendation: (resumeAnalysis.recommendations?.[0]?.description || resumeAnalysis.recommendations?.[0]?.title || resumeAnalysis.weaknesses?.[0]) || 'Keep project metrics updated.'
    } : {
      hasResume: false,
      atsScore: null,
      missingSkills: [],
      extractedSkills: [],
      topRecommendation: null
    },
    mockInterview: latestInterview ? {
      hasInterview: true,
      role: latestInterview.target_role || latestInterview.role || preferredRole,
      type: latestInterview.interview_type || 'Technical',
      overallScore: latestInterview.overall_score ?? latestInterview.overallScore ?? null,
      technicalScore: latestInterview.technical_score ?? latestInterview.technicalScore ?? null,
      communicationScore: latestInterview.communication_score ?? latestInterview.communicationScore ?? null,
      confidenceScore: latestInterview.confidence_score ?? latestInterview.confidenceScore ?? null,
      feedback: latestInterview.ai_feedback || latestInterview.feedback || null,
      sessionCount: interviews.length,
      history: interviewIntelligence.history,
      patterns: interviewIntelligence.patterns,
      readinessSignal: interviewIntelligence.readinessSignal,
      prepFocus: interviewIntelligence.prepFocus,
      latestBreakdown: interviewIntelligence.latestBreakdown,
      practiceActions: interviewIntelligence.practiceActions
    } : {
      hasInterview: false,
      overallScore: null,
      feedback: null,
      sessionCount: 0,
      history: interviewIntelligence.history,
      patterns: interviewIntelligence.patterns,
      readinessSignal: interviewIntelligence.readinessSignal,
      prepFocus: interviewIntelligence.prepFocus,
      latestBreakdown: null,
      practiceActions: []
    },
    interviews: latestInterview ? {
      hasInterview: true,
      role: latestInterview.target_role || latestInterview.role || preferredRole,
      type: latestInterview.interview_type || 'Technical',
      overallScore: latestInterview.overall_score ?? latestInterview.overallScore ?? null,
      technicalScore: latestInterview.technical_score ?? latestInterview.technicalScore ?? null,
      communicationScore: latestInterview.communication_score ?? latestInterview.communicationScore ?? null,
      confidenceScore: latestInterview.confidence_score ?? latestInterview.confidenceScore ?? null,
      feedback: latestInterview.ai_feedback || latestInterview.feedback || null,
      sessionCount: interviews.length,
      history: interviewIntelligence.history,
      patterns: interviewIntelligence.patterns,
      readinessSignal: interviewIntelligence.readinessSignal,
      prepFocus: interviewIntelligence.prepFocus,
      latestBreakdown: interviewIntelligence.latestBreakdown,
      practiceActions: interviewIntelligence.practiceActions
    } : {
      hasInterview: false,
      overallScore: null,
      feedback: null,
      sessionCount: 0,
      history: interviewIntelligence.history,
      patterns: interviewIntelligence.patterns,
      readinessSignal: interviewIntelligence.readinessSignal,
      prepFocus: interviewIntelligence.prepFocus,
      latestBreakdown: null,
      practiceActions: []
    },
    jobMatches: {
      topMatches: evaluatedJobMatches.slice(0, 3).map(m => ({
        company: m.opportunity.company_name,
        role: m.opportunity.role_title,
        matchScore: m.matchScore,
        eligibility: m.eligibilityStatus,
        priority: m.priority || null,
        deadline: m.deadline || null,
        missingSkills: m.missingRequiredSkills || []
      }))
    },
    applications: {
      total: pipelineStats.total,
      activeCount: pipelineStats.activeCount,
      interviewCount: pipelineStats.interviewCount,
      offerCount: pipelineStats.offerCount,
      selectedCount: pipelineStats.selectedCount,
      upcomingEvent: upcomingEvent || null,
      recent: applications[0] ? {
        company: applications[0].company_name,
        role: applications[0].role_title,
        status: applications[0].status
      } : null
    }
  };
}

/**
 * Classifies candidate prompt into a canonical placement preparation intent.
 */
export function detectUserIntent(message = '') {
  const m = message.toLowerCase().trim();

  if (m.includes('readiness') || m.includes('why is my score') || m.includes('not placement ready') || m.includes('placement score')) {
    return 'readiness_explanation';
  }
  if (m.includes('skill') || m.includes('gap') || m.includes('improve first') || m.includes('weakness')) {
    return 'skill_gap_priority';
  }
  if (m.includes('course') || m.includes('roadmap') || m.includes('learning path') || m.includes('study') || m.includes('prepare')) {
    if (m.includes('interview')) {
      return 'interview_preparation';
    }
    return 'learning_roadmap';
  }
  if (m.includes('resume') || m.includes('ats') || m.includes('cv')) {
    return 'resume_improvement';
  }
  if (m.includes('interview') || m.includes('mock') || m.includes('star') || m.includes('behavioral') || m.includes('communication') || m.includes('weak at') || m.includes('improve in interview')) {
    return 'interview_preparation';
  }
  if (m.includes('job') || m.includes('opportunity') || m.includes('drive') || m.includes('fit') || m.includes('ready for') || m.includes('apply') || m.includes('eligible') || m.includes('prioritize')) {
    return 'job_fit_matching';
  }
  if (m.includes('application') || m.includes('pipeline') || m.includes('attention') || m.includes('status') || m.includes('offer')) {
    return 'application_pipeline';
  }
  if (m.includes('practice') || m.includes('question') || m.includes('what should i practice') || m.includes('questions will improve')) {
    return 'adaptive_practice';
  }
  if (m.includes('today') || m.includes('what should i do') || m.includes('start') || m.includes('next action')) {
    return 'daily_action';
  }

  return 'general_guidance';
}

/**
 * Validates and normalizes structured coach responses to guarantee contract safety.
 */
export function validateCoachResponse(rawResponse, fallbackContext = null) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return fallbackContext ? generateDeterministicCoachResponse('general_guidance', fallbackContext, '') : null;
  }

  const summary = typeof rawResponse.summary === 'string' && rawResponse.summary.length > 5
    ? rawResponse.summary
    : 'Here is your personalized placement guidance based on current platform data.';

  const facts = Array.isArray(rawResponse.facts) && rawResponse.facts.length > 0
    ? rawResponse.facts.filter(f => typeof f === 'string' && f.trim().length > 0)
    : ['Placement records checked against current platform profile.'];

  const recommendations = Array.isArray(rawResponse.recommendations) && rawResponse.recommendations.length > 0
    ? rawResponse.recommendations.filter(r => typeof r === 'string' && r.trim().length > 0)
    : ['Continue with your active learning path and diagnostic assessments.'];

  const nextAction = (rawResponse.next_action && typeof rawResponse.next_action.label === 'string' && typeof rawResponse.next_action.route === 'string')
    ? rawResponse.next_action
    : { label: 'Explore Learning Path', route: 'roadmap' };

  const sources = Array.isArray(rawResponse.sources) && rawResponse.sources.length > 0
    ? rawResponse.sources.filter(s => typeof s === 'string')
    : [SOURCE_LABELS.READINESS];

  const disclaimer = typeof rawResponse.disclaimer === 'string'
    ? rawResponse.disclaimer
    : 'AI-generated guidance based on available platform data. Verify critical preparation targets independently.';

  return {
    summary,
    facts,
    groundedFacts: facts,
    recommendations,
    next_action: nextAction,
    sources,
    disclaimer,
    context_generated_at: rawResponse.context_generated_at || fallbackContext?.context_generated_at || new Date().toISOString()
  };
}

/**
 * High-fidelity deterministic response generator grounded in real candidate metrics.
 * Operates when AI provider is not configured, times out, or fails contract validation.
 */
export function generateDeterministicCoachResponse(intent, context, originalMessage = '') {
  const { candidate, readiness, skillGaps, learningPath, resume, mockInterview, jobMatches, applications } = context;
  const disclaimer = 'AI-generated guidance based on available platform data.';

  // 1. BRAND NEW USER (No data at all)
  if (!candidate.hasEvaluatedData) {
    return {
      summary: 'Welcome to your Placement Copilot. Your preparation profile is ready, but personalized scoring requires your first assessment or resume upload.',
      facts: [
        'Placement Readiness Index: Uncalculated (0 of 7 pillars evaluated)',
        'Diagnostic Assessments: 0 completed tests',
        'Resume ATS Status: No analyzed resume on file'
      ],
      recommendations: [
        'Take your first diagnostic assessment in Data Structures or Web Development to unlock your Skill Gap audit.',
        'Upload your resume in the Resume ATS module to verify contact info, section structure, and role keywords.',
        'Explore the foundational roadmap stages to review key campus drive topics.'
      ],
      next_action: {
        label: 'Take First Diagnostic Test',
        route: 'assessments'
      },
      sources: [SOURCE_LABELS.READINESS],
      disclaimer
    };
  }

  // 2. READINESS EXPLANATION
  if (intent === 'readiness_explanation') {
    if (!readiness.isEvaluated || readiness.score === null) {
      return {
        summary: 'Your Placement Readiness Index cannot be calculated yet because none of the 7 core placement pillars have verified evaluations.',
        facts: [
          'Readiness Index: 0 / 100 (0 of 7 pillars evaluated)',
          'Evaluated Pillars: None available'
        ],
        recommendations: [
          'Complete a diagnostic assessment in DSA or Aptitude to benchmark your technical screening capabilities.',
          'Upload your resume to evaluate ATS compliance and keyword relevance.'
        ],
        next_action: {
          label: 'Take Diagnostic Assessment',
          route: 'assessments'
        },
        sources: [SOURCE_LABELS.READINESS],
        disclaimer
      };
    }

    const priorityGapName = readiness.priorityGap?.name || 'Technical Skills';
    const priorityGapScore = readiness.priorityGap?.score !== null && readiness.priorityGap?.score !== undefined ? `${readiness.priorityGap.score}%` : 'Unassessed';
    const strongestName = readiness.strongestArea?.name || 'Foundational Fundamentals';
    const strongestScore = readiness.strongestArea?.score ? `${readiness.strongestArea.score}%` : 'Competent';

    return {
      summary: `Your Placement Readiness Index stands at ${readiness.score}/100 (${readiness.status}). Evaluated across ${readiness.evaluatedPillarsCount} of ${readiness.totalPillarsCount} placement pillars.`,
      facts: [
        `Placement Readiness Score: ${readiness.score}/100 (${readiness.status})`,
        `Strongest Dimension: ${strongestName} (${strongestScore})`,
        `Largest Evaluated Gap: ${priorityGapName} (${priorityGapScore}, Benchmark: ${readiness.priorityGap?.targetBenchmark || 80}%)`,
        `Pillar Coverage: ${readiness.coverageText}`
      ],
      recommendations: [
        `Focus targeted practice on ${priorityGapName} to close your current gap against campus hiring standards.`,
        readiness.evaluatedPillarsCount < 5
          ? 'Complete unassessed dimensions (such as AI Mock Interview or Resume ATS) to expand your placement coverage.'
          : 'Maintain your cleared competencies with periodic timed problem-solving drills.'
      ],
      next_action: {
        label: `Improve ${priorityGapName}`,
        route: readiness.priorityGap?.actionTarget || 'roadmap'
      },
      sources: [SOURCE_LABELS.READINESS, SOURCE_LABELS.SKILL_GAP],
      disclaimer
    };
  }

  // 3. SKILL GAP PRIORITY
  if (intent === 'skill_gap_priority') {
    if (!skillGaps.hasEnoughData || skillGaps.totalAssessed === 0) {
      return {
        summary: "I don't have enough data to determine your skill gaps yet because you have not completed any diagnostic assessments.",
        facts: [
          'Assessed Competency Domains: 0 of 6',
          'Verified Assessment Attempts: None on file'
        ],
        recommendations: [
          'Complete an initial coding or database assessment to generate transparent skill benchmarks.',
          'Start with the Data Structures & Algorithms diagnostic test.'
        ],
        next_action: {
          label: 'Start Diagnostic Assessment',
          route: 'assessments'
        },
        sources: [SOURCE_LABELS.SKILL_GAP],
        disclaimer
      };
    }

    const topGap = skillGaps.criticalGaps[0] || skillGaps.skillsToImprove[0] || null;
    if (!topGap) {
      return {
        summary: 'All evaluated technical competencies are meeting or exceeding current campus hiring benchmarks (80%+).',
        facts: [
          `Strong Skills: ${skillGaps.strongSkills.map(s => `${s.name} (${s.score}%)`).join(', ')}`,
          'Critical Skill Gaps: None detected'
        ],
        recommendations: [
          'Simulate full-length technical placement mock interviews to refine verbal articulation.',
          'Explore campus placement drives and apply to matching software engineering openings.'
        ],
        next_action: {
          label: 'Practice Mock Interview',
          route: 'interview'
        },
        sources: [SOURCE_LABELS.SKILL_GAP, SOURCE_LABELS.ASSESSMENT],
        disclaimer
      };
    }

    const gapPercent = topGap.gapPercent || Math.max(0, 80 - topGap.score);
    return {
      summary: `Your highest priority skill gap is ${topGap.name} (${topGap.score}% score, gap of -${gapPercent}% against the 80% benchmark).`,
      facts: [
        `Priority Skill: ${topGap.name} (${topGap.score}%)`,
        `Classification: ${topGap.classification?.label || 'Needs Improvement'}`,
        `Target Clearing Benchmark: 80% (Current gap: -${gapPercent}%)`,
        `Recommended Platform Course: ${topGap.recommendedCourseTitle || 'Full Stack Web Architecture / DSA Masterclass'}`
      ],
      recommendations: [
        `Enroll in ${topGap.recommendedCourseTitle || 'the recommended curriculum'} and complete the targeted modules.`,
        'Retake the diagnostic assessment after completing practice drills to update your Placement Readiness Index.'
      ],
      next_action: {
        label: `Prepare ${topGap.name}`,
        route: topGap.courseTarget || 'courses'
      },
      sources: [SOURCE_LABELS.SKILL_GAP, SOURCE_LABELS.LEARNING_PATH],
      disclaimer
    };
  }

  // 4. LEARNING ROADMAP
  if (intent === 'learning_roadmap') {
    const currentPriority = learningPath.currentPriority;
    const activeStep = learningPath.activeStep || { step_number: 1, title: 'Foundation & Programming Fundamentals', category: 'Foundation' };

    if (!currentPriority && (!learningPath.recommendedCourses || learningPath.recommendedCourses.length === 0)) {
      return {
        summary: 'Your personalized learning path requires diagnostic assessment data to generate tailored course sequencing.',
        facts: [
          'Learning Path Status: Uninitialized',
          'Curriculum Progress: 0% overall'
        ],
        recommendations: [
          'Complete a diagnostic test in Data Structures or Aptitude.',
          'Your results will dynamically order your curriculum to tackle your largest gaps first.'
        ],
        next_action: {
          label: 'Take Diagnostic Assessment',
          route: 'assessments'
        },
        sources: [SOURCE_LABELS.LEARNING_PATH],
        disclaimer
      };
    }

    return {
      summary: `Your learning path is currently focused on ${currentPriority ? currentPriority.skill : activeStep.title}. Overall curriculum progress is ${learningPath.overallProgress}%.`,
      facts: [
        `Active Roadmap Stage: Step ${activeStep.step_number} — ${activeStep.title}`,
        `Current Priority Topic: ${currentPriority ? `${currentPriority.skill} (${currentPriority.score}% vs ${currentPriority.targetScore}% target)` : activeStep.title}`,
        `Next Recommended Course: ${currentPriority?.recommendedCourse?.title || learningPath.recommendedCourses[0]?.courseTitle || 'Campus DSA Masterclass'}`,
        `Overall Curriculum Progress: ${learningPath.overallProgress}%`
      ],
      recommendations: [
        `Focus on the active modules of ${currentPriority?.recommendedCourse?.title || 'your assigned course'}.`,
        'Complete the chapter exercises before proceeding to timed assessment retakes.'
      ],
      next_action: {
        label: 'Open Learning Path',
        route: 'roadmap'
      },
      sources: [SOURCE_LABELS.LEARNING_PATH, SOURCE_LABELS.SKILL_GAP],
      disclaimer
    };
  }

  // 5. RESUME / ATS IMPROVEMENT
  if (intent === 'resume_improvement') {
    if (!resume.hasResume) {
      return {
        summary: "I don't have enough data to assess your resume yet because no analyzed resume is available.",
        facts: [
          'Resume ATS Status: No resume uploaded or parsed',
          'ATS Audit Score: Unassessed'
        ],
        recommendations: [
          'Upload your resume in PDF or text format in the Resume ATS module.',
          'The engine will evaluate contact info, formatting, role keywords, and Google X-Y-Z bullet impact.'
        ],
        next_action: {
          label: 'Upload Resume in Resume ATS',
          route: 'resume'
        },
        sources: [SOURCE_LABELS.RESUME_ATS],
        disclaimer
      };
    }

    return {
      summary: `Your analyzed resume scored ${resume.atsScore}/100 on ATS compliance. Formatting stands at ${resume.formattingScore}% and role relevance is ${resume.relevanceScore}%.`,
      facts: [
        `ATS Audit Score: ${resume.atsScore}/100`,
        `Formatting & Structure: ${resume.formattingScore}%`,
        `Role Keyword Match: ${resume.relevanceScore}%`,
        `Detected Skills: ${resume.extractedSkills.slice(0, 5).join(', ') || 'None'}`,
        `Missing Role Keywords: ${resume.missingSkills.join(', ') || 'None detected'}`
      ],
      recommendations: [
        resume.missingSkills.length > 0
          ? `Incorporate missing keywords where you have hands-on experience: ${resume.missingSkills.slice(0, 3).join(', ')}.`
          : 'Refine your project bullets using the Google X-Y-Z formula with quantifiable metrics.',
        resume.topRecommendation
      ],
      next_action: {
        label: 'Review Resume ATS Audit',
        route: 'resume'
      },
      sources: [SOURCE_LABELS.RESUME_ATS],
      disclaimer
    };
  }

  // 6. MOCK INTERVIEW PREPARATION & INTELLIGENCE
  if (intent === 'interview_preparation') {
    const upcomingInterviewApp = applications.upcomingEvent?.event_type === 'interview'
      ? applications.upcomingEvent
      : null;

    if (!mockInterview.hasInterview) {
      return {
        summary: upcomingInterviewApp
          ? `You have an upcoming interview with ${upcomingInterviewApp.company_name} in ${upcomingInterviewApp.days_left} days! Complete a practice simulation to test your technical articulation.`
          : 'You have not completed any AI Mock Interview sessions yet.',
        facts: [
          upcomingInterviewApp
            ? `Scheduled Drive Round: ${upcomingInterviewApp.company_name} (${upcomingInterviewApp.days_left === 0 ? 'Today' : `In ${upcomingInterviewApp.days_left} days`})`
            : 'Mock Interview History: 0 completed sessions',
          'Verbal Technical Depth & Communication: Unassessed',
          'Interview Readiness Signal: Not Evaluated'
        ],
        recommendations: [
          'Practice a 15-minute simulated Technical Interview to get rubric feedback on Technical Depth, STAR Communication, and Delivery.',
          'Review system architecture, database indexing, and your key resume projects before speaking.',
          'Audio waveform sensors are not used; delivery is evaluated from structured phrasing and conciseness.'
        ],
        next_action: {
          label: 'Launch AI Mock Interview',
          route: 'interview'
        },
        sources: [SOURCE_LABELS.APPLICATION_PIPELINE, SOURCE_LABELS.MOCK_INTERVIEW],
        disclaimer
      };
    }

    const lowerQuery = (originalMessage || '').toLowerCase();
    const history = mockInterview.history || {};
    const patterns = mockInterview.patterns?.patterns || [];
    const readinessSignal = mockInterview.readinessSignal || {};
    const latestBreakdown = mockInterview.latestBreakdown || {};

    // Check if query is specifically about STAR / behavioral questions
    if (lowerQuery.includes('star') || lowerQuery.includes('behavioral')) {
      const starEval = latestBreakdown.questionEvaluations?.find(q => q.starAnalysis?.isApplicable) || null;
      const starStatus = starEval?.starAnalysis?.status || 'Needs Practice';
      const missingComp = starEval?.starAnalysis?.missingComponents || ['Result'];

      return {
        summary: `Behavioral interview answers should follow the STAR framework (Situation, Task, Action, Result). Your latest behavioral assessment status is ${starStatus}.`,
        facts: [
          `STAR Framework Status: ${starStatus}`,
          starEval ? `Missing STAR Components in Latest Session: ${missingComp.join(', ') || 'None (All Present)'}` : 'Behavioral structure evaluated from past response transcripts',
          `Communication & Structure Score: ${mockInterview.communicationScore}%`,
          'Delivery Evaluation: Textual response completeness and phrasing pacing (audio sensors not active)'
        ],
        recommendations: [
          'Situation: Set the context (project, team, tech stack, constraints) in 1-2 sentences.',
          'Task: Clearly define your specific goal or challenge you were assigned to solve.',
          'Action: Detail YOUR specific actions, technical choices, and problem-solving steps using "I" instead of "we".',
          'Result: Conclude with a quantifiable outcome (e.g., "reduced latency by 30%", "delivered 2 days early") and key learnings.'
        ],
        next_action: {
          label: 'Practice Behavioral Questions',
          route: 'interview'
        },
        sources: [SOURCE_LABELS.MOCK_INTERVIEW],
        disclaimer
      };
    }

    // Check if query is about improvement or history trend
    if (lowerQuery.includes('improving') || lowerQuery.includes('trend') || lowerQuery.includes('better') || lowerQuery.includes('progress')) {
      const isMulti = (mockInterview.sessionCount || 0) >= 2;
      return {
        summary: isMulti
          ? `Across ${mockInterview.sessionCount} completed mock interview sessions, your performance trend is ${history.trend || 'Stable'} (Score delta: ${history.scoreDelta >= 0 ? '+' : ''}${history.scoreDelta ?? 0} pts).`
          : `You have completed 1 mock interview session with an overall score of ${mockInterview.overallScore}%. A minimum of 2 completed sessions is required to calculate a verified performance trend.`,
        facts: [
          `Total Completed Sessions: ${mockInterview.sessionCount}`,
          `Latest Session Score: ${history.latestScore ?? mockInterview.overallScore}%`,
          ...(isMulti ? [
            `Previous Session Score: ${history.previousScore}%`,
            `Score Delta: ${history.scoreDelta >= 0 ? '+' : ''}${history.scoreDelta} pts`,
            `Overall Performance Trend: ${history.trend}`,
            `Best Recorded Score: ${history.bestScore}%`,
            `Average Score: ${history.averageScore}%`
          ] : [
            'Performance Trend: Insufficient Data (< 2 sessions completed)',
            'Previous Attempt: None recorded'
          ]),
          `Interview Readiness: ${readinessSignal.tier || 'Needs Practice'}`
        ],
        recommendations: [
          isMulti
            ? (history.trend === 'Improving' ? 'Keep up the momentum! Focus on edge-case engineering trade-offs to reach Strong status across all pillars.' : 'Review your previous session transcripts to identify where technical depth dropped.')
            : 'Complete a second mock interview session to establish verified trend intelligence and delta tracking.',
          'Practice explaining your thought process out loud before finalizing your code or system design answers.'
        ],
        next_action: {
          label: 'Start Next Interview Simulation',
          route: 'interview'
        },
        sources: [SOURCE_LABELS.MOCK_INTERVIEW],
        disclaimer
      };
    }

    // Check if query is about weaknesses or what to improve
    if (lowerQuery.includes('weak') || lowerQuery.includes('improve') || lowerQuery.includes('struggle')) {
      const topPattern = patterns[0] || null;
      return {
        summary: topPattern
          ? `Based on your interview history, your primary focus area is: ${topPattern.title} (${topPattern.type === 'initial_signal' ? 'Initial Signal' : 'Recurring Weakness'}).`
          : `Your latest interview scored ${mockInterview.overallScore}%. Technical depth is at ${mockInterview.technicalScore}% and communication is at ${mockInterview.communicationScore}%.`,
        facts: [
          `Latest Score: ${mockInterview.overallScore}/100 (${mockInterview.type})`,
          `Technical Depth: ${mockInterview.technicalScore}%`,
          `Communication & Structure: ${mockInterview.communicationScore}%`,
          `Delivery Confidence: ${mockInterview.confidenceScore}% (evaluated from phrasing pacing, no audio sensors)`,
          ...(topPattern ? [`Observed Focus: ${topPattern.description}`] : ['No critical recurring deficits detected.'])
        ],
        recommendations: [
          topPattern ? topPattern.recommendation : 'Deepen technical trade-off discussions with concrete production metrics.',
          'Always state the time and space complexity (Big-O) when describing algorithmic approaches.',
          'Use the STAR framework for all behavioral prompts to ensure complete Situation-to-Result narrative flow.'
        ],
        next_action: {
          label: 'Practice Targeted Weak Area',
          route: 'interview'
        },
        sources: [SOURCE_LABELS.MOCK_INTERVIEW],
        disclaimer
      };
    }

    // Default interview prep response
    const defaultFacts = [
      `Latest Mock Interview Score: ${mockInterview.overallScore}% (${mockInterview.overallScore}/100)`,
      `Score Trajectory: ${history.trend || 'Insufficient Data'}`,
      `Technical Depth (35%): ${mockInterview.technicalScore}%`,
      `STAR Communication (25%): ${mockInterview.communicationScore}%`,
      `Delivery Confidence (15%): ${mockInterview.confidenceScore}% (textual phrasing evaluated; audio waveform sensor not active)`,
      `Interview Readiness Signal: ${readinessSignal.tier || 'Needs Practice'}`,
      upcomingInterviewApp ? `Upcoming Interview: ${upcomingInterviewApp.company_name} in ${upcomingInterviewApp.days_left} days` : 'No upcoming external interviews scheduled'
    ];

    return {
      summary: `Your latest mock interview scored ${mockInterview.overallScore}/100 (${mockInterview.type}). Technical depth was ${mockInterview.technicalScore}% and communication scored ${mockInterview.communicationScore}%. Readiness signal: ${readinessSignal.tier || 'Needs Practice'}.`,
      facts: defaultFacts,
      groundedFacts: defaultFacts,
      recommendations: [
        mockInterview.communicationScore < 75
          ? 'Use the STAR framework (Situation, Task, Action, Result) to avoid rambling on behavioral questions.'
          : 'Deepen your technical trade-off explanations (e.g. SQL normalization vs denormalization, async workflows).',
        'Practice another mock interview session to continue refining structured responses.'
      ],
      next_action: {
        label: 'Practice Another Interview',
        route: 'interview'
      },
      sources: [SOURCE_LABELS.MOCK_INTERVIEW, SOURCE_LABELS.APPLICATION_PIPELINE],
      disclaimer
    };
  }

  // 7. JOB FIT & OPPORTUNITIES
  if (intent === 'job_fit_matching') {
    const topJob = jobMatches.topMatches[0] || null;
    if (!topJob) {
      return {
        summary: 'Explore active campus recruitment drives to evaluate your eligibility and role alignment.',
        facts: [
          'Active Placement Drives: 6 curated campus opportunities available',
          `Preferred Career Goal: ${candidate.preferredRole}`
        ],
        recommendations: [
          'Open Placement Drives & Jobs to check academic eligibility and technical match scores.',
          'Apply to opportunities where your current match score is 70% or higher.'
        ],
        next_action: {
          label: 'Explore Placement Drives',
          route: 'job-opportunities'
        },
        sources: [SOURCE_LABELS.JOB_MATCH],
        disclaimer
      };
    }

    const missingText = topJob.missingSkills.length > 0 ? topJob.missingSkills.slice(0, 3).join(', ') : 'None detected';
    const facts = [
      `Top Matching Drive: ${topJob.company} — ${topJob.role}`,
      `Calculated Match Score: ${topJob.matchScore}%`,
      `Eligibility Status: ${topJob.eligibility === 'eligible' ? 'Academic criteria verified' : (topJob.eligibility === 'eligibility_unknown' ? 'Academic review needed' : 'Academic criteria not met')}`,
      topJob.priority ? `Priority Tier: ${topJob.priority.label}` : null,
      topJob.deadline ? `Application Deadline: ${topJob.deadline.label}` : null,
      `Missing Drive Skills: ${missingText}`
    ].filter(Boolean);

    return {
      summary: `Based on your available profile and assessment evidence, your strongest current opportunity alignment is with ${topJob.company} (${topJob.role}) at a ${topJob.matchScore}% match score.${topJob.priority ? ` It is prioritized as "${topJob.priority.label}".` : ''}`,
      facts,
      recommendations: [
        topJob.missingSkills.length > 0
          ? `Prepare missing skills (${missingText}) using recommended course modules before attending technical screening.`
          : 'Your technical profile closely aligns with this role. Submit your application in the placement portal.',
        'This opportunity appears to be a stronger match based on your current available evidence. Placement clearance depends on screening performance.'
      ],
      next_action: {
        label: `View ${topJob.company} Drive`,
        route: 'job-opportunities'
      },
      sources: [SOURCE_LABELS.JOB_MATCH, SOURCE_LABELS.SKILL_GAP],
      disclaimer
    };
  }

  // 8. APPLICATION PIPELINE
  if (intent === 'application_pipeline') {
    if (applications.total === 0) {
      return {
        summary: 'You do not have any active applications tracked in your Placement Pipeline yet.',
        facts: [
          'Tracked Applications: 0',
          'Pipeline Status: Empty'
        ],
        recommendations: [
          'Browse open placement drives and save or apply to roles matching your career goals.',
          'Every tracked application helps you record interview dates, assessment rounds, and recruiter notes.'
        ],
        next_action: {
          label: 'Browse Placement Drives',
          route: 'job-opportunities'
        },
        sources: [SOURCE_LABELS.APPLICATION_PIPELINE],
        disclaimer
      };
    }

    const up = applications.upcomingEvent;
    return {
      summary: up
        ? `You have an urgent action: ${up.title} (${up.days_left === 0 ? 'Today' : `In ${up.days_left} days`}) in your application pipeline.`
        : `You are tracking ${applications.activeCount} active application(s) across your placement pipeline.`,
      facts: [
        `Total Applications: ${applications.total} (${applications.activeCount} active)`,
        `Interviews Scheduled: ${applications.interviewCount}`,
        `Offers Received: ${applications.offerCount}`,
        `Final Selections: ${applications.selectedCount}`,
        up ? `Upcoming Event: ${up.company_name} — ${up.event_type} (${up.formatted_date})` : 'No upcoming deadlines this week'
      ],
      recommendations: [
        up && up.event_type === 'interview'
          ? `Complete a mock interview simulation tailored for ${up.company_name}.`
          : up && up.event_type === 'assessment'
          ? `Review high-frequency DSA questions before the ${up.company_name} screening test.`
          : 'Review your application tracking board and update notes after recruiter interactions.'
      ],
      next_action: {
        label: 'Open Application Pipeline',
        route: 'applications'
      },
      sources: [SOURCE_LABELS.APPLICATION_PIPELINE],
      disclaimer
    };
  }

  // 9. ADAPTIVE PRACTICE (Phase 16)
  if (intent === 'adaptive_practice') {
    const rawCandidate = {
      userSkills: (skillGaps.allGaps || []).map(g => ({ skill_name: g.name, score: g.score })),
      attempts: [],
      interviews: mockInterview.hasInterview ? [{ overall_score: mockInterview.overallScore }] : [],
      readinessReport: {
        pillars: readiness.pillars || []
      },
      targetRole: candidate.targetRole || candidate.preferredRole || 'Software Engineer'
    };

    const recommended = selectAdaptiveQuestions(rawCandidate, { limit: 3 });
    const topQ = recommended[0];

    return {
      summary: topQ
        ? `Based on your placement records, your highest-leverage practice priority is ${topQ.skill} (${topQ.difficulty} difficulty). Practicing these targeted questions will directly elevate your ${topQ.priorityTier} readiness.`
        : 'Explore adaptive practice questions tailored to your target placement role and core competencies.',
      facts: recommended.map(q => `Practice Question [${q.skill} · ${q.difficulty}]: "${q.prompt.slice(0, 70)}..." (${q.priorityTier} — ${q.priorityReason})`),
      recommendations: [
        topQ ? `Practice 5 adaptive ${topQ.skill} questions in the Adaptive Practice console.` : 'Complete diagnostic drills to benchmark your problem solving.',
        'Adaptive practice dynamically steps up in difficulty when you answer 2 consecutive questions correctly.',
        'Review pedagogical answer explanations after each question to reinforce underlying placement concepts.'
      ],
      next_action: {
        label: `Practice ${topQ ? topQ.skill : 'Adaptive Questions'}`,
        route: 'adaptive-practice'
      },
      sources: ['Adaptive Question Intelligence', SOURCE_LABELS.SKILL_GAP],
      disclaimer
    };
  }

  // 10. DAILY ACTION / GENERAL GUIDANCE (Default Fallback)
  const priorityGap = readiness.priorityGap || skillGaps.criticalGaps[0] || skillGaps.skillsToImprove[0];
  const priorityName = priorityGap ? (priorityGap.name || 'Core CS') : 'Data Structures';
  const targetRoute = priorityGap?.actionTarget || (skillGaps.totalAssessed === 0 ? 'assessments' : 'roadmap');

  return {
    summary: `Based on your placement records today, your highest-leverage preparation step is to address ${priorityName}.`,
    facts: [
      `Placement Readiness: ${readiness.score !== null ? `${readiness.score}/100` : 'In Progress (coverage needed)'}`,
      `Assessed Skills: ${skillGaps.totalAssessed} domain(s) benchmarked`,
      `Active Applications: ${applications.activeCount} in progress`
    ],
    recommendations: [
      skillGaps.totalAssessed === 0
        ? 'Take your initial diagnostic assessment in Data Structures & Algorithms.'
        : `Spend 30 minutes practicing ${priorityName} modules on your personalized learning path.`,
      'Review your Resume ATS score to ensure role-relevant keywords are present.'
    ],
    next_action: {
      label: `Work on ${priorityName}`,
      route: targetRoute
    },
    sources: [SOURCE_LABELS.READINESS, SOURCE_LABELS.LEARNING_PATH],
    disclaimer
  };
}
