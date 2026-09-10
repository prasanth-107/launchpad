import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Compass, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  Briefcase, 
  ShieldCheck, 
  Clock, 
  Target, 
  Mic2, 
  Info,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { dal } from '../lib/supabaseClient.js';
import { apiClient } from '../api/client.js';
import { 
  QUICK_PROMPTS, 
  SOURCE_LABELS, 
  detectUserIntent, 
  validateCoachResponse,
  generateDeterministicCoachResponse 
} from '../lib/careerCoachEngine.js';

export function CareerCoachView({ user, onNavigate }) {
  const [context, setContext] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Load candidate context and active chat session
  useEffect(() => {
    let isMounted = true;

    async function initializeCoach() {
      setLoadingContext(true);
      setErrorState(null);
      try {
        const userId = user?.id || 'student-demo-101';
        
        // 1. Build fresh, grounded candidate context
        const ctx = await dal.coach.buildContext(userId);
        if (isMounted) setContext(ctx);

        // 2. Load or create coach session
        const sessions = await dal.coach.getSessions(userId);
        let activeSession = sessions && sessions.length > 0 ? sessions[0] : null;
        if (!activeSession) {
          activeSession = await dal.coach.createSession(userId, 'Placement Guidance');
        }

        if (activeSession && isMounted) {
          setSessionId(activeSession.id);
          const history = await dal.coach.getMessages(activeSession.id, userId);
          if (history && history.length > 0) {
            setMessages(history.map(h => ({
              id: h.id,
              role: h.role,
              content: h.content,
              createdAt: h.created_at
            })));
          } else {
            // Seed initial welcoming message
            const welcomeMsg = generateInitialWelcome(ctx);
            setMessages([welcomeMsg]);
            await dal.coach.saveMessage(activeSession.id, userId, 'assistant', welcomeMsg.content);
          }
        }
      } catch (err) {
        console.warn('Coach initialization notice:', err);
        if (isMounted) setErrorState('Could not initialize placement copilot. Please retry.');
      } finally {
        if (isMounted) setLoadingContext(false);
      }
    }

    initializeCoach();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  function generateInitialWelcome(ctx) {
    const isNew = !ctx?.candidate?.hasEvaluatedData;
    const name = ctx?.candidate?.name || 'there';

    if (isNew) {
      return {
        id: 'msg-welcome',
        role: 'assistant',
        content: {
          summary: `Welcome to your Placement Copilot, ${name}. I am your data-grounded assistant for campus preparation.`,
          facts: [
            'Placement Readiness Index: Uncalculated (0 of 7 pillars evaluated)',
            'Diagnostic Assessments: 0 completed tests',
            'Resume ATS Status: No analyzed resume on file'
          ],
          recommendations: [
            'Take your first diagnostic assessment in Data Structures or Web Development to unlock your personalized Skill Gap audit.',
            'Upload your resume in the Resume ATS module to verify contact info, section structure, and role keywords.',
            'Review foundational roadmap stages to prepare for campus placement drives.'
          ],
          next_action: {
            label: 'Take First Diagnostic Test',
            route: 'assessments'
          },
          sources: [SOURCE_LABELS.READINESS],
          disclaimer: 'AI-generated guidance based on available platform data.'
        },
        createdAt: new Date().toISOString()
      };
    }

    const readinessScore = ctx?.readiness?.score;
    const status = ctx?.readiness?.status || 'In Progress';
    const topGap = ctx?.readiness?.priorityGap?.name || 'Core CS';

    return {
      id: 'msg-welcome',
      role: 'assistant',
      content: {
        summary: `Welcome back, ${name}. Your current Placement Readiness stands at ${readinessScore !== null ? `${readinessScore}/100` : 'In Progress'} (${status}).`,
        facts: [
          `Placement Readiness Score: ${readinessScore !== null ? `${readinessScore}/100` : 'Evaluating'}`,
          `Evaluated Pillars: ${ctx?.readiness?.coverageText || '0 of 7 pillars'}`,
          `Priority Improvement Area: ${topGap}`,
          `Active Pipeline Applications: ${ctx?.applications?.activeCount || 0}`
        ],
        recommendations: [
          `Focus your daily practice on ${topGap} to raise your overall readiness score.`,
          'Ask me any question below or pick from the quick preparation prompts.'
        ],
        next_action: {
          label: `Prepare ${topGap}`,
          route: ctx?.readiness?.priorityGap?.actionTarget || 'roadmap'
        },
        sources: [SOURCE_LABELS.READINESS, SOURCE_LABELS.LEARNING_PATH],
        disclaimer: 'AI-generated guidance based on available platform data.'
      },
      createdAt: new Date().toISOString()
    };
  }

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isGenerating) return;

    setErrorState(null);
    setInputValue('');

    const userMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: { text: query },
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    const userId = user?.id || 'student-demo-101';
    if (sessionId) {
      dal.coach.saveMessage(sessionId, userId, 'user', userMessage.content).catch(() => {});
    }

    try {
      // 1. Attempt backend AI generation via FastAPI
      let coachResponse = null;
      try {
        const authData = await dal.auth.getSession();
        const token = authData?.data?.session?.access_token || `token_${userId}`;
        const res = await apiClient.coachChat({
          message: query,
          sessionId,
          candidateContext: context,
          token
        });
        if (res && res.response) {
          coachResponse = validateCoachResponse(res.response, context);
        }
      } catch (apiErr) {
        console.warn('Backend coach call note, utilizing deterministic fallback:', apiErr);
      }

      // 2. Fallback to client deterministic engine if API unavailable
      if (!coachResponse) {
        const intent = detectUserIntent(query);
        coachResponse = generateDeterministicCoachResponse(intent, context, query);
      }

      const assistantMessage = {
        id: `msg-coach-${Date.now()}`,
        role: 'assistant',
        content: coachResponse,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (sessionId) {
        dal.coach.saveMessage(sessionId, userId, 'assistant', coachResponse).catch(() => {});
      }
    } catch (err) {
      console.error('Error generating coach response:', err);
      setErrorState('Could not generate coach guidance. Please click retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your coaching conversation history?')) return;
    const userId = user?.id || 'student-demo-101';
    if (sessionId) {
      await dal.coach.clearSession(sessionId, userId);
    }
    const welcome = generateInitialWelcome(context);
    setMessages([welcome]);
  };

  const handleDeepLink = (route) => {
    if (onNavigate && route) {
      onNavigate(route);
    }
  };

  return (
    <div className="space-y-6 text-left">

        {/* 1. Cockpit Header & Navigation */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Career Coach</h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    Placement Copilot
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Your personalized placement preparation assistant, grounded in real platform performance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
                title="Clear Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Chat
              </button>
            </div>
          </div>

          {/* 2. Real Candidate Placement Status Summary Bar */}
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Metric 1: Readiness Score */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Placement Readiness</span>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-900">
                  {context?.readiness?.score !== null && context?.readiness?.score !== undefined 
                    ? `${context.readiness.score}/100` 
                    : '—'}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  ({context?.readiness?.status || 'In Progress'})
                </span>
              </div>
            </div>

            {/* Metric 2: Strongest Area */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Strongest Area</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900 truncate" title={context?.readiness?.strongestArea?.name || 'Unassessed'}>
                {context?.readiness?.strongestArea?.name || 'Unassessed'}
              </div>
            </div>

            {/* Metric 3: Priority Gap */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Priority Skill Gap</span>
                <Target className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900 truncate" title={context?.readiness?.priorityGap?.name || 'None detected'}>
                {context?.readiness?.priorityGap?.name || 'Benchmark Met'}
              </div>
            </div>

            {/* Metric 4: Active Learning Step */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Learning Step</span>
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900 truncate" title={context?.learningPath?.activeStep?.title || 'Foundational Fundamentals'}>
                Step {context?.learningPath?.activeStep?.step_number || 1}: {context?.learningPath?.activeStep?.category || 'Foundation'}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Quick Prompt Suggestions Bar */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Suggested Questions Grounded in Your Platform Records
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p.id}
                onClick={() => handleSendMessage(p.prompt)}
                disabled={isGenerating}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 transition-all hover:border-indigo-200 shadow-2xs disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Chat Stream Area */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-[520px]">
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6 max-h-[620px]">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-xl bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm shadow-xs font-medium">
                      {typeof msg.content === 'string' ? msg.content : (msg.content?.text || JSON.stringify(msg.content))}
                    </div>
                  </div>
                );
              }

              // Assistant Structured Coach Card
              const c = typeof msg.content === 'string' ? { summary: msg.content } : (msg.content || {});
              const summary = c?.summary || 'Guidance based on current platform records.';
              const facts = c?.facts || [];
              const recommendations = c?.recommendations || [];
              const nextAction = c?.next_action || null;
              const sources = c?.sources || [SOURCE_LABELS.READINESS];
              const disclaimer = c?.disclaimer || 'AI-generated guidance based on available platform data.';

              return (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>

                  <div className="flex-1 max-w-3xl bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs p-4 sm:p-5 space-y-4 shadow-2xs">
                    {/* Summary Lead */}
                    <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                      {summary}
                    </div>

                    {/* Section 1: Observed Facts */}
                    {facts.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Observed Facts
                        </div>
                        <div className="space-y-1">
                          {facts.map((fact, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-white border border-slate-200/80 rounded-md px-2.5 py-1.5 font-medium">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                              <span>{fact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 2: Recommendations */}
                    {recommendations.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-indigo-600" />
                          Recommendations
                        </div>
                        <ul className="space-y-1.5">
                          {recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed font-normal">
                              <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Section 3: Next Best Action Card (Deep Link) */}
                    {nextAction && (
                      <div className="bg-indigo-50/80 border border-indigo-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Recommended Platform Action</span>
                          <span className="text-xs font-semibold text-slate-900 block">{nextAction.label}</span>
                        </div>
                        <button
                          onClick={() => handleDeepLink(nextAction.route)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs self-start sm:self-auto shrink-0"
                        >
                          <span>{nextAction.label}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Footer Sources & Disclaimer */}
                    <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sources.map((src, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-medium">
                            <Info className="w-2.5 h-2.5" />
                            {src}
                          </span>
                        ))}
                      </div>
                      <div className="italic text-slate-500">
                        {disclaimer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Generating Loading State */}
            {isGenerating && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs font-medium text-slate-600 flex items-center gap-2.5 shadow-2xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Synthesizing grounded placement guidance from candidate records...</span>
                </div>
              </div>
            )}

            {/* Error & Retry Banner */}
            {errorState && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorState}</span>
                </div>
                <button
                  onClick={() => handleSendMessage(inputValue || 'What should I do today?')}
                  className="px-2.5 py-1 rounded bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 5. Interactive Chat Input Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/50 rounded-b-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about readiness, skill gaps, resume, interviews, or applications..."
                disabled={isGenerating || loadingContext}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isGenerating || loadingContext || !inputValue.trim()}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-xs sm:text-sm font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs gap-1.5 shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600 px-1">
              <span>Press Enter to send. Only information from verified platform data is used.</span>
              <span>100% Grounded</span>
            </div>
          </div>
        </div>

    </div>
  );
}

export default CareerCoachView;
