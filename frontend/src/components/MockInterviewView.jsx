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
  MessageSquare,
  BarChart2,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Play
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { apiClient } from '../api/client';
import confetti from 'canvas-confetti';

export default function MockInterviewView({ user, onInterviewCompleted }) {
  const [interviewType, setInterviewType] = useState('Technical Interview');
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  // Question & response state
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [questionPool, setQuestionPool] = useState([]);
  const [qIndex, setQIndex] = useState(0);

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

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
        setStudentAnswer(transcript);
      };

      recognizer.onerror = () => setIsRecording(false);
      recognizer.onend = () => setIsRecording(false);
      recognitionRef.current = recognizer;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type directly.');
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

  const startInterview = async (type) => {
    setInterviewType(type);
    setSessionActive(true);
    setConversation([]);
    setCurrentEvaluation(null);
    setStudentAnswer('');
    setQIndex(0);

    try {
      const sessionRes = await apiClient.startInterview(
        user?.id || 'student-demo-101',
        type,
        user?.preferred_job_role || 'Full Stack Software Engineer'
      );
      setSessionId(sessionRes.session?.id);

      const qRes = await apiClient.getInterviewQuestions();
      let key = 'technical';
      if (type.includes('HR')) key = 'hr';
      else if (type.includes('Behavioral')) key = 'behavioral';
      else if (type.includes('Role')) key = 'role_based';

      const pool = qRes.categories?.[key]?.questions || [];
      setQuestionPool(pool);
      if (pool.length > 0) {
        setCurrentQuestion(pool[0].question);
      } else {
        setCurrentQuestion("Can you walk me through your background and your most technically challenging project?");
      }
    } catch (err) {
      console.error('Failed to start interview', err);
      setCurrentQuestion("Tell me about a technical project you built and the key architecture decisions you made.");
    }
  };

  const handleSendAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!studentAnswer.trim() || evaluating) return;

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setEvaluating(true);
    const answerText = studentAnswer.trim();

    try {
      const evalRes = await apiClient.evaluateInterviewAnswer({
        session_id: sessionId,
        user_id: user?.id || 'student-demo-101',
        interview_type: interviewType,
        question: currentQuestion,
        student_answer: answerText
      });

      const evalData = evalRes.evaluation;
      setCurrentEvaluation(evalData);

      setConversation(prev => [
        ...prev,
        {
          question: currentQuestion,
          studentAnswer: answerText,
          evaluation: evalData
        }
      ]);

      if (evalData.overall_score >= 75) {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      }

      if (onInterviewCompleted) {
        onInterviewCompleted(evalRes.updated_readiness);
      }

      if (evalData.follow_up) {
        setCurrentQuestion(evalData.follow_up);
      } else if (qIndex + 1 < questionPool.length) {
        setQIndex(prev => prev + 1);
        setCurrentQuestion(questionPool[qIndex + 1].question);
      } else {
        setCurrentQuestion("Excellent. Do you have any questions for the engineering leadership team?");
      }

      setStudentAnswer('');
    } catch (err) {
      console.error('Failed to evaluate answer', err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          AI Mock Interview Console
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Simulate realistic campus recruitment interviews with automated rubric grading and constructive feedback.
        </p>
      </div>

      {!sessionActive ? (
        /* Interview Selection Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              type: 'Technical Interview',
              title: 'Core Technical Round',
              desc: 'Pointers, memory, database normalization, REST idempotency, and algorithm trade-offs.',
              difficulty: 'Intermediate'
            },
            {
              type: 'HR Interview',
              title: 'HR Culture Fit Round',
              desc: 'Self introduction pitch, strengths & weaknesses, leadership trajectory, and company values.',
              difficulty: 'Standard'
            },
            {
              type: 'Behavioral Interview',
              title: 'Behavioral Round',
              desc: 'STAR framework evaluation on handling conflict, project pressure, and team deadlines.',
              difficulty: 'Advanced'
            },
            {
              type: 'Role-based Interview',
              title: 'Role-Specific Technical',
              desc: 'Full stack development, system troubleshooting, frontend caching, and API performance.',
              difficulty: 'Advanced'
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="saas-card p-6 flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <Badge variant="primary" size="xs">
                    {item.difficulty}
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-mono">15-20 Mins</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => startInterview(item.type)}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Start Simulation</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Professional 3-Column Interview Interface */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Interview Information & Progress (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="saas-card p-5 space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Interview Info</span>
                <Badge variant="primary" size="xs">Live Session</Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Interview Type</span>
                  <p className="font-bold text-slate-900 mt-0.5">{interviewType}</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Candidate Role</span>
                  <p className="font-bold text-slate-900 mt-0.5">{user?.preferred_job_role || 'Full Stack Software Engineer'}</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Difficulty Level</span>
                  <p className="font-bold text-slate-900 mt-0.5">Placement Standard (Medium)</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Question Progress</span>
                  <p className="font-bold text-slate-900 mt-0.5">Question {qIndex + 1} of {Math.max(qIndex + 1, questionPool.length || 3)}</p>
                  <ProgressBar value={Math.min(100, Math.round(((qIndex + 1) / Math.max(3, questionPool.length)) * 100))} size="xs" color="indigo" showPercentage={false} className="mt-1" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSessionActive(false)}
                  className="w-full py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>

          {/* CENTER: Current Question & Answer Area (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Question Card */}
            <div className="saas-card p-6 border-l-4 border-l-indigo-600">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-1.5 uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Interviewer Question:</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                "{currentQuestion}"
              </h2>
            </div>

            {/* Answer Response Area */}
            <form onSubmit={handleSendAnswer} className="saas-card p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Your Response:</span>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isRecording 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? 'Listening (Click to Stop)' : 'Voice Input'}</span>
                </button>
              </div>

              <textarea
                rows={6}
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Structure your response clearly using the STAR format (Situation, Task, Action, Result) or articulate your technical reasoning..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  {studentAnswer.split(/\s+/).filter(Boolean).length} words
                </span>

                <button
                  type="submit"
                  disabled={evaluating || !studentAnswer.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{evaluating ? 'AI Evaluating...' : 'Submit Answer'}</span>
                </button>
              </div>
            </form>

            {/* Previous Exchanges */}
            {conversation.length > 0 && (
              <div className="saas-card p-5 space-y-3 text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">Previous Responses in Session:</span>
                {conversation.map((c, i) => (
                  <div key={i} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <p className="font-bold text-slate-900">Q: {c.question}</p>
                    <p className="text-slate-600 italic">"{c.studentAnswer}"</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="font-semibold text-emerald-700">Score: {c.evaluation.overall_score}%</span>
                      <span className="text-slate-500">{c.evaluation.feedback}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* RIGHT: Live Insights & Rubric Scores (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="saas-card p-5 space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Interview Insights</span>
                <Badge variant="neutral" size="xs">AI Rubric</Badge>
              </div>

              {currentEvaluation ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-600">Overall Score</span>
                      <span className="font-bold text-indigo-700">{currentEvaluation.overall_score}%</span>
                    </div>
                    <ProgressBar value={currentEvaluation.overall_score} size="xs" color="indigo" showPercentage={false} />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-600">Technical Depth</span>
                      <span className="font-bold text-slate-900">{currentEvaluation.relevance_score}%</span>
                    </div>
                    <ProgressBar value={currentEvaluation.relevance_score} size="xs" color="sky" showPercentage={false} />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-600">Communication</span>
                      <span className="font-bold text-slate-900">{currentEvaluation.communication_score}%</span>
                    </div>
                    <ProgressBar value={currentEvaluation.communication_score} size="xs" color="purple" showPercentage={false} />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-600">Confidence</span>
                      <span className="font-bold text-slate-900">{currentEvaluation.confidence_score}%</span>
                    </div>
                    <ProgressBar value={currentEvaluation.confidence_score} size="xs" color="emerald" showPercentage={false} />
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Interviewer Feedback:</span>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{currentEvaluation.feedback}</p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <BarChart2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>AI rubric scores (Communication, Depth, Relevance) will display here once you submit your response.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
