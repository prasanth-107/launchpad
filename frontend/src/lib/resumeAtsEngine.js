/**
 * resumeAtsEngine.js
 * -----------------------------------------------------------------------------
 * Modern Placement Launchpad - Deterministic ATS Scoring & Resume Parsing Engine
 *
 * Core Principles:
 * 1. Zero Fabricated Scores: All scores are derived from measurable text characteristics.
 * 2. Explainable 100-Point Breakdown:
 *    - Contact Info (10 pts)
 *    - Structure & Readability (20 pts)
 *    - Section Completeness (10 pts)
 *    - Technical Skills & Tools (20 pts)
 *    - Role Keyword Relevance (20 pts)
 *    - Action Verbs & Measurable Metrics (10 pts)
 *    - Education Details (10 pts)
 * 3. Verified Distinction: Skills are marked 'source: resume_detected' (not 'verified').
 * 4. Fresher Safety: Absence of work experience is not treated as an error.
 * 5. Full Offline/Companion Support: Operates reliably without external API dependencies.
 * -----------------------------------------------------------------------------
 */

// Canonical Placement Roles & Skill Catalogs
export const ROLE_CATALOG = {
  'Full Stack Software Engineer': {
    required: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'REST'],
    recommended: ['TypeScript', 'FastAPI', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'DSA', 'CI/CD'],
    category: 'Software Engineering'
  },
  'Frontend Developer': {
    required: ['HTML', 'CSS', 'JavaScript', 'React', 'Git', 'Responsive Design'],
    recommended: ['TypeScript', 'Tailwind CSS', 'Next.js', 'Redux', 'Unit Testing', 'REST', 'Figma'],
    category: 'Frontend Engineering'
  },
  'Backend Developer': {
    required: ['Python', 'Java', 'SQL', 'PostgreSQL', 'REST', 'Git', 'Data Structures'],
    recommended: ['FastAPI', 'Spring Boot', 'Docker', 'Redis', 'Microservices', 'System Design', 'Linux'],
    category: 'Backend Engineering'
  },
  'Data Engineer': {
    required: ['Python', 'SQL', 'PostgreSQL', 'Data Warehousing', 'ETL', 'Git'],
    recommended: ['Spark', 'Pandas', 'MongoDB', 'Docker', 'Airflow', 'BigQuery', 'Linux'],
    category: 'Data & Analytics'
  },
  'DevOps / Cloud Engineer': {
    required: ['Linux', 'Git', 'Docker', 'AWS', 'CI/CD', 'Bash'],
    recommended: ['Kubernetes', 'Terraform', 'Python', 'Monitoring', 'Nginx', 'GCP', 'Ansible'],
    category: 'Infrastructure'
  },
  'AI / ML Engineer': {
    required: ['Python', 'Machine Learning', 'NumPy', 'Pandas', 'SQL', 'Git'],
    recommended: ['TensorFlow', 'PyTorch', 'Scikit-Learn', 'FastAPI', 'NLP', 'Computer Vision', 'Docker'],
    category: 'AI & Data Science'
  }
};

// Skill Taxonomies for Extraction
const TECHNICAL_TAXONOMY = {
  languages: [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'C', 'Go', 'Golang',
    'Rust', 'Ruby', 'PHP', 'SQL', 'HTML', 'CSS', 'Bash', 'Shell', 'Kotlin', 'Swift', 'R'
  ],
  frameworks: [
    'React', 'Node.js', 'Express', 'Next.js', 'Vue', 'Angular', 'FastAPI', 'Django',
    'Flask', 'Spring Boot', 'ASP.NET', 'Tailwind CSS', 'Bootstrap', 'Redux', 'jQuery',
    'GraphQL', 'REST', 'RESTful APIs', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-Learn'
  ],
  databases: [
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'Cassandra',
    'DynamoDB', 'Firebase', 'Supabase', 'Elasticsearch', 'SQL Server', 'Neo4j'
  ],
  tools: [
    'Git', 'GitHub', 'GitLab', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'Linux', 'CI/CD', 'Jenkins', 'Jira', 'Nginx', 'Postman', 'Vercel', 'Netlify',
    'VS Code', 'Webpack', 'Vite', 'Kafka', 'RabbitMQ'
  ],
  fundamentals: [
    'DSA', 'Data Structures', 'Algorithms', 'OOP', 'Object Oriented Programming',
    'System Design', 'Operating Systems', 'Computer Networks', 'DBMS', 'Agile',
    'Scrum', 'Unit Testing', 'TDD', 'Microservices', 'Distributed Systems'
  ],
  softSkills: [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Collaboration', 'Adaptability', 'Mentorship', 'Presentation'
  ]
};

