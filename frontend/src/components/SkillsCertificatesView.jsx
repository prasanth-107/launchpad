import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Download, 
  ShieldCheck, 
  Layers,
  AlertTriangle,
  TrendingUp,
  Target,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Plus,
  Zap,
  HelpCircle,
  BarChart3,
  Check,
  Search,
  Filter
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { EmptyState } from './ui/EmptyState';
import { dal } from '../lib/supabaseClient';
import { 
  computeSkillGaps, 
  BENCHMARK_TARGET, 
  classifySkillScore,
  COMPETENCY_DOMAINS 
} from '../lib/skillGapEngine';

export default function SkillsCertificatesView({ user, initialTab = 'skill-gap', onNavigate }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'skill-gap' | 'skills' | 'certificates'
  const [attempts, setAttempts] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // New skill input state
  const [newSkillInput, setNewSkillInput] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Sync initialTab when prop changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Load live data from Supabase / DAL
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user?.id) return;
      try {
        setLoading(true);
        const [fetchedAttempts, fetchedUserSkills, fetchedCourses, fetchedCerts] = await Promise.all([
          dal.assessments.getAttempts(user.id),
          dal.skills.getUserSkills(user.id),
          dal.courses.list(),
          dal.certificates.list(user.id)
        ]);

        if (isMounted) {
          setAttempts(fetchedAttempts || []);
          setUserSkills(fetchedUserSkills || []);
          setCourses(fetchedCourses || []);
          setCertificates(fetchedCerts || []);
        }
      } catch (err) {
        console.error('Failed to load skill data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Compute Skill Gap Report using the Skill Gap Engine
  const skillReport = computeSkillGaps(attempts, userSkills, courses);

  // Separate user skills into verified vs candidate-added
  const verifiedSkills = userSkills.filter(s => s.verified);
  const candidateAddedSkills = userSkills.filter(s => !s.verified);

  // Handle adding candidate-added skill
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillInput.trim() || !user?.id) return;
    try {
      setAddingSkill(true);
      const skillName = newSkillInput.trim();
      const saved = await dal.skills.upsertUserSkill(user.id, skillName, 0, 'learning', false);
      setUserSkills(prev => [saved, ...prev.filter(s => s.skill_name.toLowerCase() !== skillName.toLowerCase())]);
      setNewSkillInput('');
      setFeedbackMsg(`Added "${skillName}" as self-reported skill.`);
      setTimeout(() => setFeedbackMsg(''), 3500);
    } catch (err) {
      console.error('Failed to add skill:', err);
      setFeedbackMsg('Failed to add skill. Please try again.');
    } finally {
      setAddingSkill(false);
    }
  };

  // Fallback default certificates if none in database
  const displayCertificates = certificates.length > 0 ? certificates : [
    {
      id: 'cert_1',
      title: 'Full Stack Web Engineering Placement Clearance',
      issuedBy: 'Modern Placement Launchpad TPO Council',
      date: 'August 2026',
      credentialId: 'MPL-2026-CERT-8841',
      skills: ['React', 'FastAPI', 'SQL', 'Git']
    },
    {
      id: 'cert_2',
      title: 'Algorithm Problem Solving Proficiency Level II',
      issuedBy: 'National Engineering Assessment Authority',
      date: 'July 2026',
      credentialId: 'NEAA-DSA-49102',
      skills: ['Two-Pointers', 'Binary Trees', 'Graphs']
    }
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Competency Audit</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500 font-medium">Campus Benchmark Target: {BENCHMARK_TARGET}%</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Skill Gap Engine & Placement Readiness
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Transparently audit your technical proficiencies, identify critical gaps against company recruitment thresholds, and follow data-driven study paths.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('assessments')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Take Benchmark Assessment</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('skill-gap')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 mr-6 transition-colors flex items-center gap-2 ${
            activeTab === 'skill-gap' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Skill Gap Analysis</span>
          {skillReport.criticalGaps.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
              {skillReport.criticalGaps.length} Gaps
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 mr-6 transition-colors flex items-center gap-2 ${
            activeTab === 'skills' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Skills Inventory ({userSkills.length})</span>
          {verifiedSkills.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
              {verifiedSkills.length} Verified
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'certificates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Recruitment Certificates ({displayCertificates.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SKILL GAP ANALYSIS */}
      {/* ========================================================================= */}
      {activeTab === 'skill-gap' && (
        <div className="space-y-6">

          {/* EMPTY STATE: When candidate has 0 completed assessments */}
          {!skillReport.hasEnoughData ? (
            <div className="saas-card p-8 sm:p-12 text-center space-y-5 max-w-2xl mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <Target className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  No Assessment Data Available
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Complete your first assessment to identify your strengths and skill gaps. The engine requires at least one completed assessment to compute authentic benchmark scores.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate && onNavigate('assessments')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
                >
                  <span>Browse Assessment Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Transparent Evaluation Explainer Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 mt-4">
                <span className="font-bold text-slate-800 block">Transparent Benchmark Classification Thresholds:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-200">
                    <span className="font-bold text-emerald-700 block">Strong (80%–100%)</span>
                    <span className="text-slate-500">Placement clearing benchmark met.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                    <span className="font-bold text-amber-700 block">Improvement (60%–79%)</span>
                    <span className="text-slate-500">Targeted problem drills needed.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-rose-200">
                    <span className="font-bold text-rose-700 block">Critical Gap (&lt; 60%)</span>
                    <span className="text-slate-500">High-priority course intervention required.</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* REAL DATA VIEW: When assessments exist */
            <div className="space-y-6">

              {/* Top Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Overall Skill Coverage */}
                <div className="saas-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Competency Coverage</span>
                    <Layers className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {skillReport.overallCoveragePercent}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({skillReport.totalAssessedDomains}/{skillReport.totalCompetencies} Assessed)
                    </span>
                  </div>
                  <ProgressBar value={skillReport.overallCoveragePercent} size="xs" color="indigo" showPercentage={false} />
                </div>

                {/* Top Strength */}
                <div className="saas-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Top Strength</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-emerald-700 truncate">
                      {skillReport.topStrength?.shortName || skillReport.topStrength?.name || '—'}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 font-mono">
                      {skillReport.topStrength?.score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Cleared benchmark with {skillReport.topStrength?.attemptsCount || 1} verified tests.
                  </p>
                </div>

                {/* Biggest Gap */}
                <div className="saas-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Biggest Priority Gap</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-rose-700 truncate">
                      {skillReport.biggestGap?.shortName || skillReport.biggestGap?.name || 'None'}
                    </span>
                    {skillReport.biggestGap?.gapPercent > 0 ? (
                      <span className="text-xs font-extrabold text-rose-600 font-mono bg-rose-50 px-2 py-0.5 rounded">
                        Gap: -{skillReport.biggestGap?.gapPercent}%
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600 font-bold">Target Met</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Current score: <strong>{skillReport.biggestGap?.score}%</strong> (Target: {skillReport.biggestGap?.targetScore}%)
                  </p>
                </div>

                {/* Placement Threshold */}
                <div className="saas-card p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Benchmark Standard</span>
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {BENCHMARK_TARGET}%
                    </span>
                    <span className="text-xs text-slate-400">Cutoff</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Campus placement interview shortlisting criteria.
                  </p>
                </div>

              </div>

              {/* Recommended Next Action Banner */}
              {skillReport.recommendedNextAction && (
                <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                          Recommended Next Action
                        </span>
                        <Badge variant={skillReport.recommendedNextAction.urgency === 'High' ? 'danger' : 'primary'} size="xs">
                          {skillReport.recommendedNextAction.urgency} Priority
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-indigo-950 mt-0.5">
                        {skillReport.recommendedNextAction.actionText}
                      </p>
                    </div>
                  </div>

                  {onNavigate && (
                    <button
                      onClick={() => onNavigate(skillReport.recommendedNextAction.targetRoute)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
                    >
                      {skillReport.recommendedNextAction.targetRoute === 'courses' ? 'Open Course' : 'Practice Now'} →
                    </button>
                  )}
                </div>
              )}

              {/* 3-Category Skill Classification Grid: Strong | Needs Improvement | Critical Gaps */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Critical Gaps (< 60%) */}
                <div className="saas-card p-6 space-y-4 border-t-4 border-t-rose-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <h3 className="text-base font-bold text-slate-900">Critical Gaps</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Score &lt; 60% • Immediate Action</p>
                    </div>
                    <Badge variant="danger" size="xs">
                      {skillReport.criticalGaps.length}
                    </Badge>
                  </div>

                  {skillReport.criticalGaps.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      ✓ No critical gaps identified! All assessed domains are 60%+
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {skillReport.criticalGaps.map((domain) => (
                        <div key={domain.id} className="p-4 rounded-xl bg-rose-50/40 border border-rose-200 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{domain.name}</h4>
                              <span className="text-[10px] text-slate-500">{domain.category}</span>
                            </div>
                            <span className="text-xs font-extrabold text-rose-700 font-mono">
                              {domain.score}%
                            </span>
                          </div>

                          <ProgressBar value={domain.score} size="xs" color="rose" showPercentage={false} />

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>Gap: <strong className="text-rose-700">-{domain.gapPercent}%</strong></span>
                            <span>Target: {domain.targetScore}%</span>
                          </div>

                          <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-600 truncate">
                              {domain.recommendedCourseTitle}
                            </span>
                            {onNavigate && (
                              <button
                                onClick={() => onNavigate(domain.courseTarget)}
                                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 shrink-0"
                              >
                                Enroll →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Needs Improvement (60%–79%) */}
                <div className="saas-card p-6 space-y-4 border-t-4 border-t-amber-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <h3 className="text-base font-bold text-slate-900">Skills to Improve</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Score 60%–79% • Near Benchmark</p>
                    </div>
                    <Badge variant="warning" size="xs">
                      {skillReport.skillsToImprove.length}
                    </Badge>
                  </div>

                  {skillReport.skillsToImprove.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      No skills currently in the improvement tier.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {skillReport.skillsToImprove.map((domain) => (
                        <div key={domain.id} className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{domain.name}</h4>
                              <span className="text-[10px] text-slate-500">{domain.category}</span>
                            </div>
                            <span className="text-xs font-extrabold text-amber-700 font-mono">
                              {domain.score}%
                            </span>
                          </div>

                          <ProgressBar value={domain.score} size="xs" color="amber" showPercentage={false} />

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>Gap: <strong className="text-amber-700">-{domain.gapPercent}%</strong></span>
                            <span>Target: {domain.targetScore}%</span>
                          </div>

                          <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-600 truncate">
                              Practice drills recommended
                            </span>
                            {onNavigate && (
                              <button
                                onClick={() => onNavigate(domain.practiceTarget)}
                                className="text-[11px] font-bold text-amber-700 hover:text-amber-900 shrink-0"
                              >
                                Practice →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Strong Skills (80%–100%) */}
                <div className="saas-card p-6 space-y-4 border-t-4 border-t-emerald-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h3 className="text-base font-bold text-slate-900">Strong Skills</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Score 80%–100% • Benchmark Met</p>
                    </div>
                    <Badge variant="success" size="xs">
                      {skillReport.strongSkills.length}
                    </Badge>
                  </div>

                  {skillReport.strongSkills.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                      Reach 80%+ on assessments to earn Strong tier endorsement.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {skillReport.strongSkills.map((domain) => (
                        <div key={domain.id} className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{domain.name}</h4>
                              <span className="text-[10px] text-slate-500">{domain.category}</span>
                            </div>
                            <span className="text-xs font-extrabold text-emerald-700 font-mono">
                              {domain.score}%
                            </span>
                          </div>

                          <ProgressBar value={domain.score} size="xs" color="emerald" showPercentage={false} />

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span className="text-emerald-700 font-bold">✓ Placement Ready</span>
                            <span>Target: {domain.targetScore}%</span>
                          </div>

                          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-600">
                              Simulate interview round
                            </span>
                            {onNavigate && (
                              <button
                                onClick={() => onNavigate('interview')}
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 shrink-0"
                              >
                                Mock Interview →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Sub-Topic Performance Breakdown (if question details exist) */}
              {skillReport.topicBreakdown.length > 0 && (
                <div className="saas-card p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Fine-Grained Sub-Topic Accuracy</h3>
                      <p className="text-xs text-slate-500">Extracted from your actual question-by-question assessment submissions</p>
                    </div>
                    <Badge variant="neutral" size="xs">
                      {skillReport.topicBreakdown.length} Topics Analyzed
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {skillReport.topicBreakdown.map((t, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{t.topic}</span>
                          <span className="text-[10px] text-slate-400">
                            {t.correct} / {t.total} Correct • {t.domain}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-bold font-mono ${
                            t.accuracy >= 80 ? 'text-emerald-600' : t.accuracy >= 60 ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {t.accuracy}%
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {t.classification.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SKILLS INVENTORY (VERIFIED VS SELF-REPORTED) */}
      {/* ========================================================================= */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          
          {/* Add Skill Input Form */}
          <div className="saas-card p-5">
            <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder="Add a technical skill (e.g., Docker, TypeScript, Redis, System Design)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-indigo-600 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={addingSkill || !newSkillInput.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{addingSkill ? 'Saving...' : 'Add to Skills'}</span>
              </button>
            </form>

            {feedbackMsg && (
              <p className="text-xs font-medium text-emerald-600 mt-2">
                ✓ {feedbackMsg}
              </p>
            )}
          </div>

          {/* 1. Assessment-Verified Skills Section */}
          <div className="saas-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Assessment-Verified Skills</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Backed by authentic test submissions cleared with 70%+ score
                </p>
              </div>
              <Badge variant="success" size="xs">
                {verifiedSkills.length} Verified
              </Badge>
            </div>

            {verifiedSkills.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">No Assessment-Verified Skills Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Pass an assessment in the Assessment Catalog with 70% or higher to automatically verify your skills.
                  </p>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('assessments')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <span>Take Assessment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {verifiedSkills.map((skill) => (
                  <div key={skill.id} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="success" size="xs">
                          Verified ✓
                        </Badge>
                        <span className="text-xs font-extrabold text-emerald-700 font-mono">
                          {skill.proficiency_percent}% Score
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{skill.skill_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{skill.category || 'Technical'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Status: <strong className="capitalize text-slate-700">{skill.status}</strong></span>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('assessments')}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Retake Test →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Candidate-Added / Self-Reported Skills Section */}
          <div className="saas-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <h3 className="text-base font-bold text-slate-900">Candidate-Added Skills (Self-Reported)</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Added to your student profile; pending assessment verification
                </p>
              </div>
              <Badge variant="neutral" size="xs">
                {candidateAddedSkills.length} Pending
              </Badge>
            </div>

            {candidateAddedSkills.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No self-reported skills. Use the input box above to declare skills you know.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidateAddedSkills.map((skill) => (
                  <div key={skill.id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="neutral" size="xs">
                          Self-Reported
                        </Badge>
                        <span className="text-[11px] text-amber-700 font-medium">Unverified</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{skill.skill_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{skill.category || 'Technical'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Take test to verify</span>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('assessments')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors"
                        >
                          Verify via Test →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PLACEMENT CERTIFICATES */}
      {/* ========================================================================= */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCertificates.map((cert) => (
            <div key={cert.id} className="saas-card p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{cert.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Issued by {cert.issuedBy}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {cert.credentialId}</p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {cert.skills?.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{cert.date}</span>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
