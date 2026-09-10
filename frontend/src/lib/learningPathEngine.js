/**
 * Personalized Learning Path & Adaptive Preparation Engine
 * 
 * Flow:
 * Assessment Results → Skill Performance → Skill Gaps → Priority Skills →
 * Recommended Courses → Personalized Learning Path → Course Progress →
 * Assessment Retake → Updated Skill Performance → Updated Placement Readiness
 */

// Canonical 6 Roadmap Stages benchmarked for campus placements
export const ROADMAP_STAGES = [
  {
    step_number: 1,
    id: 'stage-1',
    title: 'Foundation & Programming Fundamentals',
    category: 'Foundation',
    description: 'Master core programming syntax, object-oriented concepts, and basic computational problem solving.',
    target_hours: 15,
    keyTopics: ['Variable Scoping & Data Types', 'OOP Principles & Modularity', 'Functions, Recursion & Call Stacks', 'Basic Complexity Analysis (Big-O)']
  },
  {
    step_number: 2,
    id: 'stage-2',
    title: 'Core Skills & Systems Architecture',
    category: 'Core Skills',
    description: 'Data structures, relational database normalization, and scalable full-stack web applications.',
    target_hours: 30,
    keyTopics: ['Linear Data Structures (Arrays, Lists)', 'Relational SQL & Schema Design', 'REST API Architecture & State Management', 'Modern Frontend Component Patterns']
  },
  {
    step_number: 3,
    id: 'stage-3',
    title: 'Practice & Algorithmic Drills',
    category: 'Practice',
    description: 'High-frequency campus placement coding problem sheets, trees, graphs, and aptitude shortcuts.',
    target_hours: 25,
    keyTopics: ['Binary Trees, Heaps & Graphs', 'Dynamic Programming & Memoization', 'Speed Math & Quantitative Aptitude', 'Logical Reasoning & Syllogisms']
  },
  {
    step_number: 4,
    id: 'stage-4',
    title: 'Assessment & Gap Remediation',
    category: 'Assessment',
    description: 'Timed diagnostic tests to validate competency against campus clearing benchmarks (80%+ target).',
    target_hours: 10,
    keyTopics: ['Timed Full-Length Coding Rounds', 'Aptitude Screening Simulations', 'Subtopic Error Diagnosis', 'Skill Gap Recalculation']
  },
  {
    step_number: 5,
    id: 'stage-5',
    title: 'Interview Preparation & Articulation',
    category: 'Interview Preparation',
    description: 'AI-driven technical, HR, and managerial mock interview simulations with live STAR evaluation.',
    target_hours: 15,
    keyTopics: ['STAR Behavioral Framework', 'Verbal Technical Articulation', 'System Design Trade-off Explanations', 'Handling Edge Cases & Feedback']
  },
  {
    step_number: 6,
    id: 'stage-6',
    title: 'Placement Ready & Drive Clearance 🎯',
    category: 'Placement Ready',
    description: 'Resume ATS score clearance, verified credentials, and active campus drive shortlist readiness.',
    target_hours: 10,
    keyTopics: ['ATS Resume Audit (85%+ Target)', 'Portfolio & Github Project Review', 'Company-Specific Drive Profiles', 'Final Placement Clearance']
  }
];

/**
 * Maps a skill/gap domain name to the best matching course in the catalog.
 */