// Strong Action Verbs for Resume Bullets
const ACTION_VERBS = [
  'developed', 'engineered', 'architected', 'implemented', 'designed', 'built',
  'optimized', 'refactored', 'automated', 'deployed', 'scaled', 'accelerated',
  'integrated', 'managed', 'led', 'created', 'configured', 'resolved', 'enhanced'
];

/**
 * Parses raw resume text into structured fields.
 * Extracts only data actually present; never fabricates.
 */
export function parseResumeText(rawText) {
  if (!rawText || typeof rawText !== 'string' || rawText.trim().length < 30) {
    return {
      isValid: false,
      rawText: rawText || '',
      error: 'Resume text is too brief or empty (minimum 30 characters required).'
    };
  }

  const text = rawText.trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const lower = text.toLowerCase();

  // 1. Contact Information Extraction
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,9}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:io|dev|me|app|com))(?:\/[^\s]*)?/i);

  // Candidate Name (heuristic: first non-empty line without special symbols)
  let detectedName = null;
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^[#*\-_\s]+/, '').trim();
    if (firstLine.length < 50 && !firstLine.includes('@') && !firstLine.toLowerCase().includes('resume')) {
      detectedName = firstLine;
    }
  }

  const contact = {
    name: detectedName,
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0] : null,
    linkedin: linkedinMatch ? linkedinMatch[0] : null,
    github: githubMatch ? githubMatch[0] : null,
    portfolio: portfolioMatch ? portfolioMatch[0] : null
  };

  // 2. Education Extraction
  const degreeMatch = text.match(/\b(B\.Tech|B\.E\.|BTech|BE|B\.Sc|BSc|M\.Tech|MTech|M\.S\.|MS|BCA|MCA|Bachelor of (?:Technology|Engineering|Science)|Master of (?:Technology|Engineering|Science)|Ph\.?D)\b/i);
  const collegeMatch = text.match(/\b([A-Z][a-zA-Z\s&]+(?:Institute|University|College|School|Academy|IIT|NIT|BITS|IIIT)[a-zA-Z\s]*)\b/);
  const cgpaMatch = text.match(/\b(?:CGPA|GPA|Score|Percentage)?[:\s]*(\d(?:\.\d{1,2})?)\s*(?:\/\s*(?:4\.0|4|10\.0|10)|\b|\%|\s*percentage)/i);
  const gradYearMatch = text.match(/\b(20[12]\d)\b/);

  const education = {
    degree: degreeMatch ? degreeMatch[0] : null,
    institution: collegeMatch ? collegeMatch[0].trim() : null,
    cgpa: cgpaMatch ? cgpaMatch[1] : null,
    gradYear: gradYearMatch ? gradYearMatch[0] : null
  };

  // 3. Skills Extraction (Technical, Tools, Soft)
  const extractedSkills = {
    languages: [],
    frameworks: [],
    databases: [],
    tools: [],
    fundamentals: [],
    softSkills: [],
    all: []
  };

  const checkCategory = (categoryArray, targetBucket) => {
    categoryArray.forEach(item => {
      // Escape for regex boundary
      const pattern = new RegExp(`(^|[^a-zA-Z0-9_+#])${item.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}(?=[^a-zA-Z0-9_+#]|$)`, 'i');
      if (pattern.test(text)) {
        if (!targetBucket.includes(item)) {
          targetBucket.push(item);
        }
        if (!extractedSkills.all.includes(item)) {
          extractedSkills.all.push(item);
        }
      }
    });
  };

  checkCategory(TECHNICAL_TAXONOMY.languages, extractedSkills.languages);
  checkCategory(TECHNICAL_TAXONOMY.frameworks, extractedSkills.frameworks);
  checkCategory(TECHNICAL_TAXONOMY.databases, extractedSkills.databases);
  checkCategory(TECHNICAL_TAXONOMY.tools, extractedSkills.tools);
  checkCategory(TECHNICAL_TAXONOMY.fundamentals, extractedSkills.fundamentals);
  checkCategory(TECHNICAL_TAXONOMY.softSkills, extractedSkills.softSkills);

  // 4. Section Presence & Structure
  const hasEducation = Boolean(
    education.degree || education.institution ||
    /\b(education|academics|qualification)\b/i.test(text)
  );

  const hasSkillsSection = Boolean(
    extractedSkills.all.length >= 3 ||
    /\b(skills|technical skills|technologies|proficiencies)\b/i.test(text)
  );

  const hasProjectsSection = Boolean(
    /\b(projects|academic projects|key projects|personal projects)\b/i.test(text)
  );

  const hasExperienceSection = Boolean(
    /\b(experience|work experience|employment|internships|professional experience)\b/i.test(text)
  );

  // 5. Projects Extraction
  const detectedProjects = [];
  const projectHeaderRegex = /(?:projects?|academic projects|personal projects)\s*[:\n]/i;
  const projectIdx = text.search(projectHeaderRegex);
  if (projectIdx !== -1) {
    const projectChunk = text.slice(projectIdx, projectIdx + 1500);
    // Identify bullet points or numbered projects
    const projLines = projectChunk.split(/\r?\n/).slice(1, 20);
    projLines.forEach(l => {
      const trimmed = l.trim();
      if (/^(\d+\.|\*|-|•)\s+[A-Za-z]/.test(trimmed) && trimmed.length > 15) {
        // Detect keywords inside this bullet
        const usedTech = extractedSkills.all.filter(sk => 
          new RegExp(`\\b${sk.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')}\\b`, 'i').test(trimmed)
        );
        const hasMetric = /\b\d+%\b|\b\d+x\b|\b\d+\s*(?:ms|seconds|users|requests|events|records)\b/i.test(trimmed);
        detectedProjects.push({
          rawText: trimmed,
          tech: usedTech,
          hasMetric
        });
      }
    });
  }

  // 6. Action Verbs & Measurable Metrics in Text
  const foundActionVerbs = ACTION_VERBS.filter(v => 
    new RegExp(`\\b${v}\\b`, 'i').test(text)
  );
  const metricMatches = text.match(/\b\d+(?:%|x|\s*(?:ms|seconds|users|records|events|queries|percent))\b/gi) || [];

  // Word count & formatting metrics
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const bulletCount = (text.match(/^[•\-\*]\s+/gm) || []).length + (text.match(/^\d+\.\s+/gm) || []).length;

  return {
    isValid: true,
    rawText: text,
    wordCount,
    bulletCount,
    contact,
    education,
    skills: extractedSkills,
    sections: {
      hasEducation,
      hasSkills: hasSkillsSection,
      hasProjects: hasProjectsSection,
      hasExperience: hasExperienceSection
    },
    projects: detectedProjects,
    actionVerbs: foundActionVerbs,
    metricsFound: Array.from(new Set(metricMatches)).slice(0, 8),
    isFresher: !hasExperienceSection
  };
}

