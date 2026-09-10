import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Download, 
  Check, 
  XCircle,
  Briefcase,
  GraduationCap,
  Layers,
  Code2,
  ExternalLink,
  Info,
  ShieldCheck,
  UserCheck,
  Zap,
  Target,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { dal } from '../lib/supabaseClient';
import { 
  parseResumeText, 
  evaluateResumeAts, 
  ROLE_CATALOG, 
  SKILL_TO_COURSE_MAP 
} from '../lib/resumeAtsEngine';
import confetti from 'canvas-confetti';

export default function ResumeAnalysisView({ user, onResumeAnalyzed, onNavigate }) {
  const [targetRole, setTargetRole] = useState(user?.preferred_job_role || 'Full Stack Software Engineer');
  const [resumeText, setResumeText] = useState('');
  const [activeInputTab, setActiveInputTab] = useState('upload'); // 'upload' | 'text'
  const [uploadedFileMeta, setUploadedFileMeta] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanStage, setScanStage] = useState(0); // 0-4
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [profileSyncDismissed, setProfileSyncDismissed] = useState(false);
  const [profileSyncSuccess, setProfileSyncSuccess] = useState(false);

  // Scan progress stages for professional SaaS feedback
  const scanStages = [
    'Reading and extracting document structure...',
    'Auditing contact channels and formatting layout...',
    'Cataloging technical skills, frameworks, and developer tools...',
    `Benchmarking keyword relevance against ${targetRole}...`,
    'Finalizing placement readiness audit and ATS recommendations...'
  ];

  // 1. Fetch latest stored resume on component mount
  useEffect(() => {
    let isMounted = true;
    async function loadLatestResume() {
      if (!user?.id) {
        setLoadingInitial(false);
        return;
      }
      try {
        const latest = await dal.resumes.getLatest(user.id);
        if (latest && isMounted) {
          setUploadedFileMeta({
            name: latest.file_name || 'uploaded_resume.pdf',
            uploadedAt: latest.created_at
          });

          // If resume text is stored in user profile or we reconstruct evaluation from stored fields
          if (user.resume_text) {
            setResumeText(user.resume_text);
            const parsed = parseResumeText(user.resume_text);
            setParsedData(parsed);
            const evaluation = evaluateResumeAts(parsed, targetRole);
            // Reconcile with stored database scores
            setAnalysisResult({
              ...evaluation,
              atsScore: latest.ats_score !== undefined ? latest.ats_score : evaluation.atsScore,
              relevanceScore: latest.relevance_score || evaluation.relevanceScore,
              formattingScore: latest.formatting_score || evaluation.formattingScore,
              strengths: latest.strengths?.length > 0 ? latest.strengths : evaluation.strengths,
              weaknesses: latest.weaknesses?.length > 0 ? latest.weaknesses : evaluation.weaknesses,
              recommendations: latest.recommendations?.length > 0 ? latest.recommendations : evaluation.recommendations,
              missingKeywords: latest.missing_keywords?.length > 0 ? latest.missing_keywords : evaluation.missingKeywords
            });
          } else {
            // Reconstruct view from stored resume record
            setAnalysisResult({
              atsScore: latest.ats_score,
              status: 'Analysis complete',
              statusTier: latest.ats_score >= 85 ? 'Strong' : (latest.ats_score >= 65 ? 'Good' : 'Needs Improvement'),
              statusVariant: latest.ats_score >= 85 ? 'success' : (latest.ats_score >= 65 ? 'warning' : 'danger'),
              statusDescription: latest.ats_score >= 85 
                ? 'Strong ATS compatibility with high role keyword density.' 
                : 'Resume audit complete. Incorporate missing role keywords to increase screening rates.',
              relevanceScore: latest.relevance_score || 85,
              formattingScore: latest.formatting_score || 88,
              breakdown: {
                contact: { score: Math.round(latest.ats_score * 0.1), max: 10, label: 'Contact Information' },
                structure: { score: Math.round(latest.ats_score * 0.2), max: 20, label: 'Structure & Readability' },
                sections: { score: Math.round(latest.ats_score * 0.1), max: 10, label: 'Section Completeness' },
                technicalSkills: { score: Math.round(latest.ats_score * 0.2), max: 20, label: 'Technical Skills & Tools' },
                keywordRelevance: { score: Math.round(latest.ats_score * 0.2), max: 20, label: 'Role Keyword Relevance' },
                actionAndMetrics: { score: Math.round(latest.ats_score * 0.1), max: 10, label: 'Action Verbs & Impact' },
                education: { score: Math.round(latest.ats_score * 0.1), max: 10, label: 'Education Credentials' }
              },
              roleMatch: {
                role: targetRole,
                matchPercent: latest.relevance_score || 80,
                matchingSkills: latest.extracted_keywords?.slice(0, 6) || [],
                missingSkills: latest.missing_keywords || []
              },
              strengths: latest.strengths || [],
              weaknesses: latest.weaknesses || [],
              recommendations: latest.recommendations || [],
              extractedKeywords: latest.extracted_keywords || [],
              missingKeywords: latest.missing_keywords || [],
              projectsSummary: [],
              isFresher: false
            });
          }
        }
      } catch (err) {
        console.warn('Error loading latest resume:', err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }
    loadLatestResume();
    return () => { isMounted = false; };
  }, [user?.id, targetRole]);

  // Handle Target Role Switch
  const handleRoleChange = (newRole) => {
    setTargetRole(newRole);
    if (parsedData && parsedData.isValid) {
      const updatedEval = evaluateResumeAts(parsedData, newRole);
      setAnalysisResult(updatedEval);
    }
  };

  // 2. File Selection & Text Extraction
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileMeta = {
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      type: file.type || file.name.split('.').pop()?.toUpperCase() || 'DOCUMENT',
      fileObj: file
    };
    setUploadedFileMeta(fileMeta);

    // Text / Markdown Reader
    if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.text') || file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          setResumeText(content);
          setActiveInputTab('text');
        }
      };
      reader.readAsText(file);
    } else {
      // PDF or Binary doc: attempt extraction or try backend endpoint
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const buffer = event.target?.result;
          // Heuristic text extractor for readable ASCII/UTF-8 strings in documents
          if (buffer) {
            const bytes = new Uint8Array(buffer);
            let extracted = '';
            for (let i = 0; i < bytes.length; i++) {
              const byte = bytes[i];
              if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
                extracted += String.fromCharCode(byte);
              } else if (extracted.length > 0 && extracted[extracted.length - 1] !== ' ') {
                extracted += ' ';
              }
            }
            // Clean consecutive spaces and filter lines
            const cleaned = extracted
              .replace(/\s{2,}/g, ' ')
              .replace(/([A-Z])/g, '\n$1')
              .slice(0, 5000);
            
            if (cleaned.length > 50) {
              setResumeText(cleaned);
              setActiveInputTab('text');
            } else {
              // Fallback to basic text preview
              setResumeText(`Uploaded document: ${file.name}\nSize: ${fileMeta.size}\n\nPlease verify or paste plain text content below for optimal ATS parsing.`);
            }
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (e) {
        console.warn('Binary read error:', e);
      }
    }
  };

  // 3. Main ATS Analysis Execution
  const runAnalysis = async () => {
    if (!resumeText.trim() || analyzing) return;

    setAnalyzing(true);
    setScanStage(0);

    // Animated multi-step progress progression
    const stageInterval = setInterval(() => {
      setScanStage(prev => (prev < 4 ? prev + 1 : prev));
    }, 450);

    try {
      // Step A: Parse text deterministically
      const parsed = parseResumeText(resumeText);
      setParsedData(parsed);

      // Step B: Evaluate 100-point ATS Score and 7 Pillars
      const evaluation = evaluateResumeAts(parsed, targetRole);
      setAnalysisResult(evaluation);

      // Step C: Persist to Supabase resumes table
      if (user?.id) {
        const fileName = uploadedFileMeta?.name || 'resume.pdf';
        
        // Securely upload file if fileObj exists
        if (uploadedFileMeta?.fileObj) {
          await dal.resumes.uploadFile(user.id, uploadedFileMeta.fileObj);
        }

        // Save analysis record in public.resumes
        await dal.resumes.save(user.id, {
          file_name: fileName,
          ats_score: evaluation.atsScore,
          relevance_score: evaluation.relevanceScore,
          formatting_score: evaluation.formattingScore,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          extracted_keywords: evaluation.extractedKeywords,
          missing_keywords: evaluation.missingKeywords,
          recommendations: evaluation.recommendations
        });

        // Store resume text in user profile for session persistence
        await dal.profiles.update(user.id, {
          resume_text: resumeText,
          preferred_job_role: targetRole
        });
      }

      // Step D: Confetti on strong score
      if (evaluation.atsScore >= 80) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      }

      // Step E: Trigger parent readiness recalculation
      if (onResumeAnalyzed) {
        onResumeAnalyzed({
          atsScore: evaluation.atsScore,
          targetRole
        });
      }
    } catch (err) {
      console.error('Error during ATS analysis:', err);
    } finally {
      clearInterval(stageInterval);
      setAnalyzing(false);
      setScanStage(4);
    }
  };

  // 4. Profile Sync Handler (Never silently overwrites without user confirmation)
  const handleSyncProfile = async () => {
    if (!user?.id || !parsedData?.contact) return;
    try {
      const updates = {};
      if (parsedData.contact.name && parsedData.contact.name !== user.name) {
        updates.name = parsedData.contact.name;
      }
      if (parsedData.contact.phone && parsedData.contact.phone !== user.phone) {
        updates.phone = parsedData.contact.phone;
      }
      if (parsedData.education.institution && parsedData.education.institution !== user.college) {
        updates.college = parsedData.education.institution;
      }
      if (parsedData.education.degree && parsedData.education.degree !== user.degree) {
        updates.degree = parsedData.education.degree;
      }
      if (parsedData.contact.linkedin && parsedData.contact.linkedin !== user.linkedin_url) {
        updates.linkedin_url = parsedData.contact.linkedin;
      }
      if (parsedData.contact.github && parsedData.contact.github !== user.github_url) {
        updates.github_url = parsedData.contact.github;
      }

      if (Object.keys(updates).length > 0) {
        await dal.profiles.update(user.id, updates);
        setProfileSyncSuccess(true);
      }
    } catch (err) {
      console.error('Failed to sync profile:', err);
    }
  };

  // Check if detected profile details differ from current profile
  const hasProfileDifferences = parsedData?.contact && (
    (parsedData.contact.phone && parsedData.contact.phone !== user?.phone) ||
    (parsedData.contact.linkedin && parsedData.contact.linkedin !== user?.linkedin_url) ||
    (parsedData.contact.github && parsedData.contact.github !== user?.github_url) ||
    (parsedData.education?.institution && parsedData.education.institution !== user?.college)
  );

  // Initial Loading Spinner
  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">
          Loading ATS intelligence engine...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-16">
      
      {/* 1. Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Resume / ATS Intelligence
            </h1>
            <Badge variant="primary" size="sm">Phase 7</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit your resume against automated ATS screeners with 100-point deterministic scoring, skill extraction, and Google X-Y-Z formula verification.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-slate-600">Target Role:</label>
          <select
            value={targetRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:border-indigo-500 shadow-xs"
          >
            {Object.keys(ROLE_CATALOG).map(roleKey => (
              <option key={roleKey} value={roleKey}>{roleKey}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Top Banner / Profile Sync Prompt (when differences are detected) */}
      {hasProfileDifferences && !profileSyncDismissed && !profileSyncSuccess && (
        <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-indigo-900">Resume Detected Different Profile Details</h4>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                We detected new contact credentials in your resume (e.g. {parsedData.contact.phone || parsedData.contact.linkedin || parsedData.education.institution}).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncProfile}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Update Profile
            </button>
            <button
              onClick={() => setProfileSyncDismissed(true)}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-300 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {profileSyncSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile credentials successfully synced from resume!</span>
        </div>
      )}

      {/* 3. Empty State (when no analysis has been performed yet) */}
      {!analysisResult && (
        <div className="saas-card p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Your resume has not been analyzed yet.</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Upload your latest resume to check ATS compatibility, detected technical skills, keyword coverage, and boost your Placement Readiness score.
            </p>
          </div>

          {/* Quick Upload or Paste CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <label className="cursor-pointer px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs">
              <Upload className="w-4 h-4" />
              <span>Upload Resume File</span>
              <input 
                type="file" 
                accept=".txt,.md,.text,.pdf,.docx" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
            <button
              onClick={() => setActiveInputTab('text')}
              className="px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              Paste Plain Text
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block">100-Point Scorer</span>
              <span className="text-[10px] text-slate-500">Contact, format, keywords, action verbs & credentials.</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block">Google X-Y-Z Audit</span>
              <span className="text-[10px] text-slate-500">Evaluates quantified metrics in project bullet points.</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block">15% Readiness Impact</span>
              <span className="text-[10px] text-slate-500">Directly feeds the Placement Readiness Index.</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Scanning Active Multi-Stage Loader */}
      {analyzing && (
        <div className="saas-card p-8 text-center space-y-5 border-indigo-200 bg-indigo-50/30">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Scanning Resume with ATS Engine</h3>
            <p className="text-xs text-indigo-700 font-medium">
              {scanStages[scanStage] || 'Evaluating candidate metrics...'}
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <ProgressBar value={(scanStage + 1) * 20} max={100} size="sm" color="indigo" showPercentage={false} />
          </div>
        </div>
      )}

      {/* 5. Main Layout: Input / Uploader (Left) + ATS Report (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Controller (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="saas-card p-5 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Resume Source</h3>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setActiveInputTab('upload')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    activeInputTab === 'upload' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setActiveInputTab('text')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    activeInputTab === 'text' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Edit / Paste
                </button>
              </div>
            </div>

            {/* Upload Zone */}
            {activeInputTab === 'upload' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Supported: PDF, DOCX, TXT, Markdown
                </label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.text,.rtf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {uploadedFileMeta ? uploadedFileMeta.name : 'Click or drop your resume here'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {uploadedFileMeta?.size ? `File size: ${uploadedFileMeta.size}` : 'Securely analyzed without exposing private links'}
                  </p>
                </div>
              </div>
            )}

            {/* Text Editor */}
            {activeInputTab === 'text' && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                  <span>Resume Content</span>
                  <span>{resumeText.split(/\s+/).filter(Boolean).length} words | {resumeText.length} chars</span>
                </div>
                <textarea
                  rows={12}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume plain text here (including contact info, education, technical skills, and project descriptions)..."
                  className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-800 font-mono leading-relaxed resize-none focus:outline-none focus:border-indigo-500 bg-white"
                />
              </div>
            )}

            {/* Scan Action CTA */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={runAnalysis}
                disabled={analyzing || !resumeText.trim()}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{analyzing ? 'Scanning Resume...' : (analysisResult ? 'Re-Audit Resume' : 'Audit Resume with ATS')}</span>
              </button>
              {resumeText && (
                <button
                  onClick={() => { setResumeText(''); setUploadedFileMeta(null); setAnalysisResult(null); }}
                  className="px-3 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-medium"
                  title="Clear input"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Grounding & Privacy Guarantee */}
            <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Guaranteed:</strong> Resumes are scoped strictly to your authenticated candidate profile via Row Level Security. No public storage URLs.
              </span>
            </div>

          </div>
        </div>

        {/* Right Column: Full ATS Analysis Report (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {analysisResult ? (
            <>
              {/* Hero ATS Score Card */}
              <div className="saas-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      RECRUITER ATS SCREENING SCORE
                    </span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                        {analysisResult.atsScore !== null ? analysisResult.atsScore : '--'}
                      </span>
                      <span className="text-slate-400 text-lg font-bold">/ 100</span>
                      <Badge variant={analysisResult.statusVariant || 'neutral'} size="md">
                        {analysisResult.statusTier || 'Not Evaluated'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {analysisResult.statusDescription}
                    </p>
                  </div>

                  <div className="text-left sm:text-right text-xs text-slate-500 space-y-1.5 shrink-0 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    <p>Role Relevance: <strong className="text-slate-900">{analysisResult.relevanceScore}%</strong></p>
                    <p>Format & Layout: <strong className="text-slate-900">{analysisResult.formattingScore}%</strong></p>
                    <p>Target Role: <strong className="text-indigo-600">{targetRole}</strong></p>
                  </div>
                </div>

                {/* 7-Component ATS Score Breakdown Progress Bars */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Deterministic 100-Point Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {Object.entries(analysisResult.breakdown || {}).map(([key, b]) => (
                      <div key={key} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700">{b.label}</span>
                          <span className="font-bold text-slate-900">{b.score} / {b.max}</span>
                        </div>
                        <ProgressBar value={b.score} max={b.max} size="xs" color={b.score >= b.max * 0.8 ? 'emerald' : (b.score >= b.max * 0.6 ? 'indigo' : 'amber')} showPercentage={false} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detected Skills Grid */}
              <div className="saas-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Detected Skills in Resume</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Extracted directly from resume text. Pass platform diagnostics to achieve <em>Verified</em> status.
                    </p>
                  </div>
                  <Badge variant="neutral" size="xs">
                    {analysisResult.extractedKeywords?.length || 0} Identified
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  {analysisResult.extractedKeywords?.length > 0 ? (
                    analysisResult.extractedKeywords.map((skill, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{skill}</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">(Detected)</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No technical keywords detected. Add languages, frameworks, and tools in a dedicated Skills section.
                    </p>
                  )}
                </div>
              </div>

              {/* Role Matching & Keyword Gaps */}
              <div className="saas-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Role Match: {targetRole}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Comparison against standard industry placement requisites.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-indigo-600">
                      {analysisResult.roleMatch?.matchPercent || 0}%
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Match</span>
                  </div>
                </div>

                <ProgressBar 
                  value={analysisResult.roleMatch?.matchPercent || 0} 
                  max={100} 
                  size="sm" 
                  color={analysisResult.roleMatch?.matchPercent >= 75 ? 'emerald' : 'indigo'} 
                  showPercentage={false} 
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  {/* Matching Skills */}
                  <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Matching Role Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.roleMatch?.matchingSkills?.map((s, i) => (
                        <Badge key={i} variant="success" size="xs">✓ {s}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Skill Gaps */}
                  <div className="p-4 rounded-lg bg-rose-50/50 border border-rose-200/80 space-y-2">
                    <span className="font-bold text-rose-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Missing Role Keywords
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.roleMatch?.missingSkills?.length > 0 ? (
                        analysisResult.roleMatch.missingSkills.map((s, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Badge variant="danger" size="xs">+ {s}</Badge>
                            {SKILL_TO_COURSE_MAP[s] && onNavigate && (
                              <button
                                onClick={() => onNavigate('courses')}
                                className="text-[10px] text-indigo-600 hover:underline flex items-center"
                                title="Learn in Course"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium">All core keywords present!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project & Experience Quality Audits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Project Quality */}
                <div className="saas-card p-5 space-y-3">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    Project Quality Audit
                  </span>
                  {analysisResult.projectsSummary?.length > 0 ? (
                    <div className="space-y-2.5">
                      {analysisResult.projectsSummary.slice(0, 3).map((proj, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
                          <p className="font-semibold text-slate-800 line-clamp-2">{proj.rawText}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span>Tech: {proj.tech.slice(0, 3).join(', ') || 'General'}</span>
                            <span>•</span>
                            <span className={proj.hasMetric ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                              {proj.hasMetric ? '✓ Quantified metric' : '! No metric'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Highlight 2-3 technical projects with repository links and quantified engineering outcomes.
                    </p>
                  )}
                </div>

                {/* Experience Quality */}
                <div className="saas-card p-5 space-y-3">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Experience Quality Audit
                  </span>
                  {analysisResult.isFresher ? (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-600 leading-relaxed text-xs">
                      <p className="font-semibold text-slate-800 mb-1">Campus Fresher Profile</p>
                      <p className="text-[11px] text-slate-500">
                        Experience section not available — capstone projects, hackathons, and technical skills will strengthen your campus placement candidature.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-600 text-xs space-y-1">
                      <p className="font-semibold text-slate-800">Professional Experience Detected</p>
                      <p className="text-[11px] text-slate-500">
                        Evaluated role scope, action verbs, and quantifiable contributions.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Actionable Improvement Recommendations */}
              <div className="saas-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Actionable Improvement Recommendations</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Prioritized enhancements based strictly on detected resume deficits.
                    </p>
                  </div>
                  <Badge variant="primary" size="xs">
                    {analysisResult.recommendations?.length || 0} Priority Items
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  {analysisResult.recommendations?.map((rec, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-3"
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                        rec.priority === 'High' ? 'bg-rose-600 text-white' : (rec.priority === 'Medium' ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white')
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900">{rec.title}</h5>
                          <Badge variant={rec.priority === 'High' ? 'danger' : (rec.priority === 'Medium' ? 'warning' : 'neutral')} size="xs">
                            {rec.priority} Priority
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed mt-1">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          ) : (
            <div className="saas-card p-8 text-center text-slate-400 space-y-3">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Awaiting Resume Scan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select a file or paste your resume text on the left, then click <strong>Audit Resume with ATS</strong> to generate your deterministic score.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
