import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Code2, 
  Terminal, 
  Coffee, 
  FileCode, 
  Layout, 
  Palette, 
  Zap, 
  Database, 
  Binary, 
  Calculator, 
  BrainCircuit, 
  MessageSquare,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Play,
  Filter,
  Search
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { apiClient } from '../api/client';
import confetti from 'canvas-confetti';

export default function AssessmentView({ user, onAssessmentCompleted }) {
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Upcoming' | 'Completed' | 'In Progress'
  const [categories, setCategories] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Quiz running state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [timerActive, setTimerActive] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Table of assessment rows
  const [assessmentList, setAssessmentList] = useState([
    { id: 'Python', name: 'Python Programming Diagnostic', category: 'Programming', questions: 10, duration: '15 mins', status: 'Completed', score: 80 },
    { id: 'SQL', name: 'SQL Queries & Relational DB Test', category: 'Database', questions: 12, duration: '15 mins', status: 'Upcoming', score: null },
    { id: 'Data Structures', name: 'Data Structures & Algorithms Core', category: 'Data Structures', questions: 10, duration: '20 mins', status: 'Upcoming', score: null },
    { id: 'JavaScript', name: 'JavaScript (ES6+) Fundamentals', category: 'Web Development', questions: 10, duration: '15 mins', status: 'Completed', score: 85 },
    { id: 'Quantitative Aptitude', name: 'Speed Math & Quantitative Aptitude', category: 'Aptitude', questions: 15, duration: '20 mins', status: 'Upcoming', score: null },
    { id: 'Logical Reasoning', name: 'Logical Reasoning & Syllogisms', category: 'Aptitude', questions: 12, duration: '15 mins', status: 'Completed', score: 75 },
    { id: 'Verbal Ability', name: 'Verbal Ability & Comprehension', category: 'Aptitude', questions: 10, duration: '12 mins', status: 'In Progress', score: null },
    { id: 'Java', name: 'Java OOP & Collections Framework', category: 'Programming', questions: 10, duration: '15 mins', status: 'Upcoming', score: null },
    { id: 'C++', name: 'C++ & Standard Template Library', category: 'Programming', questions: 10, duration: '15 mins', status: 'Upcoming', score: null },
    { id: 'HTML', name: 'Modern HTML5 & Web Semantics', category: 'Web Development', questions: 8, duration: '10 mins', status: 'Completed', score: 90 }
  ]);

  // Load categories from backend
  useEffect(() => {
    async function loadCats() {
      try {
        const res = await apiClient.getAssessmentCategories();
        setCategories(res);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCats();
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startQuiz = async (categoryId) => {
    setLoading(true);
    setSelectedCategory(categoryId);
    setIsSubmitted(false);
    setResult(null);
    setAnswers({});
    setCurrentQuestionIdx(0);

    try {
      const res = await apiClient.getQuestions(categoryId);
      setQuizData(res);
      const minutes = res.duration_minutes || 10;
      setTimeLeft(minutes * 60);
      setTimerActive(true);
    } catch (err) {
      console.error('Failed to load questions', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleCodeChange = (qId, code) => {
    setAnswers(prev => ({ ...prev, [qId]: code }));
  };

  const handleSubmit = async () => {
    setTimerActive(false);
    setSubmitting(true);
    const duration = quizData?.duration_minutes ? (quizData.duration_minutes * 60) - timeLeft : 300;

    try {
      const submitPayload = {
        user_id: user?.id || 'student-demo-101',
        category: selectedCategory,
        answers: answers,
        time_spent_seconds: Math.max(10, duration)
      };
      const res = await apiClient.submitAssessment(submitPayload);
      setResult(res);
      setIsSubmitted(true);
      if (res.percentage >= 70) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      }

      // Update status in list
      setAssessmentList(prev => prev.map(a => 
        a.id === selectedCategory ? { ...a, status: 'Completed', score: res.percentage } : a
      ));

      if (onAssessmentCompleted) {
        onAssessmentCompleted(res);
      }
    } catch (err) {
      console.error('Submission failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredList = assessmentList.filter(a => {
    if (activeTab === 'All') return true;
    return a.status === activeTab;
  });

  // 1. Result View
  if (isSubmitted && result) {
    return (
      <div className="space-y-6 text-left max-w-4xl mx-auto">
        <div className="saas-card p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Results</span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{result.category} Assessment</h2>
              <p className="text-xs text-slate-500 mt-1">
                Completed in {Math.round(result.time_spent_seconds / 60)} minutes • Score: {result.score} / {result.total}
              </p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-extrabold text-indigo-600 font-mono">{result.percentage}%</span>
              <span className="block text-xs text-slate-400 mt-0.5">Final Score</span>
            </div>
          </div>

          {/* AI Gap Analysis */}
          {result.ai_analysis && (
            <div className="my-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-600" />
                AI Skill Gap Diagnosis
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-semibold text-emerald-700 block mb-1">Identified Strong Areas:</span>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    {result.ai_analysis.strong_skills?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="p-3.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-semibold text-rose-700 block mb-1">Diagnosed Weak Areas:</span>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    {result.ai_analysis.weak_skills?.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>

              {result.ai_analysis.recommended_topics?.length > 0 && (
                <div className="pt-1">
                  <span className="font-semibold text-slate-700 block mb-1.5">Recommended Study Topics:</span>
                  <div className="flex flex-wrap gap-2">
                    {result.ai_analysis.recommended_topics.map((top, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                        {top}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
            >
              Back to Assessments List
            </button>
          </div>
        </div>

        {/* Detailed Answers */}
        <div className="saas-card p-6 sm:p-7 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Detailed Answer Review</h3>
          <div className="space-y-3 text-xs">
            {result.detailed_breakdown?.map((item, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border ${
                  item.is_correct ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-slate-900">Q{idx + 1}: {item.question}</p>
                  <Badge variant={item.is_correct ? 'success' : 'danger'} size="xs">
                    {item.is_correct ? 'Correct' : 'Incorrect'}
                  </Badge>
                </div>
                {item.explanation && (
                  <p className="text-slate-600 mt-2 pt-2 border-t border-slate-200/60 leading-relaxed">
                    <strong>Explanation:</strong> {item.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Test Playing Interface
  if (selectedCategory && quizData) {
    const questions = quizData.questions || [];
    const currentQ = questions[currentQuestionIdx];

    return (
      <div className="space-y-6 text-left max-w-4xl mx-auto">
        {/* Test Header */}
        <div className="saas-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{selectedCategory} Test</span>
            <h2 className="text-lg font-bold text-slate-900">Question {currentQuestionIdx + 1} of {questions.length}</h2>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs ${
            timeLeft < 120 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question Palette Pills */}
        <div className="saas-card p-3 flex flex-wrap gap-2">
          {questions.map((q, i) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = i === currentQuestionIdx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIdx(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  isCurrent 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : isAnswered 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {/* Question Body */}
        {currentQ && (
          <div className="saas-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <Badge variant="neutral" size="xs">
                {currentQ.type === 'coding' ? 'Coding Task' : 'Multiple Choice'}
              </Badge>
              <span>Difficulty: <strong className="text-slate-800">{currentQ.difficulty}</strong></span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.question}
            </h3>

            {/* Options */}
            {currentQ.type === 'mcq' && currentQ.options && (
              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQ.id] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Coding Challenge Editor */}
            {currentQ.type === 'coding' && (
              <div className="space-y-3 font-mono text-xs">
                <textarea
                  rows={8}
                  defaultValue={answers[currentQ.id] || currentQ.initialCode || '# Write your solution\n'}
                  onChange={(e) => handleCodeChange(currentQ.id, e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-900 text-emerald-400 focus:outline-none resize-none font-mono"
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>

              {currentQuestionIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Next Question
                </button>
              ) : (
                <button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Standard List View with Tabs
  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Skill Assessments
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Take standardized technical and aptitude assessments to benchmark your placement readiness score.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm">
        {['All', 'Upcoming', 'Completed', 'In Progress'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 font-semibold border-b-2 mr-6 transition-colors ${
              activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Assessment DataTable */}
      <div className="saas-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Assessment Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Questions</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">
                    {row.name}
                  </td>
                  <td className="p-3.5 text-slate-500">
                    {row.category}
                  </td>
                  <td className="p-3.5 font-mono">
                    {row.questions} Qs
                  </td>
                  <td className="p-3.5 font-mono">
                    {row.duration}
                  </td>
                  <td className="p-3.5">
                    <Badge 
                      variant={row.status === 'Completed' ? 'success' : row.status === 'In Progress' ? 'warning' : 'primary'} 
                      size="xs"
                    >
                      {row.status === 'Completed' ? `Completed (${row.score}%)` : row.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => startQuiz(row.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-semibold transition-colors"
                    >
                      {row.status === 'Completed' ? 'Retake' : 'Start Test'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