/**
 * Computes deterministic 100-point ATS Score and 7-pillar breakdown.
 */
export function evaluateResumeAts(parsedResume, targetRoleName = 'Full Stack Software Engineer') {
  if (!parsedResume || !parsedResume.isValid) {
    return {
      atsScore: null,
      status: 'Analysis unavailable',
      statusTier: 'Not Evaluated',
      statusDescription: 'Upload or paste your resume to receive a comprehensive ATS screening analysis.',
      breakdown: {
        contact: { score: 0, max: 10, label: 'Contact Information' },
        structure: { score: 0, max: 20, label: 'Structure & Readability' },
        sections: { score: 0, max: 10, label: 'Section Completeness' },
        technicalSkills: { score: 0, max: 20, label: 'Technical Skills & Tools' },
        keywordRelevance: { score: 0, max: 20, label: 'Role Keyword Relevance' },
        actionAndMetrics: { score: 0, max: 10, label: 'Action Verbs & Impact' },
        education: { score: 0, max: 10, label: 'Education Credentials' }
      },
      roleMatch: {
        role: targetRoleName,
        matchPercent: null,
        matchingSkills: [],
        missingSkills: []
      },
      strengths: [],
      weaknesses: [],
      recommendations: []
    };
  }

  const { contact, education, skills, sections, actionVerbs, metricsFound, wordCount, bulletCount, isFresher, projects } = parsedResume;
  const targetRole = ROLE_CATALOG[targetRoleName] || ROLE_CATALOG['Full Stack Software Engineer'];

  // Pillar 1: Contact Information Completeness (10 pts)
  let contactScore = 0;
  if (contact.email) contactScore += 3;
  if (contact.phone) contactScore += 2;
  if (contact.name) contactScore += 2;
  if (contact.linkedin || contact.github || contact.portfolio) contactScore += 3;
  contactScore = Math.min(10, contactScore);

  // Pillar 2: Resume Structure & Readability (20 pts)
  let structureScore = 0;
  // Headers present (max 8 pts)
  let headersFound = 0;
  if (sections.hasEducation) headersFound++;
  if (sections.hasSkills) headersFound++;
  if (sections.hasProjects) headersFound++;
  if (sections.hasExperience || isFresher) headersFound++;
  structureScore += Math.round((headersFound / 4) * 8);

  // Bullet formatting (max 6 pts)
  if (bulletCount >= 6) structureScore += 6;
  else if (bulletCount >= 3) structureScore += 4;
  else if (bulletCount >= 1) structureScore += 2;

  // Ideal length 250 - 1000 words (max 6 pts)
  if (wordCount >= 250 && wordCount <= 950) structureScore += 6;
  else if (wordCount >= 150 && wordCount <= 1300) structureScore += 4;
  else structureScore += 2;
  structureScore = Math.min(20, structureScore);

  // Pillar 3: Section Completeness (10 pts)
  let sectionsScore = 0;
  if (sections.hasEducation) sectionsScore += 3;
  if (sections.hasSkills) sectionsScore += 3;
  if (sections.hasProjects) sectionsScore += 4;
  sectionsScore = Math.min(10, sectionsScore);

  // Pillar 4: Technical Skills & Tools Presence (20 pts)
  let technicalSkillsScore = 0;
  if (skills.languages.length >= 2) technicalSkillsScore += 5;
  else if (skills.languages.length >= 1) technicalSkillsScore += 3;

  if (skills.frameworks.length >= 2) technicalSkillsScore += 5;
  else if (skills.frameworks.length >= 1) technicalSkillsScore += 3;

  if (skills.databases.length >= 1) technicalSkillsScore += 5;

  if (skills.tools.length >= 1) technicalSkillsScore += 5;
  technicalSkillsScore = Math.min(20, technicalSkillsScore);

  // Pillar 5: Keyword Relevance for Target Role (20 pts)
  const roleRequired = targetRole.required;
  const roleRecommended = targetRole.recommended;
  const allResumeSkills = skills.all;

  const matchingRequired = roleRequired.filter(req => 
    allResumeSkills.some(sk => sk.toLowerCase() === req.toLowerCase())
  );
  const matchingRecommended = roleRecommended.filter(rec =>
    allResumeSkills.some(sk => sk.toLowerCase() === rec.toLowerCase())
  );

  const missingRequired = roleRequired.filter(req =>
    !allResumeSkills.some(sk => sk.toLowerCase() === req.toLowerCase())
  );
  const missingRecommended = roleRecommended.filter(rec =>
    !allResumeSkills.some(sk => sk.toLowerCase() === rec.toLowerCase())
  );

  // Weight required skills heavily (80%), recommended lightly (20%)
  const reqMatchRatio = roleRequired.length > 0 ? matchingRequired.length / roleRequired.length : 0;
  const recMatchRatio = roleRecommended.length > 0 ? matchingRecommended.length / roleRecommended.length : 0;
  const roleRelevanceComposite = (reqMatchRatio * 0.8) + (recMatchRatio * 0.2);

  const keywordRelevanceScore = Math.min(20, Math.round(roleRelevanceComposite * 20));
  const roleMatchPercent = Math.round(roleRelevanceComposite * 100);

  // Pillar 6: Action-Oriented Bullet Quality & Impact (10 pts)
  let actionAndMetricsScore = 0;
  if (actionVerbs.length >= 4) actionAndMetricsScore += 5;
  else if (actionVerbs.length >= 2) actionAndMetricsScore += 3;
  else if (actionVerbs.length >= 1) actionAndMetricsScore += 1;

  if (metricsFound.length >= 2) actionAndMetricsScore += 5;
  else if (metricsFound.length >= 1) actionAndMetricsScore += 3;
  actionAndMetricsScore = Math.min(10, actionAndMetricsScore);

  // Pillar 7: Education Information (10 pts)
  let educationScore = 0;
  if (education.degree) educationScore += 4;
  if (education.institution) educationScore += 3;
  if (education.cgpa || education.gradYear) educationScore += 3;
  educationScore = Math.min(10, educationScore);

  // Sum total deterministic score
  const totalAtsScore = Math.min(100, Math.max(0,
    contactScore +
    structureScore +
    sectionsScore +
    technicalSkillsScore +
    keywordRelevanceScore +
    actionAndMetricsScore +
    educationScore
  ));

  // Status Tier Classification
  let statusTier = 'Needs Improvement';
  let statusVariant = 'danger';
  let statusDescription = 'Your resume needs critical updates in keyword density and measurable project outcomes before campus recruiting drives.';

  if (totalAtsScore >= 85) {
    statusTier = 'Strong';
    statusVariant = 'success';
    statusDescription = 'Outstanding ATS compatibility. High keyword alignment, clean hierarchy, and quantified project metrics.';
  } else if (totalAtsScore >= 65) {
    statusTier = 'Good';
    statusVariant = 'warning';
    statusDescription = 'Solid foundation. Adding target role keywords and measurable outcomes will boost recruiter screening rates.';
  }

  // Generate Data-Grounded Strengths
  const strengths = [];
  if (contactScore >= 8) {
    strengths.push('Complete contact information with professional online portfolio/code profiles.');
  }
  if (skills.all.length >= 6) {
    strengths.push(`Rich technical skills footprint with ${skills.all.length} detected competencies.`);
  }
  if (matchingRequired.length >= Math.ceil(roleRequired.length * 0.6)) {
    strengths.push(`Strong core alignment for ${targetRoleName} (${matchingRequired.slice(0, 4).join(', ')}).`);
  }
  if (metricsFound.length > 0) {
    strengths.push(`Quantified achievements detected using measurable metrics (${metricsFound.slice(0, 3).join(', ')}).`);
  }
  if (structureScore >= 16) {
    strengths.push('Clean single-column structure and bullet points readable by modern ATS screeners.');
  }
  if (strengths.length === 0) {
    strengths.push('Clear educational background and foundational technical terminology.');
  }

  // Generate Data-Grounded Weaknesses
  const weaknesses = [];
  if (missingRequired.length > 0) {
    weaknesses.push(`Missing core role keywords for ${targetRoleName}: ${missingRequired.slice(0, 3).join(', ')}.`);
  }
  if (metricsFound.length === 0) {
    weaknesses.push('Project descriptions lack quantified outcomes or numerical performance metrics.');
  }
  if (actionVerbs.length < 2) {
    weaknesses.push('Project bullets rely on passive descriptions instead of strong action verbs (Engineered, Architected, Automated).');
  }
  if (!contact.linkedin && !contact.github) {
    weaknesses.push('No LinkedIn or GitHub profile link detected; recruiters prioritize verifiable code repositories.');
  }
  if (wordCount < 250) {
    weaknesses.push(`Resume is relatively brief (${wordCount} words). Elaborate on technical project implementations.`);
  }
  if (skills.databases.length === 0) {
    weaknesses.push('No database or storage technologies explicitly mentioned.');
  }

  // Generate Actionable Recommendations
  const recommendations = [];
  if (!contact.github || !contact.linkedin) {
    recommendations.push({
      priority: 'High',
      title: 'Add Clickable GitHub and LinkedIn Links',
      description: 'Include your GitHub profile and active LinkedIn URL in the header to allow tech recruiters to review your repositories.'
    });
  }
  if (missingRequired.length > 0) {
    recommendations.push({
      priority: 'High',
      title: `Incorporate Missing ${targetRoleName} Keywords`,
      description: `Targeted recruiters screen for ${missingRequired.join(', ')}. Include these in your skills and project descriptions where you have applied experience.`,
      missingSkills: missingRequired
    });
  }
  if (metricsFound.length === 0) {
    recommendations.push({
      priority: 'High',
      title: 'Apply the Google X-Y-Z Bullet Formula',
      description: 'Format achievements as "Accomplished [X], as measured by [Y], by doing [Z]" (e.g. "Reduced API response latency by 35% through Redis query caching").'
    });
  }
  if (actionVerbs.length < 3) {
    recommendations.push({
      priority: 'Medium',
      title: 'Open Every Bullet with Strong Action Verbs',
      description: 'Begin each project bullet with authoritative engineering verbs: "Architected", "Engineered", "Optimized", or "Automated".'
    });
  }
  if (isFresher) {
    recommendations.push({
      priority: 'Low',
      title: 'Highlight Capstone & Hackathon Projects',
      description: 'As an entry-level candidate without corporate experience, emphasize end-to-end full stack projects with live deployment links and system architecture details.'
    });
  }

  return {
    atsScore: totalAtsScore,
    status: 'Analysis complete',
    statusTier,
    statusVariant,
    statusDescription,
    relevanceScore: Math.round(roleRelevanceComposite * 100),
    formattingScore: Math.round((structureScore / 20) * 100),
    breakdown: {
      contact: { score: contactScore, max: 10, label: 'Contact Information' },
      structure: { score: structureScore, max: 20, label: 'Structure & Readability' },
      sections: { score: sectionsScore, max: 10, label: 'Section Completeness' },
      technicalSkills: { score: technicalSkillsScore, max: 20, label: 'Technical Skills & Tools' },
      keywordRelevance: { score: keywordRelevanceScore, max: 20, label: 'Role Keyword Relevance' },
      actionAndMetrics: { score: actionAndMetricsScore, max: 10, label: 'Action Verbs & Impact' },
      education: { score: educationScore, max: 10, label: 'Education Credentials' }
    },
    roleMatch: {
      role: targetRoleName,
      matchPercent: roleMatchPercent,
      matchingSkills: matchingRequired.concat(matchingRecommended),
      missingSkills: missingRequired.concat(missingRecommended.slice(0, 3))
    },
    strengths,
    weaknesses,
    recommendations,
    extractedKeywords: skills.all,
    missingKeywords: missingRequired.concat(missingRecommended.slice(0, 3)),
    projectsSummary: projects,
    isFresher
  };
}

