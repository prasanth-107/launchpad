import React, { useState } from 'react';
import { 
  Code, 
  CheckCircle2, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  Filter, 
  Search,
  BookOpen
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { EmptyState } from './ui/EmptyState';

export default function DsaSheetsView() {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [search, setSearch] = useState('');

  const [problems, setProblems] = useState([
    { id: 1, title: 'Two Sum - Target Pair Indices', topic: 'Arrays', difficulty: 'Easy', link: 'https://leetcode.com/problems/two-sum/', solved: true },
    { id: 2, title: 'Best Time to Buy and Sell Stock', topic: 'Arrays', difficulty: 'Easy', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', solved: true },
    { id: 3, title: 'Maximum Subarray (Kadane’s Algorithm)', topic: 'Arrays', difficulty: 'Medium', link: 'https://leetcode.com/problems/maximum-subarray/', solved: true },
    { id: 4, title: 'Product of Array Except Self', topic: 'Arrays', difficulty: 'Medium', link: 'https://leetcode.com/problems/product-of-array-except-self/', solved: false },
    { id: 5, title: 'Valid Palindrome & Two Pointer Check', topic: 'Strings', difficulty: 'Easy', link: 'https://leetcode.com/problems/valid-palindrome/', solved: true },
    { id: 6, title: 'Longest Substring Without Repeating Characters', topic: 'Strings', difficulty: 'Medium', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', solved: false },
    { id: 7, title: 'Reverse a Singly Linked List', topic: 'Linked Lists', difficulty: 'Easy', link: 'https://leetcode.com/problems/reverse-linked-list/', solved: true },
    { id: 8, title: 'Merge Two Sorted Lists', topic: 'Linked Lists', difficulty: 'Easy', link: 'https://leetcode.com/problems/merge-two-sorted-lists/', solved: true },
    { id: 9, title: 'Detect Cycle in Linked List (Floyd’s Tortoise)', topic: 'Linked Lists', difficulty: 'Medium', link: 'https://leetcode.com/problems/linked-list-cycle/', solved: false },
    { id: 10, title: 'Maximum Depth of Binary Tree', topic: 'Trees', difficulty: 'Easy', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', solved: true },
    { id: 11, title: 'Invert Binary Tree', topic: 'Trees', difficulty: 'Easy', link: 'https://leetcode.com/problems/invert-binary-tree/', solved: true },
    { id: 12, title: 'Binary Tree Level Order Traversal (BFS)', topic: 'Trees', difficulty: 'Medium', link: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', solved: false },
    { id: 13, title: 'Validate Binary Search Tree', topic: 'Trees', difficulty: 'Medium', link: 'https://leetcode.com/problems/validate-binary-search-tree/', solved: false },
    { id: 14, title: 'Climbing Stairs (Fibonacci DP)', topic: 'Dynamic Programming', difficulty: 'Easy', link: 'https://leetcode.com/problems/climbing-stairs/', solved: true },
    { id: 15, title: 'Coin Change - Minimum Coins', topic: 'Dynamic Programming', difficulty: 'Medium', link: 'https://leetcode.com/problems/coin-change/', solved: false },
    { id: 16, title: 'Longest Increasing Subsequence', topic: 'Dynamic Programming', difficulty: 'Medium', link: 'https://leetcode.com/problems/longest-increasing-subsequence/', solved: false },
    { id: 17, title: 'Number of Connected Islands (Grid BFS/DFS)', topic: 'Graphs', difficulty: 'Medium', link: 'https://leetcode.com/problems/number-of-islands/', solved: false },
    { id: 18, title: 'Course Schedule (Topological Sort)', topic: 'Graphs', difficulty: 'Medium', link: 'https://leetcode.com/problems/course-schedule/', solved: false }
  ]);

  const toggleSolved = (id) => {
    setProblems(prev => prev.map(p => p.id === id ? { ...p, solved: !p.solved } : p));
  };

  const solvedCount = problems.filter(p => p.solved).length;
  const completionPercentage = Math.round((solvedCount / problems.length) * 100);

  const filteredProblems = problems.filter(p => {
    const matchesTopic = selectedTopic === 'All' || p.topic === selectedTopic;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchesTopic && matchesSearch;
  });

  return (
    <div className="space-y-6 text-left">
      
      {/* Header & Overall Solved Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Campus Placement DSA Sheets
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Carefully curated coding problems frequently asked in technical coding screening rounds.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search problem title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Progress Summary Card */}
      <div className="saas-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Curated Problem Tracker
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {solvedCount} of {problems.length} Problems Solved
            </h3>
          </div>
          <span className="text-2xl font-black text-indigo-600">
            {completionPercentage}%
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar value={completionPercentage} size="md" color="indigo" showPercentage={false} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200">
        {['All', 'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Dynamic Programming', 'Graphs'].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTopic(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedTopic === t 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Problems DataTable */}
      {filteredProblems.length === 0 ? (
        <EmptyState
          icon={Code}
          title="No problems found"
          description={search ? `No DSA problems matching "${search}". Try searching for another keyword.` : `No problems found under "${selectedTopic}".`}
          actionLabel="Clear Filters"
          onAction={() => { setSelectedTopic('All'); setSearch(''); }}
        />
      ) : (
        <div className="saas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">Status</th>
                  <th className="p-3.5">Problem Title</th>
                  <th className="p-3.5">Category Topic</th>
                  <th className="p-3.5">Difficulty</th>
                  <th className="p-3.5 text-right">Practice Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProblems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => toggleSolved(p.id)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title={p.solved ? "Mark as Unsolved" : "Mark as Solved"}
                      >
                        {p.solved ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                        )}
                      </button>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      <span className={p.solved ? 'line-through text-slate-400' : ''}>
                        {p.title}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {p.topic}
                    </td>
                    <td className="p-3.5">
                      <Badge 
                        variant={p.difficulty === 'Easy' ? 'success' : p.difficulty === 'Medium' ? 'warning' : 'danger'} 
                        size="xs"
                      >
                        {p.difficulty}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        <span>Solve</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
