import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Play, 
  ArrowRight, 
  Search, 
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { dal } from '../lib/supabaseClient';

export default function CoursesView({ user, onNavigateToResources, onCourseProgressUpdated }) {
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingCourseId, setUpdatingCourseId] = useState(null);

  const fetchCoursesAndProgress = async () => {
    try {
      setLoading(true);
      const [coursesList, userProgress] = await Promise.all([
        dal.courses.list(),
        user?.id ? dal.courses.getProgress(user.id) : []
      ]);

      setCourses(coursesList || []);
      const map = {};
      (userProgress || []).forEach(p => {
        map[p.course_id] = p;
      });
      setProgressMap(map);
    } catch (err) {
      console.error('Failed to load courses and progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndProgress();
  }, [user?.id]);

  const handleAdvanceProgress = async (course) => {
    if (!user?.id || !course) return;
    try {
      setUpdatingCourseId(course.id);
      const currentProg = progressMap[course.id]?.progress_percent || 0;
      const currentModules = progressMap[course.id]?.completed_modules || 0;
      const nextProgress = Math.min(100, currentProg + 25);
      const nextModules = Math.min(course.modules_count || 8, currentModules + 2);

      const updated = await dal.courses.updateProgress(user.id, course.id, nextProgress, nextModules);
      if (updated) {
        setProgressMap(prev => ({
          ...prev,
          [course.id]: updated
        }));
      }

      if (onCourseProgressUpdated) {
        onCourseProgressUpdated();
      }

      if (onNavigateToResources) {
        onNavigateToResources(course.category?.toLowerCase() || 'programming');
      }
    } catch (err) {
      console.error('Failed to update course progress:', err);
    } finally {
      setUpdatingCourseId(null);
    }
  };

  const categories = ['All', 'Data Structures', 'Web Development', 'Database', 'Aptitude', 'System Design', 'Communication'];

  const filteredCourses = courses.filter(c => {
    const cat = c.category || '';
    const matchesFilter = selectedFilter === 'All' || cat.toLowerCase().includes(selectedFilter.toLowerCase());
    const matchesSearch = (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Loading placement courses from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              CURRICULUM REPOSITORY
            </span>
            <Badge variant="neutral" size="xs">Verified Placement Syllabus</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Course Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Curated placement courses with verified curriculum, modules, and video lessons.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedFilter === cat 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={searchQuery ? `No courses matching "${searchQuery}". Try a different keyword.` : `No courses available in "${selectedFilter}".`}
          actionLabel="Clear Filters"
          onAction={() => { setSelectedFilter('All'); setSearchQuery(''); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((c) => {
            const userProg = progressMap[c.id];
            const progressVal = userProg?.progress_percent || 0;
            const completedModules = userProg?.completed_modules || 0;
            const isCompleted = progressVal >= 100 || userProg?.status === 'completed';
            const isStarted = progressVal > 0;
            const isUpdating = updatingCourseId === c.id;

            return (
              <div 
                key={c.id} 
                className="saas-card p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {c.category}
                    </span>
                    <Badge variant={isCompleted ? 'success' : isStarted ? 'primary' : 'neutral'} size="xs">
                      {isCompleted ? 'Completed' : isStarted ? 'In Progress' : 'Not Started'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {c.description || 'Master key placement interview concepts with structured problem sets.'}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Instructor:</span>
                      <span className="font-semibold text-slate-800">{c.instructor || 'Lead Campus Coach'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Modules:</span>
                      <span className="font-mono">{completedModules} / {c.modules_count || 8} completed</span>
                    </div>
                  </div>

                  {/* Real Course Progress Bar from course_progress table */}
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Progress</span>
                      <span className="font-bold text-slate-800">{progressVal}%</span>
                    </div>
                    <ProgressBar value={progressVal} size="sm" color="indigo" showPercentage={false} />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 font-medium">
                    <span>{c.level || 'Intermediate'} • {c.duration_hours || 15} hrs</span>
                  </div>

                  <button
                    onClick={() => handleAdvanceProgress(c)}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCompleted ? 'Review Modules' : isStarted ? 'Continue Learning' : 'Start Course'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
