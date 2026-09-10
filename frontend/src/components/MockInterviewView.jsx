import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Award, 
  RotateCcw, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageSquare, 
  BarChart2, 
  AlertCircle, 
  HelpCircle, 
  Briefcase, 
  Play,
  Volume2,
  Square,
  ArrowRight,
  History,
  User,
  Check,
  Flame,
  FileText,
  Layers
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { dal } from '../lib/supabaseClient';
import { 
  INTERVIEW_ROLES, 
  INTERVIEW_MODES, 
  generateInterviewQuestions, 
  evaluateCandidateAnswer, 
  computeSessionSummary 
} from '../lib/mockInterviewEngine';
import { apiClient } from '../api/client';
import confetti from 'canvas-confetti';

export default function MockInterviewView({ user, initialTab = 'simulate', onInterviewCompleted, onNavigate }) {
  // Navigation Tabs: 'simulate' | 'history'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Setup State
  const [targetRole, setTargetRole] = useState(user?.preferred_job_role || 'Full Stack Software Engineer');
  const [interviewType, setInterviewType] = useState('Mixed Placement');
  const [questionCount, setQuestionCount] = useState(3);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [loadingContext, setLoadingContext] = useState(true);

  // Session State
  const [sessionActive, setSessionActive] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [sessionExchanges, setSessionExchanges] = useState([]);
  const [latestEvaluation, setLatestEvaluation] = useState(null);
  
  // Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Completion Report State
  const [sessionSummary, setSessionSummary] = useState(null);
  const [showCompletionReport, setShowCompletionReport] = useState(false);
  const [expandedAccordionIndex, setExpandedAccordionIndex] = useState(null);

  // History State
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);

  // Speech Recognition
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Sync initialTab when prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load candidate resume context from Phase 7 (if uploaded)
  useEffect(() => {
    let isMounted = true;
    async function loadResumeContext() {
      if (!user?.id) {
        setLoadingContext(false);
        return;
      }
      try {
        const latest = await dal.resumes.getLatest(user.id);
        if (isMounted && latest?.extracted_skills) {
          setResumeSkills(latest.extracted_skills);
        }
      } catch (err) {
        console.warn('Could not load resume skills for interview:', err);
      } finally {
        if (isMounted) setLoadingContext(false);
      }
    }
    loadResumeContext();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Load Interview History
  const fetchHistory = async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const records = await dal.interviews.list(user.id);
      setInterviewHistory(records || []);
    } catch (err) {
      console.warn('Error loading interview history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, user?.id]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setStudentAnswer(prev => {
          // If transcript is fresh chunk, append cleanly
          return transcript;
        });
      };

      recognizer.onerror = () => setIsRecording(false);
      recognizer.onend = () => setIsRecording(false);
      recognitionRef.current = recognizer;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your answer directly into the response editor.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Speech recognition start failed', err);
      }
    }
  };

  // Timer Tick
  useEffect(() => {
    if (sessionActive && !showCompletionReport) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionActive, showCompletionReport]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Start Interview Session
  const handleStartInterview = () => {
    const generated = generateInterviewQuestions(
      targetRole,
      interviewType,
      resumeSkills,
      questionCount
    );

    setQuestions(generated);
    setCurrentQuestionIndex(0);
    setStudentAnswer('');
    setSessionExchanges([]);
    setLatestEvaluation(null);
    setSessionSummary(null);
    setShowCompletionReport(false);
    setElapsedSeconds(0);
    setSessionActive(true);
  };

  // Submit Answer to Current Question
  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!studentAnswer.trim() || evaluating) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setEvaluating(true);
    const currentQ = questions[currentQuestionIndex];
    const answerText = studentAnswer.trim();

    // 1. Evaluate using grounded deterministic rubric engine
    const localEval = evaluateCandidateAnswer({
      question: currentQ,
      studentAnswer: answerText,
      interviewType,
      role: targetRole
    });

    let finalEval = localEval;

    // 2. Optional companion backend enhancement if available
    try {
      const backendRes = await apiClient.evaluateInterviewAnswer({
        user_id: user?.id || 'demo-candidate',
        interview_type: interviewType,
        question: currentQ.text || currentQ.question,
        student_answer: answerText
      });
      if (backendRes?.evaluation?.overall_score) {
        finalEval = {
          ...localEval,
          ...backendRes.evaluation,
          overall_score: Number(backendRes.evaluation.overall_score) || localEval.overall_score,
          technical_score: Number(backendRes.evaluation.technical_score) || localEval.technical_score,
          communication_score: Number(backendRes.evaluation.communication_score) || localEval.communication_score,
          relevance_score: Number(backendRes.evaluation.relevance_score) || localEval.relevance_score,
          confidence_score: Number(backendRes.evaluation.confidence_score) || localEval.confidence_score,
        };
      }
    } catch (apiErr) {
      // Offline fallback: purely use deterministic localEval
    }

    setLatestEvaluation(finalEval);

    const exchange = {
      question: currentQ.text || currentQ.question,
      category: currentQ.category || currentQ.type,
      studentAnswer: answerText,
      evaluation: finalEval
    };

    const updatedExchanges = [...sessionExchanges, exchange];
    setSessionExchanges(updatedExchanges);
    setStudentAnswer('');

    // Check if more questions remain
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setEvaluating(false);
    } else {
      // All questions completed -> Generate Final Session Report
      finishInterviewSession(updatedExchanges);
      setEvaluating(false);
    }
  };

  // Skip Current Question
  const handleSkipQuestion = () => {
    const currentQ = questions[currentQuestionIndex];
    const skippedEval = {
      overall_score: 0,
      overallScore: 0,
      technical_score: 0,
      technicalScore: 0,
      communication_score: 0,
      communicationScore: 0,
      relevance_score: 0,
      relevanceScore: 0,
      confidence_score: 0,
      confidenceScore: 0,
      feedback: 'Question was skipped by candidate.',
      strengths: [],
      weaknesses: ['Question was skipped without response.'],
      follow_up: 'Prepare for this topic in future campus interviews.'
    };

    const exchange = {
      question: currentQ.text || currentQ.question,
      category: currentQ.category || currentQ.type,
      studentAnswer: '[Skipped]',
      evaluation: skippedEval
    };

    const updatedExchanges = [...sessionExchanges, exchange];
    setSessionExchanges(updatedExchanges);
    setStudentAnswer('');

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishInterviewSession(updatedExchanges);
    }
  };

  // End Interview Session Early or on Finish
  const finishInterviewSession = async (exchanges) => {
    const summary = computeSessionSummary(exchanges, targetRole, interviewType);
    setSessionSummary(summary);
    setShowCompletionReport(true);
    setSessionActive(false);

    if (summary.overallScore >= 75) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }

    // Persist real record to Supabase
    if (user?.id) {
      try {
        const savedRecord = await dal.interviews.save(user.id, {
          target_role: targetRole,
          interview_type: interviewType,
          overall_score: summary.overallScore || 0,
          technical_score: summary.technicalScore || 0,
          communication_score: summary.communicationScore || 0,
          relevance_score: summary.relevanceScore || 0,
          confidence_score: summary.confidenceScore || 0,
          transcript: summary.exchanges,
          ai_feedback: `${summary.statusTier}: ${summary.statusDescription}`
        });

        if (onInterviewCompleted) {
          onInterviewCompleted({
            ...summary,
            _alreadySaved: true
          });
        }
      } catch (saveErr) {
        console.warn('Could not persist interview session to Supabase:', saveErr);
      }
    }
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="space-y-6 text-left">
      
      {/* Header & Sub-navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Mic2 className="w-7 h-7 text-indigo-600" />
            <span>AI Mock Interview Console</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Simulate realistic campus recruitment rounds with real-time rubric grading, STAR method detection, and voice input.
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('simulate');
              setSelectedHistorySession(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'simulate'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Interview</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setSelectedHistorySession(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Interview History</span>
            {interviewHistory.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-semibold">
                {interviewHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: SIMULATE INTERVIEW */}
      {activeTab === 'simulate' && (
        <>
          {/* STATE 1: SETUP SCREEN */}
          {!sessionActive && !showCompletionReport && (
            <div className="space-y-6">
              
              {/* Configuration Panel */}
              <div className="saas-card p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Configure Placement Interview Session</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize your role, evaluation round, and question intensity before starting.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  
                  {/* Role Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Target Role</span>
                    </label>
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      {INTERVIEW_ROLES.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">Questions are calibrated to this job track's campus syllabus.</p>
                  </div>

                  {/* Interview Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Interview Round Mode</span>
                    </label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      {INTERVIEW_MODES.map(mode => (
                        <option key={mode.id} value={mode.id}>{mode.name}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400">
                      {INTERVIEW_MODES.find(m => m.id === interviewType)?.description}
                    </p>
                  </div>

                  {/* Question Count Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Session Length</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 4, 5].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setQuestionCount(cnt)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            questionCount === cnt
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {cnt} Questions
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">Estimated duration: ~{questionCount * 3} to {questionCount * 5} minutes.</p>
                  </div>

                </div>

                {/* Candidate Context Integration Banner (Phase 7 Resume Skills) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Candidate Context & Resume Integration</span>
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {resumeSkills.length > 0 ? (
                        <>Tailoring technical questions to skills extracted from your resume:</>
                      ) : (
                        <>No resume uploaded yet. Defaulting to standard {targetRole} placement curriculum.</>
                      )}
                    </p>
                    {resumeSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {resumeSkills.slice(0, 7).map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {resumeSkills.length === 0 && (
                    <button
                      onClick={() => onNavigate && onNavigate('resume')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 shrink-0 cursor-pointer"
                    >
                      Upload Resume →
                    </button>
                  )}
                </div>

                {/* Start Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleStartInterview}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Begin Interview Simulation</span>
                  </button>
                </div>
              </div>

              {/* Round Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INTERVIEW_MODES.map(mode => (
                  <div
                    key={mode.id}
                    onClick={() => setInterviewType(mode.id)}
                    className={`saas-card p-5 cursor-pointer transition-all border-2 ${
                      interviewType === mode.id
                        ? 'border-indigo-600 bg-indigo-50/20'
                        : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{mode.name}</span>
                      {interviewType === mode.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{mode.description}</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>4-Pillar AI Rubric</span>
                      <span>15% Composite Weight</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* STATE 2: ACTIVE INTERVIEW CONSOLE (3-COLUMN LAYOUT) */}
          {sessionActive && currentQ && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN (3 Cols): Round Info & Progress */}
              <div className="lg:col-span-3 space-y-4">
                <div className="saas-card p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Interview Session</span>
                    <Badge variant="primary" size="xs">Live Session</Badge>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Live Timer */}
                    <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Elapsed Time</span>
                      </span>
                      <span className="font-mono font-bold text-indigo-700 text-sm">{formatTimer(elapsedSeconds)}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Target Role</span>
                      <p className="font-bold text-slate-900 mt-0.5 truncate">{targetRole}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Round Mode</span>
                      <p className="font-bold text-slate-900 mt-0.5">{interviewType}</p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Question Progress</span>
                      <p className="font-bold text-slate-900 mt-0.5">Question {currentQuestionIndex + 1} of {questions.length}</p>
                      <ProgressBar 
                        value={Math.round(((currentQuestionIndex + 1) / questions.length) * 100)} 
                        size="xs" 
                        color="indigo" 
                        showPercentage={false} 
                        className="mt-1" 
                      />
                    </div>
                  </div>

                  {/* Question Navigator Pills */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Questions</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {questions.map((q, idx) => {
                        const isDone = idx < currentQuestionIndex;
                        const isCur = idx === currentQuestionIndex;
                        return (
                          <div
                            key={idx}
                            className={`py-1.5 text-center text-xs font-bold rounded-lg border transition-all ${
                              isCur
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            Q{idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => finishInterviewSession(sessionExchanges)}
                      className="w-full py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      End Session & Review
                    </button>
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN (6 Cols): Question & Candidate Editor */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* Interviewer Question Card */}
                <div className="saas-card p-6 border-l-4 border-l-indigo-600 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-600 uppercase tracking-wider">
                      <MessageSquare className="w-4 h-4" />
                      <span>Interviewer Prompt #{currentQuestionIndex + 1}</span>
                    </div>
                    <Badge variant={currentQ.type === 'HR / Behavioral' ? 'purple' : 'primary'} size="xs">
                      {currentQ.type}
                    </Badge>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed pt-1">
                    "{currentQ.text || currentQ.question}"
                  </h2>

                  {currentQ.sampleFocus && (
                    <div className="pt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                      <strong className="text-slate-700">Recommended Focus:</strong> {currentQ.sampleFocus}
                    </div>
                  )}
                </div>

                {/* Candidate Response Editor */}
                <form onSubmit={handleSubmitAnswer} className="saas-card p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Your Answer:</span>
                    
                    {/* Speech to Text Toggle Button */}
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isRecording 
                          ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>{isRecording ? 'Listening (Click to Stop)' : 'Voice Input (Mic)'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={7}
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder={
                      currentQ.type === 'HR / Behavioral'
                        ? "Structure your response with the STAR framework: Situation, Task, Action taken, and measurable Result..."
                        : "Explain your technical solution, engineering trade-offs, architecture choices, and database or performance considerations..."
                    }
                    className="w-full p-4 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none shadow-2xs font-normal"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>{studentAnswer.split(/\s+/).filter(Boolean).length} words</span>
                      <span>•</span>
                      <span>{studentAnswer.length} characters</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSkipQuestion}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Skip Question
                      </button>

                      <button
                        type="submit"
                        disabled={evaluating || !studentAnswer.trim()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs disabled:opacity-40 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{evaluating ? 'Evaluating Rubric...' : (currentQuestionIndex + 1 === questions.length ? 'Submit & View Report' : 'Submit Answer')}</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Session Exchange History in Current Run */}
                {sessionExchanges.length > 0 && (
                  <div className="saas-card p-5 space-y-3 text-xs">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Previous Answers in This Session ({sessionExchanges.length}):
                    </span>
                    <div className="space-y-2.5">
                      {sessionExchanges.map((ex, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate">Q{idx + 1}: {ex.question}</span>
                            <Badge 
                              variant={ex.evaluation.overall_score >= 75 ? 'success' : (ex.evaluation.overall_score >= 60 ? 'warning' : 'danger')} 
                              size="xs"
                            >
                              {ex.evaluation.overall_score}%
                            </Badge>
                          </div>
                          <p className="text-slate-600 italic line-clamp-2">"{ex.studentAnswer}"</p>
                          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">{ex.evaluation.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN (3 Cols): Live Insights & 4-Pillar Rubric */}
              <div className="lg:col-span-3 space-y-4">
                <div className="saas-card p-5 space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Rubric Insights</span>
                    <Badge variant="neutral" size="xs">Deterministic</Badge>
                  </div>

                  {latestEvaluation ? (
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span className="text-slate-700">Last Answer Score</span>
                          <span className="text-indigo-700">{latestEvaluation.overall_score}%</span>
                        </div>
                        <ProgressBar value={latestEvaluation.overall_score} size="xs" color="indigo" showPercentage={false} />
                      </div>

                      {/* 4 Pillars */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold mb-0.5">
                            <span className="text-slate-600">Technical Depth (35%)</span>
                            <span className="text-slate-900 font-bold">{latestEvaluation.technical_score}%</span>
                          </div>
                          <ProgressBar value={latestEvaluation.technical_score} size="xs" color="indigo" showPercentage={false} />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-semibold mb-0.5">
                            <span className="text-slate-600">Communication & Structure (25%)</span>
                            <span className="text-slate-900 font-bold">{latestEvaluation.communication_score}%</span>
                          </div>
                          <ProgressBar value={latestEvaluation.communication_score} size="xs" color="purple" showPercentage={false} />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-semibold mb-0.5">
                            <span className="text-slate-600">Relevance & Responsiveness (25%)</span>
                            <span className="text-slate-900 font-bold">{latestEvaluation.relevance_score}%</span>
                          </div>
                          <ProgressBar value={latestEvaluation.relevance_score} size="xs" color="sky" showPercentage={false} />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-semibold mb-0.5">
                            <span className="text-slate-600">Confidence & Delivery (15%)</span>
                            <span className="text-slate-900 font-bold">{latestEvaluation.confidence_score}%</span>
                          </div>
                          <ProgressBar value={latestEvaluation.confidence_score} size="xs" color="emerald" showPercentage={false} />
                        </div>
                      </div>

                      {/* Identified Strengths */}
                      {latestEvaluation.strengths && latestEvaluation.strengths.length > 0 && (
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                          <span className="font-bold text-emerald-900 text-[11px] block">Identified Strengths:</span>
                          <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                            {latestEvaluation.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Dynamic Follow-up Hint */}
                      {latestEvaluation.follow_up && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="font-bold text-slate-800 text-[11px] block">Interviewer Follow-Up:</span>
                          <p className="text-[11px] text-slate-600 italic">"{latestEvaluation.follow_up}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                      <BarChart2 className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>Scores for Technical Depth, Communication, Relevance, and Confidence will populate here upon submitting your answer.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* STATE 3: FINAL COMPLETION REPORT SCREEN */}
          {showCompletionReport && sessionSummary && (
            <div className="space-y-6">
              
              {/* Hero Overall Score Banner */}
              <div className="saas-card p-6 sm:p-8 bg-linear-to-r from-white via-slate-50/40 to-indigo-50/30 border-indigo-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">MOCK INTERVIEW EVALUATION</span>
                      <Badge variant={sessionSummary.statusVariant || 'primary'} size="xs">
                        {sessionSummary.statusTier}
                      </Badge>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {targetRole} — {interviewType}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {sessionSummary.statusDescription}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
                    <span className="text-4xl sm:text-5xl font-extrabold text-indigo-700 tracking-tight">
                      {sessionSummary.overallScore}
                    </span>
                    <span className="text-slate-400 text-base font-bold">/ 100</span>
                  </div>
                </div>

                {/* 4-Pillar Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Technical Depth</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">{sessionSummary.technicalScore}%</span>
                    </div>
                    <ProgressBar value={sessionSummary.technicalScore} size="xs" color="indigo" showPercentage={false} />
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Communication</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">{sessionSummary.communicationScore}%</span>
                    </div>
                    <ProgressBar value={sessionSummary.communicationScore} size="xs" color="purple" showPercentage={false} />
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Relevance</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">{sessionSummary.relevanceScore}%</span>
                    </div>
                    <ProgressBar value={sessionSummary.relevanceScore} size="xs" color="sky" showPercentage={false} />
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Confidence</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900">{sessionSummary.confidenceScore}%</span>
                    </div>
                    <ProgressBar value={sessionSummary.confidenceScore} size="xs" color="emerald" showPercentage={false} />
                  </div>
                </div>

                {/* Strategic Strengths & Actionable Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Demonstrated Strengths</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-emerald-900">
                      {sessionSummary.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-600" />
                      <span>Priority Action Items</span>
                    </span>
                    <div className="space-y-2 text-xs">
                      {sessionSummary.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white/80 border border-amber-200/60 space-y-0.5">
                          <span className="font-bold text-amber-950 block">{rec.title}</span>
                          <p className="text-[11px] text-amber-800">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question-by-Question Accordion Transcript */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Question Transcript & Rubric Breakdown ({sessionSummary.exchanges.length})
                  </h3>

                  <div className="space-y-2">
                    {sessionSummary.exchanges.map((ex, idx) => {
                      const isExpanded = expandedAccordionIndex === idx;
                      return (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setExpandedAccordionIndex(isExpanded ? null : idx)}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 pr-4">
                              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-900 line-clamp-1">
                                {ex.question}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <Badge 
                                variant={ex.evaluation.overall_score >= 75 ? 'success' : (ex.evaluation.overall_score >= 60 ? 'warning' : 'danger')} 
                                size="xs"
                              >
                                {ex.evaluation.overall_score}%
                              </Badge>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 pt-0 border-t border-slate-100 text-xs space-y-3 bg-slate-50/50">
                              <div className="pt-2">
                                <span className="font-bold text-slate-700 block text-[11px] mb-1">Your Submitted Response:</span>
                                <p className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700 italic leading-relaxed">
                                  "{ex.studentAnswer}"
                                </p>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                <div className="p-2 bg-white rounded border border-slate-200">
                                  <span className="text-slate-400 block">Technical Depth</span>
                                  <span className="font-bold text-slate-900">{ex.evaluation.technical_score}%</span>
                                </div>
                                <div className="p-2 bg-white rounded border border-slate-200">
                                  <span className="text-slate-400 block">Communication</span>
                                  <span className="font-bold text-slate-900">{ex.evaluation.communication_score}%</span>
                                </div>
                                <div className="p-2 bg-white rounded border border-slate-200">
                                  <span className="text-slate-400 block">Relevance</span>
                                  <span className="font-bold text-slate-900">{ex.evaluation.relevance_score}%</span>
                                </div>
                                <div className="p-2 bg-white rounded border border-slate-200">
                                  <span className="text-slate-400 block">Confidence</span>
                                  <span className="font-bold text-slate-900">{ex.evaluation.confidence_score}%</span>
                                </div>
                              </div>

                              <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                                <span className="font-bold text-slate-800 text-[11px] block">Rubric Feedback:</span>
                                <p className="text-slate-600 leading-relaxed text-[11px]">{ex.evaluation.feedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CTAs */}
                <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setShowCompletionReport(false);
                      setSessionActive(false);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Another Interview</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('history');
                        setShowCompletionReport(false);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      View History
                    </button>

                    <button
                      onClick={() => onNavigate && onNavigate('dashboard')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Back to Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}
        </>
      )}

      {/* TAB 2: INTERVIEW HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          {loadingHistory ? (
            <div className="saas-card p-12 text-center text-xs text-slate-400 space-y-2">
              <Clock className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p>Loading your mock interview records from Supabase...</p>
            </div>
          ) : interviewHistory.length === 0 ? (
            /* REQUIRED EMPTY STATE: No fabricated sessions */
            <div className="saas-card p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <Mic2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">No completed mock interviews yet.</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your mock interview history will display here once you complete your first campus simulation round.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('simulate')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start First Mock Interview</span>
              </button>
            </div>
          ) : (
            /* Real Sessions Table */
            <div className="saas-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Completed Mock Interview Sessions</h3>
                  <p className="text-xs text-slate-500">Official records saved to Supabase mock_interviews</p>
                </div>
                <Badge variant="primary" size="xs">
                  {interviewHistory.length} Sessions
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Target Role</th>
                      <th className="px-5 py-3">Round Mode</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Pillars</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {interviewHistory.map((sess, idx) => {
                      const score = Number(sess.overall_score ?? sess.overallScore ?? 0);
                      const tier = score >= 75 ? 'Strong' : (score >= 60 ? 'Good' : 'Needs Improvement');
                      const tierVariant = score >= 75 ? 'success' : (score >= 60 ? 'warning' : 'danger');

                      return (
                        <tr key={sess.id || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5 text-slate-500 font-medium">
                            {new Date(sess.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {sess.target_role || 'Full Stack Software Engineer'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {sess.interview_type || 'Technical'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-extrabold text-indigo-700 text-sm">{score}</span>
                            <span className="text-slate-400 text-[11px]"> / 100</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={tierVariant} size="xs">
                              {tier}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-[11px] text-slate-500">
                            Tech: {sess.technical_score || '—'}% • Comm: {sess.communication_score || '—'}%
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => setSelectedHistorySession(sess)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Selected Session Details Modal / Panel */}
          {selectedHistorySession && (
            <div className="saas-card p-6 border-indigo-100 bg-slate-50/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Session Details: {selectedHistorySession.target_role} ({selectedHistorySession.interview_type})
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Recorded on {new Date(selectedHistorySession.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedHistorySession(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Close ×
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Overall Score</span>
                  <span className="text-lg font-bold text-indigo-700">{selectedHistorySession.overall_score}%</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Technical Depth</span>
                  <span className="text-lg font-bold text-slate-900">{selectedHistorySession.technical_score || '—'}%</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Communication</span>
                  <span className="text-lg font-bold text-slate-900">{selectedHistorySession.communication_score || '—'}%</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Confidence</span>
                  <span className="text-lg font-bold text-slate-900">{selectedHistorySession.confidence_score || '—'}%</span>
                </div>
              </div>

              {selectedHistorySession.ai_feedback && (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">Interviewer Feedback Summary:</span>
                  <p className="text-slate-600 leading-relaxed">{selectedHistorySession.ai_feedback}</p>
                </div>
              )}

              {/* Transcript Display */}
              {Array.isArray(selectedHistorySession.transcript) && selectedHistorySession.transcript.length > 0 && (
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                    Session Transcript ({selectedHistorySession.transcript.length} questions):
                  </span>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {selectedHistorySession.transcript.map((item, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block">Q{i + 1}: {item.question}</span>
                        <p className="text-slate-600 italic">"{item.studentAnswer}"</p>
                        {item.evaluation?.feedback && (
                          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            {item.evaluation.feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
