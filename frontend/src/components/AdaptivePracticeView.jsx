import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  BookOpen,
  HelpCircle,
  Clock,
  Target,
  BarChart3,
  Award,
  Briefcase,
  AlertTriangle,
  Flame,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { dal } from '../lib/supabaseClient';
import {
  QUESTION_PRIORITY_TIERS,
  ADAPTIVE_DIFFICULTY_TIERS,
  selectAdaptiveQuestions,
  computeNextAdaptiveDifficulty,
  getRecommendedCourseForSkill,
  generateQuestionExplanation,
  VERIFIED_QUESTION_BANK
} from '../lib/questionIntelligenceEngine';

const AVAILABLE_SKILLS = [
  { id: 'all', name: 'Recommended For You (Adaptive Mix)' },
  { id: 'SQL', name: 'SQL & Relational Databases' },
  { id: 'DSA', name: 'Data Structures & Algorithms' },
  { id: 'React', name: 'React.js & Components' },
  { id: 'JavaScript', name: 'JavaScript (ES6+)' },
  { id: 'Python', name: 'Python Programming' },
  { id: 'Java', name: 'Core Java & OOP' },
  { id: 'C++', name: 'C++ & System Basics' },
  { id: 'Web Architecture', name: 'Web Architecture & System Design' },
  { id: 'Behavioral', name: 'Behavioral & STAR Method' }
];