/**
 * Course mapping from resume gap keywords to curriculum items.
 */
export const SKILL_TO_COURSE_MAP = {
  'SQL': { courseId: 'c2', title: 'Database Architecture & Advanced SQL Optimization', category: 'Databases' },
  'PostgreSQL': { courseId: 'c2', title: 'Database Architecture & Advanced SQL Optimization', category: 'Databases' },
  'React': { courseId: 'c4', title: 'Modern Full-Stack Engineering with React & Node', category: 'Web Development' },
  'Node.js': { courseId: 'c4', title: 'Modern Full-Stack Engineering with React & Node', category: 'Web Development' },
  'JavaScript': { courseId: 'c4', title: 'Modern Full-Stack Engineering with React & Node', category: 'Web Development' },
  'DSA': { courseId: 'c1', title: 'Advanced Data Structures & Algorithms Masterclass', category: 'Computer Science' },
  'Data Structures': { courseId: 'c1', title: 'Advanced Data Structures & Algorithms Masterclass', category: 'Computer Science' },
  'Algorithms': { courseId: 'c1', title: 'Advanced Data Structures & Algorithms Masterclass', category: 'Computer Science' },
  'Python': { courseId: 'c1', title: 'Advanced Data Structures & Algorithms Masterclass', category: 'Computer Science' },
  'Docker': { courseId: 'c3', title: 'System Design & High-Throughput Scalability', category: 'System Design' },
  'System Design': { courseId: 'c3', title: 'System Design & High-Throughput Scalability', category: 'System Design' }
};