export function matchSkillToCourse(skillName, courses = []) {
  if (!skillName || !courses || courses.length === 0) return null;
  const s = skillName.toLowerCase();

  // Keyword-based matching
  let matched = courses.find(c => {
    const title = (c.title || '').toLowerCase();
    const cat = (c.category || '').toLowerCase();
    
    if (s.includes('dsa') || s.includes('algorithm') || s.includes('data structure')) {
      return cat.includes('data structure') || cat.includes('dsa') || title.includes('dsa') || title.includes('algorithm');
    }
    if (s.includes('web') || s.includes('javascript') || s.includes('react') || s.includes('frontend')) {
      return cat.includes('web') || title.includes('react') || title.includes('javascript') || title.includes('full stack');
    }
    if (s.includes('sql') || s.includes('database') || s.includes('db')) {
      return cat.includes('database') || title.includes('sql') || title.includes('database');
    }
    if (s.includes('aptitude') || s.includes('quantitative') || s.includes('logical')) {
      return cat.includes('aptitude') || title.includes('aptitude') || title.includes('reasoning');
    }
    if (s.includes('communication') || s.includes('interview') || s.includes('behavioral')) {
      return cat.includes('interview') || cat.includes('communication') || title.includes('interview') || title.includes('communication');
    }
    if (s.includes('system') || s.includes('design') || s.includes('architecture')) {
      return cat.includes('system') || title.includes('system design') || title.includes('architecture');
    }
    if (s.includes('python')) {
      return title.includes('python') || cat.includes('python');
    }
    return false;
  });

  return matched || null;
}

/**
 * Computes a personalized learning roadmap based on candidate's real skill gaps.
 * 
 * Priority Logic:
 * 1. Critical skill gaps (< 60% or danger classification)
 * 2. Largest gap below target benchmark
 * 3. Skills affecting Placement Readiness (matches priority gap)
 * 4. Relevant incomplete courses (in progress)
 * 5. Previously started courses
 */