export default function AdaptivePracticeView({ user, onNavigate, practiceOpportunity = null }) {
  const [loading, setLoading] = useState(true);
  const [candidateContext, setCandidateContext] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(practiceOpportunity?.missingSkills?.[0] || 'all');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  
  // Adaptive State
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentDifficulty, setCurrentDifficulty] = useState('Medium');
  const [sessionAttempts, setSessionAttempts] = useState([]);
  const [difficultyTransition, setDifficultyTransition] = useState(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [recommendedCourse, setRecommendedCourse] = useState(null);
  
  // Completion State
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  
  // History tab
  const [activeTab, setActiveTab] = useState('practice');
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [practiceStats, setPracticeStats] = useState(null);

  // Load candidate profile, assessments, interviews, and past practice
  const loadData = async () => {
    setLoading(true);
    try {
      const userId = user?.id || 'demo-user-123';
      const [
        profile,
        userSkills,
        attempts,
        interviews,
        resumes,
        courseProgress,
        history,
        stats
      ] = await Promise.all([
        dal.profiles.get(userId),
        dal.user_skills.getByUser(userId),
        dal.assessment_attempts.getByUser(userId),
        dal.mock_interviews.getByUser(userId),
        dal.resumes.getByUser(userId),
        dal.course_progress.getByUser(userId),
        dal.adaptivePractice.getSessions(userId, 10),
        dal.adaptivePractice.getPracticeSummary(userId)
      ]);

      const context = {
        profile,
        userSkills,
        attempts,
        interviews,
        resumes,
        courseProgress,
        targetRole: profile?.target_role || profile?.preferred_job_role || 'Software Engineer',
        targetOpportunity: practiceOpportunity
      };
      setCandidateContext(context);
      setPracticeHistory(history || []);
      setPracticeStats(stats);

      // Start new practice session with selected skill
      startNewSession(context, selectedSkill);
    } catch (err) {
      console.error('Failed to load adaptive practice data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, practiceOpportunity]);

  // Start or reset a practice session
  const startNewSession = async (context = candidateContext, skill = selectedSkill) => {
    const targetSkill = skill === 'all' ? null : skill;
    const initialQuestions = selectAdaptiveQuestions(context, {
      targetSkill,
      targetOpportunity: practiceOpportunity,
      limit: 5
    });

    if (initialQuestions.length === 0) return;

    const firstQ = initialQuestions[0];
    const initDiff = firstQ.difficulty || 'Medium';

    // Create session in DAL
    const userId = user?.id || 'demo-user-123';
    let newSessionId = `aps-${Date.now()}`;
    try {
      const created = await dal.adaptivePractice.createSession({
        id: newSessionId,
        user_id: userId,
        skill: targetSkill || 'Recommended Mix',
        topic: firstQ.topic || 'General Practice',
        initial_difficulty: initDiff,
        current_difficulty: initDiff,
        priority_tier: firstQ.priorityTier || 'P5',
        priority_reason: firstQ.priorityReason,
        target_role: context?.targetRole || null,
        target_opportunity_id: practiceOpportunity?.id || null
      });
      if (created?.id) newSessionId = created.id;
    } catch (e) {
      console.warn('Could not persist session remotely, using local state:', e);
    }

    setCurrentSessionId(newSessionId);
    setQuestions(initialQuestions);
    setCurrentIndex(0);
    setCurrentDifficulty(initDiff);
    setSelectedAnswer(null);
    setSubmitted(false);
    setIsCorrect(false);
    setSessionAttempts([]);
    setDifficultyTransition(null);
    setNeedsReview(false);
    setRecommendedCourse(null);
    setSessionCompleted(false);
    setSessionSummary(null);
  };

  const handleSkillChange = (newSkill) => {
    setSelectedSkill(newSkill);
    if (candidateContext) {
      startNewSession(candidateContext, newSkill);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || submitted) return;

    const currentQ = questions[currentIndex];
    const correct = selectedAnswer === currentQ.correctAnswer;
    setIsCorrect(correct);
    setSubmitted(true);

    const attemptRecord = {
      questionId: currentQ.id,
      skill: currentQ.skill,
      difficulty: currentDifficulty,
      isCorrect: correct,
      timeSpent: 15
    };

    const updatedAttempts = [...sessionAttempts, attemptRecord];
    setSessionAttempts(updatedAttempts);

    // Compute next adaptive difficulty
    const nextDiffResult = computeNextAdaptiveDifficulty(currentDifficulty, updatedAttempts);

    // Persist attempt to DAL
    try {
      await dal.adaptivePractice.recordAttempt({
        session_id: currentSessionId,
        user_id: user?.id || 'demo-user-123',
        question_id: currentQ.id,
        skill: currentQ.skill,
        difficulty: currentDifficulty,
        question_order: currentIndex + 1,
        selected_answer: selectedAnswer,
        correct_answer: currentQ.correctAnswer,
        is_correct: correct,
        difficulty_transition: nextDiffResult.direction,
        next_difficulty: nextDiffResult.nextDifficulty
      });
    } catch (e) {
      console.warn('Could not record attempt remotely:', e);
    }

    // Set transition notice
    if (nextDiffResult.changed) {
      setDifficultyTransition({
        direction: nextDiffResult.direction,
        nextDifficulty: nextDiffResult.nextDifficulty,
        reason: nextDiffResult.reason
      });
      setCurrentDifficulty(nextDiffResult.nextDifficulty);
    } else {
      setDifficultyTransition(null);
    }

    // Handle repeated struggle -> recommend course
    if (nextDiffResult.needsReview) {
      setNeedsReview(true);
      const course = getRecommendedCourseForSkill(currentQ.skill);
      setRecommendedCourse(course);
    }
  };

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedAnswer(null);
      setSubmitted(false);
      setIsCorrect(false);
      setDifficultyTransition(null);
    } else {
      // Complete Session
      const total = questions.length;
      const correctCount = sessionAttempts.filter(a => a.isCorrect).length + (isCorrect ? 1 : 0);
      const accuracy = Math.round((correctCount / total) * 100);

      const summary = {
        totalQuestions: total,
        correctCount,
        accuracy,
        finalDifficulty: currentDifficulty,
        completedAt: new Date().toISOString()
      };

      try {
        await dal.adaptivePractice.completeSession(currentSessionId, {
          total_questions: total,
          correct_count: correctCount,
          accuracy_percentage: accuracy
        });
      } catch (e) {
        console.warn('Could not complete session remotely:', e);
      }

      setSessionSummary(summary);
      setSessionCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Selecting personalized adaptive questions...</p>
        <p className="text-xs text-slate-400 mt-1">Grounding questions in your evaluated skill gaps & target opportunities</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const priorityInfo = currentQ?.priorityTier ? QUESTION_PRIORITY_TIERS[currentQ.priorityTier] : null;
  const difficultyInfo = ADAPTIVE_DIFFICULTY_TIERS[currentDifficulty.toUpperCase()] || ADAPTIVE_DIFFICULTY_TIERS.MEDIUM;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Brain className="w-5 h-5" />
              </span>
              <Badge variant="primary" size="sm">Phase 16 Intelligence</Badge>
              {practiceOpportunity && (
                <Badge variant="warning" size="sm" className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  Targeting {practiceOpportunity.company_name}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Adaptive Practice & Question Intelligence
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Questions prioritized by your verified skill gaps, assessment history, and campus drive requirements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'practice'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Practice Console
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Past Sessions ({practiceHistory.length})
            </button>
          </div>
        </div>

        {/* Skill Selector & Current Adaptive Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Topic:</span>
            <select
              value={selectedSkill}
              onChange={(e) => handleSkillChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {AVAILABLE_SKILLS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Difficulty:</span>
              <Badge variant={difficultyInfo.variant} size="sm">
                <Zap className="w-3 h-3" />
                {currentDifficulty}
              </Badge>
            </div>

            {priorityInfo && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Priority:</span>
                <Badge variant={priorityInfo.variant} size="sm">
                  {priorityInfo.code}: {priorityInfo.label}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* History & Telemetry View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Questions</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{practiceStats?.totalQuestions || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Answered across all adaptive sessions</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Accuracy</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-2">{practiceStats?.overallAccuracy || 0}%</p>
              <p className="text-xs text-slate-400 mt-1">{practiceStats?.correctCount || 0} correct answers</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Sessions</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">{practiceStats?.completedSessions || 0}</p>
              <p className="text-xs text-slate-400 mt-1">Full 5-question adaptive drills</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Recent Practice Sessions</h3>
              <p className="text-xs text-slate-500">Persistent history recorded in Supabase / DAL</p>
            </div>

            {practiceHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Brain className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No practice sessions completed yet.</p>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                >
                  Start Your First Session
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {practiceHistory.map((sess, idx) => (
                  <div key={sess.id || idx} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{sess.skill}</span>
                        <Badge variant="neutral" size="xs">{sess.current_difficulty || sess.initial_difficulty}</Badge>
                        <Badge variant={sess.status === 'completed' ? 'success' : 'warning'} size="xs">{sess.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{sess.priority_reason || 'Campus placement drill'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">{sess.accuracy_percentage ?? 0}%</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : sessionCompleted ? (
        /* Session Completed Screen */
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Session Complete!</h2>
            <p className="text-sm text-slate-600 mt-1">
              You finished 5 adaptive placement practice questions in <span className="font-semibold text-slate-800">{selectedSkill === 'all' ? 'Recommended Mix' : selectedSkill}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
            <div className="p-4 bg-slate-50 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase">Accuracy</span>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">{sessionSummary?.accuracy}%</p>
              <p className="text-xs text-slate-500 mt-0.5">{sessionSummary?.correctCount} of {sessionSummary?.totalQuestions} correct</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase">Final Difficulty</span>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{sessionSummary?.finalDifficulty}</p>
              <p className="text-xs text-slate-500 mt-0.5">Adapted dynamically</p>
            </div>
          </div>

          {needsReview && recommendedCourse && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Foundational Concept Review Recommended
              </div>
              <p className="text-xs text-amber-700">
                You faced challenges on consecutive questions. Review the foundational module:
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-900">{recommendedCourse.title}</span>
                <button
                  onClick={() => onNavigate && onNavigate('courses')}
                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  Go to Course
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => startNewSession(candidateContext, selectedSkill)}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm shadow-indigo-100"
            >
              <RotateCcw className="w-4 h-4" />
              Practice Another Set
            </button>
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      ) : currentQ ? (
        /* Active Question Console */
        <div className="space-y-6">
          {/* Why This Question? Grounded Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg mt-0.5">
              <Target className="w-4 h-4" />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Why This Question? (Grounded Telemetry)
                </span>
                {currentQ.companyTags && currentQ.companyTags.length > 0 && (
                  <span className="text-xs text-slate-500">
                    Asked by: <span className="font-semibold text-slate-700">{currentQ.companyTags.join(', ')}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {currentQ.priorityReason || generateQuestionExplanation(currentQ, candidateContext)}
              </p>
            </div>
          </div>

          {/* Difficulty Transition Banner */}
          {difficultyTransition && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              difficultyTransition.direction === 'up'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {difficultyTransition.direction === 'up' ? (
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <TrendingUp className="w-5 h-5 text-amber-600 shrink-0 rotate-180" />
              )}
              <div className="text-xs">
                <span className="font-bold">Adaptive Adjustment: </span>
                {difficultyTransition.reason}
              </div>
            </div>
          )}

          {/* Question Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            {/* Question Header & Counter */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-600">{currentQ.skill} ({currentQ.topic})</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Standard Placement Timing</span>
              </div>
            </div>

            {/* Prompt */}
            <div className="text-slate-900 text-base sm:text-lg font-medium leading-relaxed">
              {currentQ.prompt}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                let optionStyle = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800';

                if (submitted) {
                  if (option === currentQ.correctAnswer) {
                    optionStyle = 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'border-rose-500 bg-rose-50/70 text-rose-900';
                  } else {
                    optionStyle = 'border-slate-200 bg-slate-50 opacity-60 text-slate-500';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-600';
                }

                return (
                  <button
                    key={idx}
                    disabled={submitted}
                    onClick={() => setSelectedAnswer(option)}
                    className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3 ${optionStyle}`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      submitted && option === currentQ.correctAnswer
                        ? 'bg-emerald-600 text-white'
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{option}</span>
                    {submitted && option === currentQ.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    {submitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submit / Next Button Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                {!submitted ? (
                  <span className="text-xs text-slate-400">Select an answer and click submit</span>
                ) : (
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <Badge variant="success" size="md">
                        <CheckCircle2 className="w-4 h-4" /> Correct Answer!
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="md">
                        <XCircle className="w-4 h-4" /> Incorrect Answer
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div>
                {!submitted ? (
                  <button
                    disabled={!selectedAnswer}
                    onClick={handleSubmitAnswer}
                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                      selectedAnswer
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm shadow-indigo-100"
                  >
                    {currentIndex + 1 < questions.length ? 'Next Question' : 'Finish Session'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Pedagogical Explanation Card (Post-Submission) */}
            {submitted && currentQ.explanation && (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Pedagogical Concept & Placement Takeaway
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {currentQ.explanation}
                </p>

                {needsReview && recommendedCourse && (
                  <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-xs text-amber-800">
                      <span className="font-semibold">Struggling with {currentQ.skill}?</span> Recommended module: {recommendedCourse.title}
                    </div>
                    <button
                      onClick={() => onNavigate && onNavigate('courses')}
                      className="text-xs text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      Study Concept <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500">No questions available for this filter.</p>
          <button
            onClick={() => handleSkillChange('all')}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            Reset to Recommended Mix
          </button>
        </div>
      )}
    </div>
  );
}
