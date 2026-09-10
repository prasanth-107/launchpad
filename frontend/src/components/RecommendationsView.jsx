import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Target, 
  CheckCircle2, 
  ExternalLink, 
  Video, 
  BookOpen, 
  Play, 
  AlertCircle, 
  ArrowRight,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { apiClient } from '../api/client';

export default function RecommendationsView({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecs() {
      try {
        setLoading(true);
        const res = await apiClient.getRecommendations(user?.id || 'student-demo-101');
        setData(res);
      } catch (err) {
        console.error('Failed to load recommendations', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecs();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Synthesis Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Placement Recommendations</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Synthesizes your diagnostic assessments, mock interview transcripts, resume keywords, and career goal into a single action plan.
        </p>
      </div>

      {/* Primary Weak Area Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Priority Focus Area Detected</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Weak Area: {data?.weak_area_detected || 'SQL & Relational Databases'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {data?.recommended_next_step}
          </p>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('assessments')}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 shrink-0"
        >
          <span>Retake Diagnostic</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2-Column Split: Topics & Practice (Left) vs Videos & Resources (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Targeted Topics & Practice Challenges */}
        <div className="space-y-6">
          
          {/* Priority Study Topics */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              Prioritized Learning Topics
            </h3>

            <div className="space-y-3">
              {data?.recommended_topics?.map((top, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{top.title}</span>
                    <span className="text-[11px] text-slate-400">{top.reason}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    top.urgency === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {top.urgency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Practice & Interview Questions */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Recommended Practice Questions & Mock Tasks
            </h3>

            <div className="space-y-2.5">
              {data?.recommended_practice?.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}

              {data?.recommended_interview_prep?.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 font-bold text-[11px]">
                    ★
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Handpicked YouTube Videos & Verified Websites */}
        <div className="space-y-6">
          
          {/* Handpicked Videos */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-rose-500" />
              Recommended YouTube Tutorials
            </h3>

            <div className="space-y-3">
              {data?.recommended_videos?.map((vid, idx) => (
                <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 items-center">
                  <img 
                    src={vid.thumbnail} 
                    alt={vid.title} 
                    className="w-24 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{vid.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{vid.channel} • {vid.duration}</p>
                    <a
                      href={`https://www.youtube.com/watch?v=${vid.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 mt-1"
                    >
                      <Play className="w-3 h-3 fill-current" /> Watch Lesson
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Official Links */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Trusted Documentation & Learning Portals
            </h3>

            <div className="space-y-3">
              {data?.recommended_websites?.map((site, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{site.name}</span>
                    <span className="text-[11px] text-slate-400">{site.description}</span>
                  </div>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-colors shrink-0 ml-3"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