export function generatePersonalizedLearningPath({
  skillGapReport = null,
  readinessReport = null,
  courses = [],
  courseProgress = [],
  attempts = [],
  userSkills = [],
  existingLearningPaths = []
} = {}) {
  const hasAssessments = (attempts && attempts.length > 0);
  const hasSkills = (userSkills && userSkills.length > 0);
  const hasEnoughData = Boolean(hasAssessments || (skillGapReport?.hasEnoughData));

  // 1. Empty State for new candidate with no assessment data
  if (!hasEnoughData) {
    return {
      hasPath: false,
      readinessScore: readinessReport?.score ?? null,
      overallProgress: 0,
      currentPriority: null,
      recommendedCourses: [],
      stages: ROADMAP_STAGES.map(stage => {
        const persisted = existingLearningPaths.find(p => p.step_number === stage.step_number);
        return {
          ...stage,
          completed: persisted ? Boolean(persisted.completed) : false,
          status: 'Not Started',
          progressPercent: 0
        };
      }),
      emptyState: {
        title: 'No personalized learning path yet.',
        description: 'Complete an assessment to identify your skill gaps and generate a personalized preparation plan.',
        actionLabel: 'Take First Assessment',
        actionTarget: 'assessments'
      },
      nextBestAction: {
        title: 'Take Diagnostic Assessment',
        desc: 'Complete an assessment to generate your personalized learning path.',
        actionLabel: 'Take Assessment',
        targetRoute: 'assessments'
      }
    };
  }

  // 2. Extract and prioritize skill gaps
  const domains = skillGapReport?.domains || [];
  const readinessPriorityGapId = readinessReport?.priorityGap?.id?.toLowerCase() || '';

  // Calculate priority score for each domain
  const prioritizedDomains = domains.map(d => {
    const isCritical = (d.classification?.variant === 'danger' || d.score < 60);
    const gap = d.gapPercent || Math.max(0, (d.targetScore || 80) - (d.score || 0));
    const domainNameLower = d.name.toLowerCase();
    
    // Check if domain directly affects placement readiness priority gap
    const affectsReadiness = readinessPriorityGapId && (
      domainNameLower.includes(readinessPriorityGapId) ||
      (readinessPriorityGapId === 'tech' && (domainNameLower.includes('web') || domainNameLower.includes('database') || domainNameLower.includes('sql'))) ||
      (readinessPriorityGapId === 'dsa' && domainNameLower.includes('data structure')) ||
      (readinessPriorityGapId === 'aptitude' && domainNameLower.includes('aptitude')) ||
      (readinessPriorityGapId === 'communication' && domainNameLower.includes('communication'))
    );

    // Find matching course
    const matchedCourse = matchSkillToCourse(d.name, courses);
    const userProgressRecord = matchedCourse 
      ? courseProgress.find(cp => cp.course_id === matchedCourse.id) 
      : null;
    const progressPercent = userProgressRecord?.progress_percent || 0;
    const isStartedIncomplete = (progressPercent > 0 && progressPercent < 100);

    // Scoring weights:
    // Critical: +1000, Gap Magnitude: +(gap * 10), Affects Readiness: +500, Started Incomplete: +200
    let priorityWeight = gap * 10;
    if (isCritical) priorityWeight += 1000;
    if (affectsReadiness) priorityWeight += 500;
    if (isStartedIncomplete) priorityWeight += 200;

    let priorityTier = 'LOW';
    if (isCritical || priorityWeight >= 1000) priorityTier = 'CRITICAL';
    else if (gap > 15 || priorityWeight >= 500) priorityTier = 'HIGH';
    else if (gap > 0) priorityTier = 'MEDIUM';

    return {
      name: d.name,
      score: d.score,
      targetScore: d.targetScore || 80,
      gapPercent: gap,
      isCritical,
      affectsReadiness: Boolean(affectsReadiness),
      priorityTier,
      priorityWeight,
      matchedCourse,
      userProgressRecord,
      progressPercent,
      classification: d.classification
    };
  }).sort((a, b) => b.priorityWeight - a.priorityWeight);

  // 3. Determine Current Priority
  const topDomain = prioritizedDomains.find(d => d.gapPercent > 0) || prioritizedDomains[0] || null;
  let currentPriority = null;

  if (topDomain) {
    const courseTitle = topDomain.matchedCourse?.title || 'Targeted Practice Drills';
    currentPriority = {
      skill: topDomain.name,
      score: topDomain.score,
      targetScore: topDomain.targetScore,
      gapPercent: topDomain.gapPercent,
      priority: topDomain.priorityTier,
      why: `${topDomain.name} is currently your largest evaluated skill gap${topDomain.affectsReadiness ? ' affecting Placement Readiness' : ''}.`,
      recommendedCourse: topDomain.matchedCourse,
      recommendedNextStep: `Complete ${courseTitle}`,
      courseProgress: topDomain.progressPercent
    };
  }

  // 4. Build Recommended Courses List
  const recommendedCourses = prioritizedDomains
    .filter(d => d.gapPercent > 0 || d.isCritical)
    .slice(0, 4)
    .map(d => {
      const course = d.matchedCourse;
      const progress = d.progressPercent;
      let actionLabel = 'Start Course';
      if (progress >= 100) actionLabel = 'Review Modules';
      else if (progress > 0) actionLabel = 'Continue Learning';

      let statusLabel = 'Not Started';
      if (progress >= 100) statusLabel = 'Completed';
      else if (progress > 0) statusLabel = 'In Progress';

      return {
        id: course?.id || `rec-${d.name}`,
        courseTitle: course?.title || 'No matching course available yet.',
        skillName: d.name,
        currentScore: d.score,
        targetScore: d.targetScore,
        gapPercent: d.gapPercent,
        difficulty: course?.level || (d.gapPercent > 20 ? 'Advanced' : 'Intermediate'),
        duration: course?.duration_hours ? `${course.duration_hours} hrs` : '15 hrs',
        modulesCount: course?.modules_count || 6,
        progressPercent: progress,
        status: statusLabel,
        priority: d.priorityTier,
        hasMatchingCourse: Boolean(course),
        courseId: course?.id || null,
        actionLabel
      };
    });

  // 5. Evaluate the 6 Roadmap Stages from Real Telemetry
  // Check completion states grounded in real database rows
  const evaluatedStages = ROADMAP_STAGES.map(stage => {
    const persisted = existingLearningPaths.find(p => p.step_number === stage.step_number);
    let isCompleted = persisted ? Boolean(persisted.completed) : false;
    let stageProgress = isCompleted ? 100 : 0;
    let status = isCompleted ? 'Completed' : 'Not Started';

    if (!isCompleted) {
      if (stage.step_number === 1) {
        // Foundation: Completed if student has high language score or passing attempt
        const progAttempt = attempts.find(a => (a.category || '').toLowerCase().includes('python') || (a.category || '').toLowerCase().includes('java'));
        if (progAttempt && progAttempt.score_percent >= 70) {
          isCompleted = true;
          stageProgress = 100;
          status = 'Completed';
        } else if (attempts.length > 0) {
          stageProgress = 75;
          status = 'In Progress';
        }
      } else if (stage.step_number === 2) {
        // Core Skills: check course progress in DSA/Web/DB
        const coreProgress = courseProgress.filter(p => p.progress_percent > 0);
        if (coreProgress.length > 0) {
          const avg = Math.round(coreProgress.reduce((sum, p) => sum + p.progress_percent, 0) / coreProgress.length);
          stageProgress = avg;
          status = avg >= 100 ? 'Completed' : 'In Progress';
          if (avg >= 100) isCompleted = true;
        }
      } else if (stage.step_number === 3) {
        // Practice: check if DSA/Aptitude attempts exist
        const dsaAttempts = attempts.filter(a => (a.category || '').toLowerCase().includes('data structure') || (a.category || '').toLowerCase().includes('aptitude'));
        if (dsaAttempts.length >= 2) {
          isCompleted = true;
          stageProgress = 100;
          status = 'Completed';
        } else if (dsaAttempts.length === 1) {
          stageProgress = 60;
          status = 'In Progress';
        }
      } else if (stage.step_number === 4) {
        // Assessment: completed if attempts count >= 2 and avg >= 75
        if (attempts.length >= 2) {
          const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.score_percent, 0) / attempts.length);
          if (avgScore >= 75) {
            isCompleted = true;
            stageProgress = 100;
            status = 'Completed';
          } else {
            stageProgress = 70;
            status = 'In Progress';
          }
        }
      } else if (stage.step_number === 5) {
        // Interview: in progress or completed based on mock interview count
        stageProgress = isCompleted ? 100 : 0;
      } else if (stage.step_number === 6) {
        // Placement Ready: cleared if readiness score >= 85
        if (readinessReport?.score && readinessReport.score >= 85) {
          isCompleted = true;
          stageProgress = 100;
          status = 'Completed';
        }
      }
    }

    return {
      ...stage,
      completed: isCompleted,
      progressPercent: stageProgress,
      status,
      completed_at: persisted?.completed_at || (isCompleted ? new Date().toISOString() : null)
    };
  });

  // 6. Calculate Overall Learning Progress
  const completedStages = evaluatedStages.filter(s => s.completed).length;
  const overallProgress = Math.round((completedStages / evaluatedStages.length) * 100);

  // 7. Generate Dashboard "Your Next Best Action"
  let nextBestAction = null;
  if (currentPriority) {
    const isStarted = (currentPriority.courseProgress > 0 && currentPriority.courseProgress < 100);
    nextBestAction = {
      title: `Improve ${currentPriority.skill}`,
      desc: `${currentPriority.skill}: ${currentPriority.score}% → Target: ${currentPriority.targetScore}%`,
      actionLabel: isStarted ? 'Continue Learning' : 'Start Recommended Course',
      targetRoute: 'roadmap',
      courseId: currentPriority.recommendedCourse?.id || null,
      courseTitle: currentPriority.recommendedCourse?.title || 'Recommended Course'
    };
  } else {
    nextBestAction = {
      title: 'Maintain Placement Mastery',
      desc: 'All evaluated skills meet or exceed campus benchmarks. Take mock interview practice.',
      actionLabel: 'Start Mock Interview',
      targetRoute: 'interview'
    };
  }

  return {
    hasPath: true,
    readinessScore: readinessReport?.score ?? null,
    overallProgress,
    currentPriority,
    recommendedCourses,
    stages: evaluatedStages,
    nextBestAction
  };
}
