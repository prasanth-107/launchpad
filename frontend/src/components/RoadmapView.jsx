import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  RotateCw,
  Play,
  Layers,
  Award,
  ChevronRight
} from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { dal } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';

export default function RoadmapView({ 
  user, 
  dashboardData, 
  onNavigate, 
  onRoadmapProgressUpdated, 
  onNavigateToContent 
}) {
  const [learningPath, setLearningPath] = useState(dashboardData?.learningPathReport || null);
  const [loading, setLoading] = useState(!dashboardData?.learningPathReport);
  const [activeStage, setActiveStage] = useState(null);
  const [savingNodeId, setSavingNodeId] = useState(null);

  // Load personalized path from DAL (single source of truth)
  const fetchPath = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const report = await dal.learningPaths.getPersonalizedPath(user.id);
      setLearningPath(report);
      
      // Auto-persist roadmap stages to learning_paths table to ensure persistence without duplicates
      if (report?.stages && report.stages.length > 0) {
        await dal.learningPaths.savePath(user.id, report.stages);
      }

      if (report?.stages?.length > 0) {
        const firstIncomplete = report.stages.find(s => !s.completed) || report.stages[0];
        setActiveStage(firstIncomplete);
      }
    } catch (err) {
      console.error('Failed to load personalized learning path:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPath();
  }, [user?.id]);

  // Handle stage completion toggle
  const handleToggleStage = async (stage) => {
    if (!user?.id || !stage) return;
    try {
      setSavingNodeId(stage.step_number);
      const updated = await dal.learningPaths.toggleStep(user.id, stage.step_number);
      
      if (updated && updated.completed) {
        confetti({ particleCount: 45, spread: 50, origin: { y: 0.7 } });
      }

      // Update local stage state
      setLearningPath(prev => {
        if (!prev) return prev;
        const updatedStages = prev.stages.map(s => {
          if (s.step_number === stage.step_number) {
            const isComp = updated?.completed ?? !s.completed;
            return {
              ...s,
              completed: isComp,
              status: isComp ? 'Completed' : 'Not Started',
              progressPercent: isComp ? 100 : 0
            };
          }
          return s;
        });

        const completedCount = updatedStages.filter(s => s.completed).length;
        const newOverallProgress = Math.round((completedCount / updatedStages.length) * 100);

        return {
          ...prev,
          stages: updatedStages,
          overallProgress: newOverallProgress
        };
      });

      if (activeStage?.step_number === stage.step_number) {
        setActiveStage(prev => prev ? ({ ...prev, completed: !prev.completed }) : null);
      }

      if (onRoadmapProgressUpdated) {
        onRoadmapProgressUpdated();
      }
    } catch (err) {
      console.error('Failed to toggle stage:', err);
    } finally {
      setSavingNodeId(null);
    }
  };

  // Handle Continue Learning CTA
  const handleContinueLearning = async (rec) => {
    if (rec?.courseId) {
      // Simulate/record course progress increment if starting or resuming
      const current = rec.progressPercent || 0;
      const nextProgress = Math.min(100, current + 15);
      await dal.courses.updateProgress(user.id, rec.courseId, nextProgress);
      if (onNavigate) {
        onNavigate('courses');
      }
    } else if (onNavigate) {
      onNavigate('courses');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Generating Personalized Learning Path from Real Skill Gaps...</p>
      </div>
    );
  }

  // 1. Strict Empty State: Candidate has no completed assessments
  if (!learningPath || !learningPath.hasPath) {
    return (
      <div className="space-y-6 text-left">
        <div className="pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            ADAPTIVE CURRICULUM
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            My Personalized Learning Path
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data-driven roadmap generated from diagnostic assessments and real performance metrics.
          </p>
        </div>

        <EmptyState
          icon={Compass}
          title="No personalized learning path yet."
          description="Complete an assessment to identify your skill gaps and generate a personalized preparation plan."
          actionLabel="Take First Assessment"
          onAction={() => onNavigate && onNavigate('assessments')}
        />
      </div>
    );
  }

  const {
    readinessScore,
    overallProgress,
    currentPriority,
    recommendedCourses,
    stages
  } = learningPath;

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. Page Header & Key Telemetry Hero Card */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                MY PERSONALIZED LEARNING PATH
              </span>
              <Badge variant="primary" size="xs">Adaptive Roadmap</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Target Track: {user?.preferred_job_role || 'Full Stack Software Engineer'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
              Linear sequence engineered to bridge critical evaluated skill gaps and elevate campus placement readiness.
            </p>
          </div>

          {/* Right Metrics: Placement Readiness & Learning Progress */}
          <div className="flex items-center gap-6 sm:gap-8 lg:border-l lg:border-slate-200 lg:pl-8 shrink-0">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Current Readiness</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {readinessScore !== null ? readinessScore : '--'}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 100</span>
              </div>
              <span className="text-[11px] text-slate-400">Placement Index</span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 block">Learning Progress</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-indigo-600">{overallProgress}%</span>
              </div>
              <span className="text-[11px] text-slate-400">Path Completed</span>
            </div>
          </div>
        </div>

        {/* Linear Overall Progress Bar */}
        <div className="pt-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Overall Milestone Completion:</span>
            <span className="font-mono text-slate-500">{stages.filter(s => s.completed).length} of {stages.length} Stages Cleared</span>
          </div>
          <ProgressBar value={overallProgress} size="md" color="indigo" showPercentage={false} />
        </div>
      </div>

      {/* 2. Current Priority & Next Step Callout (Required Section) */}
      {currentPriority && (
        <div className="saas-card p-6 sm:p-7 border-l-4 border-l-indigo-600 bg-gradient-to-r from-indigo-50/40 via-white to-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  CURRENT PRIORITY
                </span>
                <span className="text-base font-bold text-slate-900">
                  → {currentPriority.skill}
                </span>
                <Badge 
                  variant={currentPriority.priority === 'CRITICAL' ? 'danger' : 'warning'} 
                  size="xs"
                >
                  {currentPriority.priority} PRIORITY
                </Badge>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-slate-800">WHY:</strong> {currentPriority.why}
                </p>
                <p>
                  <strong className="text-slate-800">RECOMMENDED NEXT STEP:</strong> {currentPriority.recommendedNextStep}
                </p>
                <div className="flex items-center gap-4 pt-1 text-slate-500 text-[11px]">
                  <span>Current Score: <strong className="text-slate-800">{currentPriority.score}%</strong></span>
                  <span>•</span>
                  <span>Target Benchmark: <strong className="text-slate-800">{currentPriority.targetScore}%</strong></span>
                  <span>•</span>
                  <span>Skill Gap: <strong className="text-rose-600">-{currentPriority.gapPercent}%</strong></span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={() => handleContinueLearning(recommendedCourses[0])}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{currentPriority.courseProgress > 0 ? 'Continue Learning' : 'Start Recommended Course'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Course Recommendations Connected to Skill Gaps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recommended Courses</h3>
            <p className="text-xs text-slate-500">Curated specifically to eliminate evaluated skill gaps and target campus benchmarks</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('courses')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            <span>Browse Full Catalog</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendedCourses.map((rec) => (
            <div key={rec.id} className="saas-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                    {rec.skillName}
                  </span>
                  <Badge variant={rec.status === 'Completed' ? 'success' : rec.status === 'In Progress' ? 'primary' : 'neutral'} size="xs">
                    {rec.status}
                  </Badge>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">
                  {rec.courseTitle}
                </h4>

                <div className="grid grid-cols-3 gap-2 py-3 my-2 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Score</span>
                    <span className="font-bold text-slate-800">{rec.currentScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Target</span>
                    <span className="font-bold text-slate-800">{rec.targetScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Gap</span>
                    <span className="font-bold text-rose-600">-{rec.gapPercent}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Course Progress</span>
                    <span className="font-bold text-slate-700">{rec.progressPercent}%</span>
                  </div>
                  <ProgressBar value={rec.progressPercent} size="sm" color="indigo" showPercentage={false} />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 flex items-center gap-2 font-medium">
                  <span>{rec.difficulty}</span>
                  <span>•</span>
                  <span>{rec.duration}</span>
                </div>

                <button
                  onClick={() => handleContinueLearning(rec)}
                  disabled={!rec.hasMatchingCourse}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>{rec.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Canonical 6 Roadmap Stages Progression Grid & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        
        {/* Left Column: Milestone Stages Timeline (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-base font-bold text-slate-900">Placement Roadmap Milestones</h3>
              <p className="text-xs text-slate-500">Structured 6-stage sequence from foundation to campus drive clearance</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">6 Stages</span>
          </div>

          <div className="space-y-2.5">
            {stages.map((stage) => {
              const isSelected = activeStage?.step_number === stage.step_number;
              const isSaving = savingNodeId === stage.step_number;

              return (
                <div
                  key={stage.step_number}
                  onClick={() => setActiveStage(stage)}
                  className={`saas-card p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-all ${
                    isSelected ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' : 'hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    stage.completed 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                      : isSelected 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {stage.completed ? '✓' : stage.step_number}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {stage.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{stage.target_hours} hrs</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{stage.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{stage.description}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStage(stage);
                    }}
                    disabled={isSaving}
                    title={stage.completed ? 'Mark stage incomplete' : 'Mark stage complete'}
                    className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                      stage.completed 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                        : 'bg-white text-slate-400 border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    {stage.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Stage Details & Actions (5 Cols) */}
        {activeStage && (
          <div className="lg:col-span-5 space-y-4">
            <div className="saas-card p-6 space-y-5 sticky top-24">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    STAGE {activeStage.step_number} OF 6
                  </span>
                  <Badge variant={activeStage.completed ? 'success' : 'primary'} size="xs">
                    {activeStage.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{activeStage.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{activeStage.description}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Key Competency Modules:</span>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {activeStage.keyTopics?.map((t, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <button
                  onClick={() => handleToggleStage(activeStage)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeStage.completed 
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{activeStage.completed ? 'Mark Stage Incomplete' : 'Mark Stage as Completed'}</span>
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('assessments')}
                  className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Take Diagnostic Assessment for Stage</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 5. Adaptive Preparation & Retake Cycle Card (Continuous Improvement Loop) */}
      <div className="saas-card p-6 sm:p-7 bg-slate-50 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Continuous Retake & Mastery Loop</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              How practice and assessment retakes continuously adapt your learning path and placement readiness
            </p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('assessments')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <span>Retake Diagnostic Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-4 text-center">
          {[
            { step: '1. Learn', desc: 'Course Modules', active: true },
            { step: '2. Practice', desc: 'Problem Drills', active: true },
            { step: '3. Assess', desc: 'Retake Test', active: true },
            { step: '4. New Score', desc: 'Saved to DB', active: true },
            { step: '5. Gap Update', desc: 'Recalculation', active: true },
            { step: '6. Path Adapts', desc: 'New Priorities', active: true },
            { step: '7. Readiness ↑', desc: 'Campus Ready', active: true }
          ].map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
              <span className="font-bold text-indigo-600 block text-[11px]">{item.step}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
