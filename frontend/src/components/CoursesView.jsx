import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Play, 
  ArrowRight, 
  Star, 
  Layers, 
  Search, 
  Filter
} from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';

export default function CoursesView({ onNavigateToResources }) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const courses = [
    {
      id: 'c1',
      title: 'Full Stack JavaScript & Modern React',
      instructor: 'freeCodeCamp / Andrew Mead',
      category: 'Web Development',
      difficulty: 'Intermediate',
      progress: 68,
      modules: '14 Modules',
      duration: '18 hrs',
      description: 'Master ES6+, React Hooks, State Management, and client-side performance.'
    },
    {
      id: 'c2',
      title: 'SQL & Relational Database Design for Placements',
      instructor: 'Programming with Mosh',
      category: 'Database',
      difficulty: 'Beginner to Advanced',
      progress: 58,
      modules: '10 Modules',
      duration: '12 hrs',
      description: 'Indexes, transactions, JOIN operations, schema normalization, and query optimization.'
    },
    {
      id: 'c3',
      title: 'Data Structures & Algorithms Masterclass in C++/Java',
      instructor: 'Kunal Kushwaha & GFG Team',
      category: 'DSA',
      difficulty: 'Hard',
      progress: 72,
      modules: '22 Modules',
      duration: '32 hrs',
      description: 'Binary Trees, Graphs, Dynamic Programming, Two Pointers, and Binary Search.'
    },
    {
      id: 'c4',
      title: 'Python for Problem Solving & Automated Scripting',
      instructor: 'freeCodeCamp.org',
      category: 'Programming',
      difficulty: 'Beginner',
      progress: 100,
      modules: '8 Modules',
      duration: '10 hrs',
      description: 'Built-in collections, list comprehensions, recursion, and object-oriented programming.'
    },
    {
      id: 'c5',
      title: 'Campus Placement Quantitative Aptitude Tricks',
      instructor: 'CareerRide Academy',
      category: 'Aptitude',
      difficulty: 'Intermediate',
      progress: 70,
      modules: '12 Modules',
      duration: '14 hrs',
      description: 'Fast calculation shortcuts, percentage modeling, speed/distance, and logical puzzles.'
    },
    {
      id: 'c6',
      title: 'HR Behavioral Interview Mastery (STAR Method)',
      instructor: 'Linda Raynier & Senior TPO Coaches',
      category: 'Interview',
      difficulty: 'All Levels',
      progress: 80,
      modules: '6 Modules',
      duration: '6 hrs',
      description: 'Story framing, leadership conflict resolution, elevator pitch, and culture fit rounds.'
    }
  ];

  const filteredCourses = courses.filter(c => {
    const matchesFilter = selectedFilter === 'All' || c.category === selectedFilter;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Course Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Curated placement courses with verified curriculum, modules, and video lessons.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
        {['All', 'Web Development', 'DSA', 'Database', 'Programming', 'Aptitude', 'Interview'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div 
            key={course.id}
            className="saas-card p-6 flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-3">
                <Badge variant="primary" size="xs">
                  {course.category}
                </Badge>
                <span className="text-[11px] font-medium text-slate-500">{course.difficulty}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{course.title}</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">By {course.instructor}</p>
              
              <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                {course.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {course.modules}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {course.duration}
                </span>
              </div>
            </div>

            {/* Progress & Continue */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-bold text-slate-900">{course.progress}%</span>
                </div>
                <ProgressBar value={course.progress} size="xs" color={course.progress === 100 ? 'emerald' : 'indigo'} showPercentage={false} />
              </div>

              <button
                onClick={() => onNavigateToResources && onNavigateToResources(course.category.toLowerCase())}
                className="w-full py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{course.progress === 100 ? 'Review Modules' : 'Continue Course'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
