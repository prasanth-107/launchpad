import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  ArrowRight,
  FileText,
  Mic2,
  BookOpen,
  Building2,
  Sparkles,
  Award,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
  RotateCcw,
  Kanban,
  ListFilter,
  Check,
  Briefcase
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { dal } from '../lib/supabaseClient';
import {
  APPLICATION_STATUSES,
  STATUS_METADATA,
  KANBAN_COLUMNS,
  isValidStatusTransition,
  getValidNextStatuses,
  computeNextAction,
  calculateApplicationStatistics,
  getUpcomingApplicationEvent,
  formatDate
} from '../lib/applicationPipelineEngine';
import { PLACEMENT_OPPORTUNITIES_CATALOG, computeJobMatchScore, evaluateCandidateEligibility } from '../lib/jobMatchingEngine';

export default function ApplicationTrackingView({ user, onNavigate, onApplicationUpdated }) {
  // View mode: 'kanban' | 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'applied' | 'company' | 'match'

  // Data states
  const [applications, setApplications] = useState([]);
  const [candidateContext, setCandidateContext] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedApp, setSelectedApp] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { targetStatus, label, isDestructive }
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Date scheduling states in modal
  const [editingDates, setEditingDates] = useState(false);
  const [assessmentDateInput, setAssessmentDateInput] = useState('');
  const [interviewDateInput, setInterviewDateInput] = useState('');

  // 1. Fetch user applications & candidate context
  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [apps, profile, userSkills, attempts, latestResume, interviews, progress] = await Promise.all([
        dal.applications.list(user.id),
        dal.profiles.get(user.id),
        dal.skills.getUserSkills(user.id),
        dal.assessments.getAttempts(user.id),
        dal.resumes.getLatest(user.id),
        dal.interviews.list(user.id),
        dal.courses.getProgress(user.id)
      ]);

      setApplications(apps || []);
      setCandidateContext({
        profile: profile || user,
        userSkills: userSkills || [],
        attempts: attempts || [],
        latestResume: latestResume || null,
        interviews: interviews || [],
        progress: progress || []
      });
    } catch (err) {
      console.warn('Could not load application tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Sync selectedApp details when opened
  useEffect(() => {
    if (selectedApp) {
      setNoteText(selectedApp.notes || '');
      setAssessmentDateInput(selectedApp.assessment_date ? selectedApp.assessment_date.slice(0, 10) : '');
      setInterviewDateInput(selectedApp.interview_date ? selectedApp.interview_date.slice(0, 10) : '');
      setEditingDates(false);
    }
  }, [selectedApp]);

  // Merge application with opportunity catalog metadata & real match score
  const enrichedApplications = useMemo(() => {
    return applications.map(app => {
      const oppId = app.opportunity_id || app.job_id;
      const opp = PLACEMENT_OPPORTUNITIES_CATALOG.find(o => o.id === oppId) || null;

      let matchScore = null;
      let matchTier = 'Unassessed';
      let matchTierVariant = 'neutral';
      let eligibility = { status: 'eligibility_unknown', reasons: [] };

      if (opp && candidateContext) {
        const match = computeJobMatchScore(candidateContext, opp);
        matchScore = match.matchScore;
        matchTier = match.tier;
        matchTierVariant = match.tierVariant;
        eligibility = evaluateCandidateEligibility({
          department: candidateContext.profile?.department,
          year: candidateContext.profile?.year,
          cgpa: candidateContext.profile?.cgpa,
          backlogs: candidateContext.profile?.backlogs,
          userSkills: candidateContext.userSkills
        }, opp);
      }

      const nextAction = computeNextAction(app, candidateContext);

      return {
        ...app,
        opportunity: opp,
        package: opp?.package || 'Standard Campus CTC',
        location: opp?.location || 'India (Pan-Campus)',
        work_mode: opp?.work_mode || 'On-site',
        application_url: app.application_url || opp?.application_url || '',
        matchScore,
        matchTier,
        matchTierVariant,
        eligibility,
        nextAction
      };
    });
  }, [applications, candidateContext]);

  // Pipeline Statistics
  const stats = useMemo(() => {
    return calculateApplicationStatistics(applications);
  }, [applications]);

  // Upcoming Event
  const upcomingEvent = useMemo(() => {
    return getUpcomingApplicationEvent(applications);
  }, [applications]);

  // Filter & Search
  const filteredApplications = useMemo(() => {
    return enrichedApplications.filter(app => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesComp = (app.company_name || '').toLowerCase().includes(q);
        const matchesRole = (app.role_title || '').toLowerCase().includes(q);
        if (!matchesComp && !matchesRole) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          if (!STATUS_METADATA[app.status]?.isActive) return false;
        } else if (app.status !== statusFilter) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updated_at || b.applied_at).getTime() - new Date(a.updated_at || a.applied_at).getTime();
      }
      if (sortBy === 'applied') {
        return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      }
      if (sortBy === 'company') {
        return (a.company_name || '').localeCompare(b.company_name || '');
      }
      if (sortBy === 'match') {
        if (a.matchScore === null) return 1;
        if (b.matchScore === null) return -1;
        return b.matchScore - a.matchScore;
      }
      return 0;
    });
  }, [enrichedApplications, search, statusFilter, sortBy]);

  // Status Change Handler
  const handleStatusChange = async (appId, targetStatus, extraFields = {}) => {
    if (!user?.id || !appId) return;

    try {
      const updated = await dal.applications.updateStatus(user.id, appId, targetStatus, extraFields);
      if (updated && !updated.error) {
        setApplications(prev => prev.map(a => a.id === appId ? { ...a, ...updated } : a));
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp(prev => ({ ...prev, ...updated }));
        }
        if (onApplicationUpdated) onApplicationUpdated();
      } else if (updated?.error) {
        alert(updated.error);
      }
    } catch (err) {
      console.error('Error updating application status:', err);
    } finally {
      setConfirmAction(null);
    }
  };

  // Save Private Notes
  const handleSaveNote = async () => {
    if (!user?.id || !selectedApp) return;
    setSavingNote(true);

    try {
      const updated = await dal.applications.updateNotes(user.id, selectedApp.id, noteText);
      if (updated) {
        setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, notes: noteText } : a));
        setSelectedApp(prev => ({ ...prev, notes: noteText }));
        setNoteSavedFeedback(true);
        setTimeout(() => setNoteSavedFeedback(false), 2500);
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // Save Scheduled Dates
  const handleSaveDates = async () => {
    if (!user?.id || !selectedApp) return;

    const dates = {
      assessment_date: assessmentDateInput ? new Date(assessmentDateInput).toISOString() : null,
      interview_date: interviewDateInput ? new Date(interviewDateInput).toISOString() : null
    };

    try {
      const updated = await dal.applications.updateDates(user.id, selectedApp.id, dates);
      if (updated) {
        setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...dates } : a));
        setSelectedApp(prev => ({ ...prev, ...dates }));
        setEditingDates(false);
        if (onApplicationUpdated) onApplicationUpdated();
      }
    } catch (err) {
      console.error('Error saving dates:', err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-600" />
            <span>Application Tracking & Placement Pipeline</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time candidate recruitment tracking from portal submission to official campus selection.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('job-opportunities')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore Drives</span>
          </button>
        </div>
      </div>

      {/* 2. Placement Pipeline KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Applications */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Applications</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.activeCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ {stats.total} total</span>
          </div>
          <p className="text-[11px] text-slate-500">In-progress recruitment stages</p>
        </div>

        {/* Interview Rounds */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Interview Pipeline</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-700 tracking-tight">
              {stats.interviewCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({stats.interviewRate !== null ? `${stats.interviewRate}% conversion` : '—'})
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Candidates reaching technical/HR rounds</p>
        </div>

        {/* Job Offers */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Offers Extended</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {stats.offerCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({stats.offerRate !== null ? `${stats.offerRate}% offer rate` : '—'})
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Formal letters of intent received</p>
        </div>

        {/* Final Selections */}
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selected / Placed</span>
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700 tracking-tight">
              {stats.selectedCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({stats.selectionRate !== null ? `${stats.selectionRate}% final clear` : '—'})
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Official campus placement confirmed</p>
        </div>

      </div>

      {/* 3. Upcoming Event / Next Action Banner */}
      {upcomingEvent.hasEvent && (
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                  {upcomingEvent.hasDate ? 'UPCOMING SCHEDULED ACTION' : 'RECOMMENDED NEXT PREPARATION'}
                </span>
                {upcomingEvent.badgeText && (
                  <Badge variant="primary" size="xs">{upcomingEvent.badgeText}</Badge>
                )}
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {upcomingEvent.title}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {upcomingEvent.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate(upcomingEvent.targetTab || 'assessments')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>{upcomingEvent.actionLabel || 'Proceed'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Controls Bar: View Mode, Search, Filter & Sort */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80 w-fit">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Pipeline Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Audit History List</span>
            </button>
          </div>

          {/* Right: Search, Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search company or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Stages ({stats.total})</option>
              <option value="active">Active Only ({stats.activeCount})</option>
              <option value={APPLICATION_STATUSES.APPLIED}>Applied ({stats.appliedCount})</option>
              <option value={APPLICATION_STATUSES.ASSESSMENT}>Assessment ({stats.assessmentCount})</option>
              <option value={APPLICATION_STATUSES.INTERVIEW}>Interview ({stats.interviewCount})</option>
              <option value={APPLICATION_STATUSES.OFFER}>Offer ({stats.offerCount})</option>
              <option value={APPLICATION_STATUSES.SELECTED}>Selected ({stats.selectedCount})</option>
              <option value={APPLICATION_STATUSES.REJECTED}>Rejected ({stats.rejectedCount})</option>
              <option value={APPLICATION_STATUSES.WITHDRAWN}>Withdrawn ({stats.withdrawnCount})</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="applied">Application Date</option>
              <option value="company">Company Name</option>
              <option value="match">Match Score</option>
            </select>

          </div>

        </div>
      </div>

      {/* 5. MAIN CONTENT: Kanban Board OR Detailed History List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-600">Loading Application Tracking Pipeline...</p>
        </div>
      ) : applications.length === 0 ? (
        /* REQUIRED HONEST EMPTY STATE FOR NEW CANDIDATE */
        <div className="py-16 text-center saas-card p-8 space-y-4 max-w-xl mx-auto border-dashed border-2 border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">No Applications Tracked Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Your placement journey starts here. Explore campus recruitment drives, verify your eligibility and job match, and apply to track your progress through assessment and interview rounds.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('job-opportunities')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>Explore Placement Opportunities</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map(colKey => {
              const meta = STATUS_METADATA[colKey];
              const colApps = filteredApplications.filter(a => a.status === colKey);

              return (
                <div key={colKey} className="rounded-2xl bg-slate-100/70 border border-slate-200/80 p-3 flex flex-col min-w-[220px]">
                  
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        colKey === 'applied' ? 'bg-indigo-500' :
                        colKey === 'assessment' ? 'bg-amber-500' :
                        colKey === 'interview' ? 'bg-purple-500' :
                        colKey === 'offer' ? 'bg-emerald-500' :
                        colKey === 'selected' ? 'bg-indigo-700' : 'bg-slate-400'
                      }`} />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        {meta.shortLabel}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-extrabold text-slate-600">
                      {colApps.length}
                    </span>
                  </div>

                  {/* Column Application Cards */}
                  <div className="space-y-2.5 min-h-[140px]">
                    {colApps.length === 0 ? (
                      <div className="h-28 flex items-center justify-center border-2 border-dashed border-slate-200/80 rounded-xl text-[11px] text-slate-400 font-medium text-center p-2">
                        No {meta.shortLabel.toLowerCase()} applications
                      </div>
                    ) : (
                      colApps.map(app => {
                        const validNext = getValidNextStatuses(app.status);

                        return (
                          <div
                            key={app.id}
                            onClick={() => setSelectedApp(app)}
                            className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all cursor-pointer group space-y-2.5 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                                  {app.company_name}
                                </span>
                                <span className="text-[11px] text-slate-500 block truncate">
                                  {app.role_title}
                                </span>
                              </div>
                              {app.matchScore !== null ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                  {app.matchScore}%
                                </span>
                              ) : null}
                            </div>

                            {/* Scheduled dates pill if available */}
                            {app.interview_date && (
                              <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                <Mic2 className="w-3 h-3" />
                                <span>Interview: {formatDate(app.interview_date)}</span>
                              </div>
                            )}
                            {app.assessment_date && (
                              <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Assessment: {formatDate(app.assessment_date)}</span>
                              </div>
                            )}

                            {/* Quick Next Stage Advance Trigger */}
                            {validNext.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {formatDate(app.applied_at)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const primaryNext = validNext.find(s => s !== 'rejected' && s !== 'withdrawn') || validNext[0];
                                    handleStatusChange(app.id, primaryNext);
                                  }}
                                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                  title={`Advance to ${STATUS_METADATA[validNext[0]]?.label}`}
                                >
                                  <span>Move to {STATUS_METADATA[validNext.find(s => s !== 'rejected' && s !== 'withdrawn') || validNext[0]]?.shortLabel}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Separate Section for Rejected & Withdrawn Applications */}
          {(stats.rejectedCount > 0 || stats.withdrawnCount > 0) && (
            <div className="pt-4 border-t border-slate-200/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Archived & Closed Applications ({stats.rejectedCount + stats.withdrawnCount})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredApplications.filter(a => a.status === 'rejected' || a.status === 'withdrawn').map(app => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800 truncate">{app.company_name}</span>
                      <Badge variant={app.status === 'rejected' ? 'danger' : 'neutral'} size="xs">
                        {STATUS_METADATA[app.status]?.label}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate">{app.role_title}</span>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span>Applied: {formatDate(app.applied_at)}</span>
                      {app.status === 'withdrawn' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(app.id, APPLICATION_STATUSES.APPLIED);
                          }}
                          className="text-indigo-600 font-bold hover:underline cursor-pointer"
                        >
                          Re-apply
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DETAILED AUDIT HISTORY LIST VIEW */
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Company & Target Role</th>
                  <th className="py-3 px-4">Recruitment Stage</th>
                  <th className="py-3 px-4">Match Fit</th>
                  <th className="py-3 px-4">Application Date</th>
                  <th className="py-3 px-4">Next Recommended Step</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {app.company_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{app.company_name}</span>
                          <span className="text-[11px] text-slate-500">{app.role_title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={STATUS_METADATA[app.status]?.badgeVariant || 'neutral'} size="xs">
                        {STATUS_METADATA[app.status]?.label}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.matchScore !== null ? (
                        <span className="font-extrabold text-indigo-700">{app.matchScore}% Match</span>
                      ) : (
                        <span className="text-slate-400 font-mono">— %</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDate(app.applied_at)}
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <span className="font-medium text-slate-700 line-clamp-1">{app.nextAction.text}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. APPLICATION DETAILS & STAGE MANAGEMENT MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
                  {selectedApp.company_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedApp.company_name}</h3>
                    <Badge variant={STATUS_METADATA[selectedApp.status]?.badgeVariant || 'neutral'} size="xs">
                      {STATUS_METADATA[selectedApp.status]?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedApp.role_title} • {selectedApp.package}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STAGE ADVANCE CONTROLS */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Update Placement Stage
              </span>
              
              <div className="flex flex-wrap items-center gap-2">
                {getValidNextStatuses(selectedApp.status).map(targetStatus => {
                  const meta = STATUS_METADATA[targetStatus];
                  const isDestructive = targetStatus === 'rejected' || targetStatus === 'withdrawn';

                  return (
                    <button
                      key={targetStatus}
                      type="button"
                      onClick={() => {
                        if (isDestructive) {
                          setConfirmAction({
                            targetStatus,
                            label: meta.label,
                            isDestructive
                          });
                        } else {
                          handleStatusChange(selectedApp.id, targetStatus);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isDestructive
                          ? 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                      }`}
                    >
                      <span>Move to {meta.label}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  );
                })}

                {getValidNextStatuses(selectedApp.status).length === 0 && (
                  <span className="text-xs text-slate-500 italic">
                    This application is in a completed stage ({STATUS_METADATA[selectedApp.status]?.label}).
                  </span>
                )}
              </div>

              {/* Confirmation Alert Box for Destructive / Terminal Actions */}
              {confirmAction && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                  <p className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Are you sure you want to mark this application as {confirmAction.label}?</span>
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedApp.id, confirmAction.targetStatus)}
                      className="px-3 py-1 rounded bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer"
                    >
                      Confirm {confirmAction.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction(null)}
                      className="px-3 py-1 rounded border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RECRUITMENT SCHEDULE & DATES */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Scheduled Recruitment Dates</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditingDates(!editingDates)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {editingDates ? 'Cancel' : 'Edit Dates'}
                </button>
              </div>

              {editingDates ? (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assessment Date</label>
                      <input
                        type="date"
                        value={assessmentDateInput}
                        onChange={(e) => setAssessmentDateInput(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Interview Date</label>
                      <input
                        type="date"
                        value={interviewDateInput}
                        onChange={(e) => setInterviewDateInput(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveDates}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 cursor-pointer"
                  >
                    Save Dates
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Assessment Round</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {formatDate(selectedApp.assessment_date)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Interview Round</span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {formatDate(selectedApp.interview_date)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CANDIDATE FIT & PREPARATION RECOMMENDATIONS */}
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-2.5 text-xs">
              <span className="font-bold text-purple-900 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Preparation & Readiness Integration</span>
              </span>
              <p className="text-purple-800 text-xs">
                {selectedApp.nextAction.reason}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApp(null);
                    if (onNavigate) onNavigate(selectedApp.nextAction.targetTab);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {selectedApp.nextAction.actionLabel} →
                </button>
              </div>
            </div>

            {/* PRIVATE NOTES SECTION */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Candidate Private Notes</span>
                </span>
                {noteSavedFeedback && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Log interviewer questions, recruiter advice, preparation topics..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingNote ? 'Saving...' : 'Save Notes'}
              </button>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {selectedApp.application_url ? (
                <a
                  href={selectedApp.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                >
                  <span>Open Official Recruitment Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
