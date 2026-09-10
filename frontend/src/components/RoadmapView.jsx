import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Target, 
  Clock, 
  BookOpen, 
  Video, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  Award
} from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';
import { apiClient } from '../api/client';
import confetti from 'canvas-confetti';

export default function RoadmapView({ user, onRoadmapProgressUpdated, onNavigateToContent }) {
  const [roadmap, setRoadmap] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState(null);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getRoadmap(user?.id || 'student-demo-101');
      setRoadmap(res.roadmap || []);
      setProgress(res.progress_percentage || 0);
      if (res.roadmap && res.roadmap.length > 0) {
        const firstIncomplete = res.roadmap.find(n => !n.completed) || res.roadmap[0];
        setActiveNode(firstIncomplete);
      }
    } catch (err) {
      console.error('Failed to load roadmap', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [user]);

  const handleToggle = async (nodeId) => {
    try {
      const res = await apiClient.toggleRoadmapNode(user?.id || 'student-demo-101', nodeId);
      if (res.completed) {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      }
      setRoadmap(prev => prev.map(node => {
        if (node.id === nodeId) {
          return { ...node, completed: res.completed };
        }
        return node;
      }));
      setProgress(res.new_progress_percentage);
      if (onRoadmapProgressUpdated) {
        onRoadmapProgressUpdated(res.updated_readiness);
      }
    } catch (err) {
      console.error('Failed to toggle node', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Header & Progress Card */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              PLACEMENT LEARNING PATH
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Target Track: {user?.preferred_job_role || 'Full Stack Software Engineer'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Linear sequence engineered to bridge technical gaps before campus drive interviews.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-3xl font-black text-indigo-600">{progress}%</span>
            <span className="text-xs text-slate-400 block font-medium">Path Completed</span>
          </div>
        </div>

        <div className="mt-5">
          <ProgressBar value={progress} size="md" color="indigo" showPercentage={false} />
        </div>
      </div>

      {/* 2-Column Split: Timeline Path (Left) & Active Node Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Milestone Timeline (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-base font-bold text-slate-900">Milestone Progression</h3>
            <span className="text-xs text-slate-400 font-mono">{roadmap.length} Milestones</span>
          </div>

          <div className="space-y-2.5">
            {roadmap.map((node) => {
              const isSelected = activeNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setActiveNode(node)}
                  className={`saas-card p-4 sm:p-5 flex items-start gap-4 cursor-pointer transition-colors ${
                    isSelected ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' : 'hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    node.completed ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {node.completed ? '✓' : node.step}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {node.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{node.targetHours} hrs</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">{node.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{node.description}</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(node.id);
                    }}
                    className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                      node.completed ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-400 border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    {node.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Node Details (5 Cols) */}
        {activeNode && (
          <div className="lg:col-span-5 space-y-4">
            <div className="saas-card p-6 space-y-4 sticky top-24">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Milestone {activeNode.step} Details
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{activeNode.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{activeNode.description}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-2">Core Concepts:</span>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {activeNode.topics?.map((t, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => handleToggle(activeNode.id)}
                  className={`w-full py-2.5 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                    activeNode.completed ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{activeNode.completed ? 'Mark as Incomplete' : 'Mark as Completed'}</span>
                </button>

                <button
                  onClick={() => onNavigateToContent && onNavigateToContent(activeNode.category.toLowerCase())}
                  className="w-full py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span>View Verified Documentation</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
