import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  PlusCircle, 
  Sparkles, 
  BarChart3, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { apiClient } from '../api/client';

export default function AdminPanelView() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'add_question' | 'add_topic'

  // Question Form State
  const [newQuestionCategory, setNewQuestionCategory] = useState('Python');
  const [newQuestionType, setNewQuestionType] = useState('mcq');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState('Medium');
  const [newQuestionOptions, setNewQuestionOptions] = useState('Option A, Option B, Option C, Option D');
  const [newQuestionCorrectIdx, setNewQuestionCorrectIdx] = useState(0);
  const [newQuestionExplanation, setNewQuestionExplanation] = useState('');
  const [questionSuccess, setQuestionSuccess] = useState('');

  // Topic Form State
  const [topicCategoryKey, setTopicCategoryKey] = useState('programming');
  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicSubtopics, setTopicSubtopics] = useState('');
  const [topicSuccess, setTopicSuccess] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [sRes, stuRes] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getAdminStudents()
      ]);
      setStats(sRes);
      setStudents(stuRes.students || []);
    } catch (err) {
      console.error('Failed to load admin metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setQuestionSuccess('');
    try {
      const payload = {
        category: newQuestionCategory,
        type: newQuestionType,
        question: newQuestionText,
        difficulty: newQuestionDifficulty,
        skill: newQuestionCategory,
        options: newQuestionType === 'mcq' ? newQuestionOptions.split(',').map(s => s.trim()) : undefined,
        correctIndex: newQuestionType === 'mcq' ? parseInt(newQuestionCorrectIdx) : undefined,
        explanation: newQuestionExplanation
      };
      const res = await apiClient.addAdminQuestion(payload);
      setQuestionSuccess(res.message || 'Question added successfully!');
      setNewQuestionText('');
      setNewQuestionExplanation('');
      loadAdminData();
    } catch (err) {
      console.error('Failed to add question', err);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    setTopicSuccess('');
    try {
      const payload = {
        category_key: topicCategoryKey,
        name: topicName,
        description: topicDesc,
        topics: topicSubtopics.split(',').map(s => s.trim()).filter(Boolean)
      };
      const res = await apiClient.addAdminTopic(payload);
      setTopicSuccess(res.message || 'Topic created successfully!');
      setTopicName('');
      setTopicDesc('');
      setTopicSubtopics('');
    } catch (err) {
      console.error('Failed to add topic', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="pb-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Platform Administrator Console</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Admin Management Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor platform usage, review student readiness cohorts, and expand assessment and learning question banks.
        </p>
      </div>

      {/* Metrics Row */}
      {stats?.metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="saas-card p-5">
            <span className="text-xs text-slate-500 font-medium">Total Students</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.metrics.total_students}</p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Active across cohorts</span>
          </div>

          <div className="saas-card p-5">
            <span className="text-xs text-slate-500 font-medium">Assessments Done</span>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">{stats.metrics.assessments_completed}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Automated evaluations</span>
          </div>

          <div className="saas-card p-5">
            <span className="text-xs text-slate-500 font-medium">Mock Interviews</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">{stats.metrics.interviews_conducted}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Voice & text sessions</span>
          </div>

          <div className="saas-card p-5">
            <span className="text-xs text-slate-500 font-medium">Questions in Bank</span>
            <p className="text-2xl sm:text-3xl font-black text-sky-600 mt-1">{stats.metrics.total_questions}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">MCQ & Code challenges</span>
          </div>

          <div className="saas-card p-5 col-span-2 lg:col-span-1">
            <span className="text-xs text-slate-500 font-medium">Average Readiness</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.metrics.average_readiness_score}%</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Placement index</span>
          </div>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 font-semibold border-b-2 transition-colors mr-6 ${
            activeTab === 'metrics' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Students Directory & Analytics
        </button>
        <button
          onClick={() => setActiveTab('add_question')}
          className={`pb-3 font-semibold border-b-2 transition-colors mr-6 ${
            activeTab === 'add_question' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Add Assessment Question
        </button>
        <button
          onClick={() => setActiveTab('add_topic')}
          className={`pb-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'add_topic' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Add Learning Topic
        </button>
      </div>

      {/* Tab 1: Students Directory */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="saas-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Registered Students & Readiness Cohort</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live student directory and campus placement progress telemetry</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">College & Dept</th>
                    <th className="p-3.5">Target Role</th>
                    <th className="p-3.5">Placement Readiness</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map((stu) => (
                    <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{stu.name}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{stu.email}</td>
                      <td className="p-3.5">{stu.college} • {stu.department}</td>
                      <td className="p-3.5 text-indigo-700 font-medium">{stu.preferred_job_role}</td>
                      <td className="p-3.5 font-bold text-emerald-600">{stu.readiness}%</td>
                      <td className="p-3.5">
                        <Badge variant="primary" size="xs">
                          {stu.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Popular Topics List */}
          {stats?.popular_topics && (
            <div className="saas-card p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Most Practiced Placement Topics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.popular_topics.map((t, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{t.name}</p>
                      <p className="text-[11px] text-slate-500">{t.category}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-semibold border border-indigo-100">
                      {t.completions} completions
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Add Question */}
      {activeTab === 'add_question' && (
        <div className="saas-card max-w-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Add Question to Question Bank</h3>
          <p className="text-xs text-slate-500 mb-6">Create new technical or aptitude questions for candidate evaluations.</p>

          {questionSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{questionSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={newQuestionCategory}
                  onChange={(e) => setNewQuestionCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  {['Python', 'SQL', 'Data Structures', 'C', 'C++', 'Java', 'HTML', 'CSS', 'JavaScript', 'Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Difficulty</label>
                <select
                  value={newQuestionDifficulty}
                  onChange={(e) => setNewQuestionDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Question Prompt</label>
              <textarea
                rows={3}
                required
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Enter the question text..."
                className="w-full p-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {newQuestionType === 'mcq' && (
              <>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Options (Comma-separated 4 options)</label>
                  <input
                    type="text"
                    required
                    value={newQuestionOptions}
                    onChange={(e) => setNewQuestionOptions(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3, Option 4"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Correct Option Index (0 to 3)</label>
                  <select
                    value={newQuestionCorrectIdx}
                    onChange={(e) => setNewQuestionCorrectIdx(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={0}>Option 1 (Index 0)</option>
                    <option value={1}>Option 2 (Index 1)</option>
                    <option value={2}>Option 3 (Index 2)</option>
                    <option value={3}>Option 4 (Index 3)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Explanation</label>
              <textarea
                rows={2}
                value={newQuestionExplanation}
                onChange={(e) => setNewQuestionExplanation(e.target.value)}
                placeholder="Explain why this answer is correct..."
                className="w-full p-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Add Question to Assessment Database
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Add Topic */}
      {activeTab === 'add_topic' && (
        <div className="saas-card max-w-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Learning Topic</h3>
          <p className="text-xs text-slate-500 mb-6">Expand the 7-layer content curriculum.</p>

          {topicSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{topicSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddTopic} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Content Category Layer</label>
              <select
                value={topicCategoryKey}
                onChange={(e) => setTopicCategoryKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="programming">Programming</option>
                <option value="web_development">Web Development</option>
                <option value="database">Database</option>
                <option value="data_structures">Data Structures</option>
                <option value="aptitude">Aptitude</option>
                <option value="interview_prep">Interview Prep</option>
                <option value="resume_prep">Resume Prep</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Topic Name</label>
              <input
                type="text"
                required
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g. Docker & Container Fundamentals"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Description</label>
              <textarea
                rows={2}
                required
                value={topicDesc}
                onChange={(e) => setTopicDesc(e.target.value)}
                placeholder="Provide a concise summary of what students will learn..."
                className="w-full p-3 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Subtopics (Comma-separated)</label>
              <input
                type="text"
                value={topicSubtopics}
                onChange={(e) => setTopicSubtopics(e.target.value)}
                placeholder="e.g. Images, Containers, Dockerfile, Compose"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Save Topic to Content Database
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
