import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Filter,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
  Check,
  X,
  Share2,
  Info,
  Flame,
  Target,
  FileText,
  Mic2,
  CheckSquare
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { dal } from '../lib/supabaseClient';
import { 
  PLACEMENT_OPPORTUNITIES_CATALOG,
  evaluateCandidateEligibility,
  computeJobMatchScore,
  explainJobMatch,
  getJobPreparationRecommendations,
  getDeadlineStatus
} from '../lib/jobMatchingEngine';
import { 
  evaluateAllOpportunities,
  rankOpportunities,
  classifyOpportunityDeadline,
  computeOpportunityPriority,
  generateMatchExplanation,
  mapMissingSkillsToCourses,
  generateDrivePreparationActions
} from '../lib/opportunityIntelligenceEngine';

export default function JobOpportunitiesView({ user, onNavigate }) {
  // Navigation tabs: 'all' | 'saved'
  const [activeTab, setActiveTab] = useState('all');

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All');
  const [matchFilter, setMatchFilter] = useState('All'); // 'All' | '80+' | '60-79' | 'below60'
  const [deadlineFilter, setDeadlineFilter] = useState('All'); // 'All' | 'urgent' | 'open' | 'expired'
  const [appFilter, setAppFilter] = useState('All'); // 'All' | 'not_applied' | 'active' | 'selected'
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'match' | 'deadline' | 'priority' | 'package' | 'recent'

  // Candidate context & persistence
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [trackedApplications, setTrackedApplications] = useState([]);
  const [candidateContext, setCandidateContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prepNotification, setPrepNotification] = useState('');

  // Details Modal state
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  // Load Candidate Data & Saved Jobs
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      const targetUserId = user?.id;

      try {
        if (targetUserId) {
          const [saved, apps, profile, userSkills, attempts, latestResume, interviews, progress] = await Promise.all([
            dal.savedJobs.list(targetUserId),
            dal.applications.list(targetUserId),
            dal.profiles.get(targetUserId),
            dal.skills.getUserSkills(targetUserId),
            dal.assessments.getAttempts(targetUserId),
            dal.resumes.getLatest(targetUserId),
            dal.interviews.list(targetUserId),
            dal.courses.getProgress(targetUserId)
          ]);

          if (isMounted) {
            setSavedJobIds(saved || []);
            setTrackedApplications(apps || []);
            setCandidateContext({
              profile: profile || user,
              userSkills: userSkills || [],
              attempts: attempts || [],
              latestResume: latestResume || null,
              interviews: interviews || [],
              progress: progress || []
            });
          }
        } else {
          if (isMounted) {
            setCandidateContext({
              profile: user || null,
              userSkills: [],
              attempts: [],
              latestResume: null,
              interviews: [],
              progress: []
            });
          }
        }
      } catch (err) {
        console.warn('Could not load candidate matching context:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [user]);

  // Toggle Save Job
  const handleToggleSave = async (e, jobId) => {
    e.stopPropagation();
    if (!user?.id) {
      alert('Please sign in to bookmark placement opportunities.');
      return;
    }

    try {
      const { savedJobIds: updated } = await dal.savedJobs.toggle(user.id, jobId);
      setSavedJobIds(updated || []);
    } catch (err) {
      console.error('Error toggling save job:', err);
    }
  };

  // Handle External Apply
  const handleApply = (opp) => {
    if (!opp.application_url) {
      alert('Application link is currently unavailable for this drive.');
      return;
    }

    if (opp.deadline?.isExpired) {
      alert('This placement drive has passed its deadline.');
      return;
    }

    // Record tracking event without faking external status
    if (user?.id) {
      dal.applications.create(user.id, {
        opportunity_id: opp.id,
        job_id: opp.id,
        application_url: opp.application_url,
        company_name: opp.company_name,
        role_title: opp.role_title,
        status: 'applied'
      }).then((newApp) => {
        setTrackedApplications(prev => [
          ...prev.filter(a => (a.opportunity_id !== opp.id && a.job_id !== opp.id)),
          newApp || { opportunity_id: opp.id, job_id: opp.id, status: 'applied' }
        ]);
      }).catch(err => console.warn('Could not log application tracking:', err));
    }

    // Open official company career portal safely in new tab
    window.open(opp.application_url, '_blank', 'noopener,noreferrer');
  };

  // Prepare for Drive (Phase 13 Integration)
  const handlePrepareForDrive = async (e, opp) => {
    e.stopPropagation();
    if (!user?.id) {
      if (onNavigate) onNavigate('preparation');
      return;
    }

    try {
      const actions = generateDrivePreparationActions(opp, candidateContext);
      if (actions.length > 0) {
        // Add top prep action to daily preparation actions
        await dal.preparation.toggleAction(user.id, actions[0].action_key, false);
      }
      setPrepNotification(`Preparation actions for ${opp.company_name} queued in your Preparation Workspace.`);
      setTimeout(() => setPrepNotification(''), 4000);
      if (onNavigate) onNavigate('preparation');
    } catch (err) {
      console.warn('Could not queue preparation action:', err);
      if (onNavigate) onNavigate('preparation');
    }
  };

  // Compute matches, eligibility, priority, and deadline for all opportunities
  const processedOpportunities = useMemo(() => {
    const catalog = PLACEMENT_OPPORTUNITIES_CATALOG;
    const enrichedContext = {
      ...candidateContext,
      savedJobIds,
      applications: trackedApplications
    };

    return evaluateAllOpportunities(catalog, enrichedContext);
  }, [candidateContext, savedJobIds, trackedApplications]);

  // Telemetry counts
  const telemetry = useMemo(() => {
    const highPriorityCount = processedOpportunities.filter(o => o.priority?.id === 'high_priority').length;
    const deadlinesThisWeekCount = processedOpportunities.filter(o => o.deadline?.isUrgent && !o.deadline?.isExpired).length;
    const activeAppsCount = trackedApplications.filter(a => !['rejected', 'withdrawn', 'selected'].includes(a.status?.toLowerCase())).length;
    const recommendedCount = processedOpportunities.filter(o => o.eligibility?.status === 'eligible' && (o.matchScore === null || o.matchScore >= 60)).length;

    return {
      highPriorityCount,
      deadlinesThisWeekCount,
      activeAppsCount,
      recommendedCount
    };
  }, [processedOpportunities, trackedApplications]);

  // Filter & Sort
  const filteredOpportunities = useMemo(() => {
    const filtered = processedOpportunities.filter(opp => {
      // Tab filter
      if (activeTab === 'saved' && !opp.isSaved) return false;

      // Text search (company, role, skills)
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesComp = opp.company_name.toLowerCase().includes(q);
        const matchesRole = opp.role_title.toLowerCase().includes(q);
        const matchesSkills = (opp.required_skills || []).some(s => s.toLowerCase().includes(q));
        if (!matchesComp && !matchesRole && !matchesSkills) return false;
      }

      // Role filter
      if (roleFilter !== 'All') {
        const rLower = roleFilter.toLowerCase();
        const matchesTarget = (opp.target_roles || []).some(tr => tr.toLowerCase().includes(rLower));
        const matchesRoleTitle = opp.role_title.toLowerCase().includes(rLower);
        if (!matchesTarget && !matchesRoleTitle) return false;
      }

      // Work mode filter
      if (workModeFilter !== 'All' && opp.work_mode !== workModeFilter) {
        return false;
      }

      // Eligibility filter
      if (eligibilityFilter === 'Eligible Only' && opp.eligibility.status !== 'eligible') {
        return false;
      }
      if (eligibilityFilter === 'Review Needed' && opp.eligibility.status !== 'eligibility_unknown') {
        return false;
      }
      if (eligibilityFilter === 'Not Eligible' && opp.eligibility.status !== 'not_eligible') {
        return false;
      }

      // Match filter
      if (matchFilter === '80+' && (opp.matchScore === null || opp.matchScore < 80)) return false;
      if (matchFilter === '60-79' && (opp.matchScore === null || opp.matchScore < 60 || opp.matchScore >= 80)) return false;
      if (matchFilter === 'below60' && (opp.matchScore !== null && opp.matchScore >= 60)) return false;

      // Deadline filter
      if (deadlineFilter === 'urgent' && (!opp.deadline.isUrgent || opp.deadline.isExpired)) return false;
      if (deadlineFilter === 'open' && (opp.deadline.isExpired || opp.deadline.status === 'no_deadline')) return false;
      if (deadlineFilter === 'expired' && !opp.deadline.isExpired) return false;

      // Application filter
      if (appFilter === 'not_applied' && opp.applicationStatus) return false;
      if (appFilter === 'active' && (!opp.applicationStatus || ['selected', 'rejected', 'withdrawn'].includes(opp.applicationStatus))) return false;
      if (appFilter === 'selected' && opp.applicationStatus !== 'selected') return false;

      return true;
    });

    return rankOpportunities(filtered, sortBy, candidateContext);
  }, [processedOpportunities, activeTab, search, roleFilter, workModeFilter, eligibilityFilter, matchFilter, deadlineFilter, appFilter, sortBy, candidateContext]);

  return (
    <div className="space-y-6 text-left">
      
      {/* Header & Sub-navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-indigo-600" />
              <span>Placement Drive Intelligence & Discovery</span>
            </h1>
            <Badge variant="primary" size="xs">Phase 14</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Data-grounded campus drives evaluated against your verified skills, eligibility criteria, deadlines, and preparation gaps.
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>All Drives ({PLACEMENT_OPPORTUNITIES_CATALOG.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Opportunities</span>
            {savedJobIds.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-semibold">
                {savedJobIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notification toast */}
      {prepNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center justify-between">
          <span>{prepNotification}</span>
          <button onClick={() => setPrepNotification('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Phase 14 Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recommended Drives</span>
          <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{telemetry.recommendedCount}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Eligible & High Match</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">High Priority</span>
          <span className="text-xl font-extrabold text-rose-700 mt-0.5 block">{telemetry.highPriorityCount}</span>
          <span className="text-[11px] text-slate-500 font-medium">Apply & Prepare First</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deadlines This Week</span>
          <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">{telemetry.deadlinesThisWeekCount}</span>
          <span className="text-[11px] text-amber-700 font-medium">Closing within 3 days</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In-Flight Applications</span>
          <span className="text-xl font-extrabold text-indigo-700 mt-0.5 block">{telemetry.activeAppsCount}</span>
          <span className="text-[11px] text-slate-500 font-medium">Tracking in Pipeline</span>
        </div>
      </div>

      {/* Candidate Context Banner */}
      {candidateContext?.profile && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                Matching Profiles for: {candidateContext.profile.name || 'Candidate'} ({candidateContext.profile.preferred_job_role || 'Full Stack Software Engineer'})
              </span>
              <span className="text-slate-500 text-[11px]">
                Department: {candidateContext.profile.department || 'Not set'} • Batch: {candidateContext.profile.year || '4th Year'} • {candidateContext.userSkills.length} Verified Skills • Resume ATS: {candidateContext.latestResume?.ats_score ? `${candidateContext.latestResume.ats_score}/100` : 'Not uploaded'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {(!candidateContext.latestResume || candidateContext.userSkills.length === 0) && (
              <button
                onClick={() => onNavigate && onNavigate(candidateContext.latestResume ? 'assessments' : 'resume')}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-indigo-600 hover:border-indigo-600 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                {!candidateContext.latestResume ? 'Upload Resume for Better Match →' : 'Take Tests to Verify Skills →'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="saas-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          
          {/* Search Box (4 cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies, roles, or skills (e.g. Google, React, SQL)..."
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>

          {/* Role Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="All">All Roles</option>
              <option value="Full Stack Software Engineer">Full Stack</option>
              <option value="Backend Developer">Backend</option>
              <option value="Frontend Developer">Frontend</option>
              <option value="DevOps / Cloud Engineer">DevOps</option>
            </select>
          </div>

          {/* Eligibility Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="All">All Eligibility</option>
              <option value="Eligible Only">Eligible Only</option>
              <option value="Review Needed">Review Needed</option>
              <option value="Not Eligible">Ineligible</option>
            </select>
          </div>

          {/* Match Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="All">All Matches</option>
              <option value="80+">80%+ (High Match)</option>
              <option value="60-79">60–79% (Good Match)</option>
              <option value="below60">Below 60%</option>
            </select>
          </div>

          {/* Work Mode Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="All">All Work Modes</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-Site">On-Site</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Deadline Filter */}
          <div>
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="All">All Deadlines</option>
              <option value="urgent">Closing Soon / Urgent</option>
              <option value="open">Active & Open</option>
              <option value="expired">Deadline Passed</option>
            </select>
          </div>

          {/* Application Status Filter */}
          <div>
            <select
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="All">All Application States</option>
              <option value="not_applied">Not Applied Yet</option>
              <option value="active">Active Application</option>
              <option value="selected">Selected / Offer</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="recommended">Recommended First</option>
              <option value="match">Highest Match</option>
              <option value="deadline">Closing Soonest</option>
              <option value="priority">Priority Tier</option>
              <option value="package">Package / CTC</option>
            </select>
          </div>

        </div>
      </div>

      {/* Opportunities Cards Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Evaluating candidate match criteria against campus recruitment catalog...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="saas-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Placement Drives Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'saved' 
              ? 'You have not saved any opportunities yet. Click the bookmark icon on any drive to track it here.'
              : 'Try adjusting your search query, role filters, or eligibility criteria to discover other drives.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOpportunities.map((opp) => {
            const isEligible = opp.eligibility.status === 'eligible';
            const isReview = opp.eligibility.status === 'eligibility_unknown';
            const isExpired = opp.deadline?.isExpired;
            const hasMatch = opp.matchScore !== null && opp.matchScore !== undefined;

            return (
              <div 
                key={opp.id}
                onClick={() => setSelectedOpportunity(opp)}
                className="saas-card p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group relative"
              >
                <div>
                  {/* Top Bar: Logo, Company, Bookmark */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 shadow-2xs ${
                        opp.brand_color === 'indigo' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        opp.brand_color === 'sky' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                        opp.brand_color === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {opp.logo_letter || opp.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {opp.company_name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 font-medium truncate">{opp.role_title}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleToggleSave(e, opp.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                      title={opp.isSaved ? 'Remove Bookmark' : 'Save Drive'}
                    >
                      {opp.isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Priority, Match, Eligibility & Deadline Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-3">
                    {/* Priority Badge */}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      opp.priority?.variant === 'rose' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      opp.priority?.variant === 'primary' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      opp.priority?.variant === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      opp.priority?.variant === 'danger' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {opp.priority?.label || 'Good Opportunity'}
                    </span>

                    {/* Eligibility Badge */}
                    <Badge 
                      variant={isEligible ? 'success' : isReview ? 'warning' : 'danger'} 
                      size="xs"
                    >
                      {isEligible ? 'Eligible' : isReview ? 'Review Needed' : 'Ineligible'}
                    </Badge>

                    {/* Deadline Badge */}
                    <Badge 
                      variant={opp.deadline?.badgeVariant || 'neutral'} 
                      size="xs"
                    >
                      <Clock className="w-3 h-3 mr-1 inline" />
                      {opp.deadline?.label || 'Open'}
                    </Badge>

                    {/* Application Status Badge (if applied) */}
                    {opp.applicationStatus && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                        {opp.applicationStatus}
                      </span>
                    )}
                  </div>

                  {/* Match Meter */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[11px] font-semibold text-slate-500">Opportunity Match:</span>
                      <span className={`font-bold ${
                        hasMatch 
                          ? (opp.matchScore >= 75 ? 'text-emerald-600' : opp.matchScore >= 50 ? 'text-amber-600' : 'text-rose-600')
                          : 'text-slate-400'
                      }`}>
                        {hasMatch ? `${opp.matchScore}% Match` : 'Unassessed'}
                      </span>
                    </div>
                    <ProgressBar 
                      value={hasMatch ? opp.matchScore : 0} 
                      size="xs" 
                      color={hasMatch ? (opp.matchScore >= 75 ? 'emerald' : opp.matchScore >= 50 ? 'amber' : 'rose') : 'neutral'}
                      showPercentage={false}
                    />
                  </div>

                  {/* Package & Work Mode */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-3">
                    <span className="font-bold text-emerald-700">{opp.package}</span>
                    <span>•</span>
                    <span>{opp.work_mode}</span>
                    <span>•</span>
                    <span className="truncate">{opp.location}</span>
                  </div>

                  {/* Grounded "Why this matches you" Box */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Why this matches you:</span>
                    {(opp.whyMatches || []).slice(0, 2).map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{reason}</span>
                      </div>
                    ))}
                  </div>

                  {/* Required Skills Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {(opp.required_skills || []).slice(0, 4).map((sk) => (
                      <span key={sk} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {sk}
                      </span>
                    ))}
                    {(opp.required_skills || []).length > 4 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{opp.required_skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handlePrepareForDrive(e, opp)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Prepare for Drive</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOpportunity(opp)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApply(opp); }}
                      disabled={isExpired}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer ${
                        isExpired 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                      }`}
                    >
                      <span>{opp.applicationStatus ? 'Re-Apply' : 'Apply'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 13-SECTION COMPREHENSIVE OPPORTUNITY DETAILS MODAL */}
      {/* ==================================================================== */}
      {selectedOpportunity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6 text-left my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-lg flex items-center justify-center shrink-0">
                  {selectedOpportunity.logo_letter || selectedOpportunity.company_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedOpportunity.company_name}</h2>
                  <p className="text-xs text-slate-600 font-medium">{selectedOpportunity.role_title}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Overview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. OPPORTUNITY OVERVIEW</h4>
              <p className="text-xs text-slate-700 leading-relaxed">{selectedOpportunity.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="p-2 rounded bg-slate-50">
                  <span className="text-[10px] text-slate-400 block">Package</span>
                  <strong className="text-emerald-700">{selectedOpportunity.package}</strong>
                </div>
                <div className="p-2 rounded bg-slate-50">
                  <span className="text-[10px] text-slate-400 block">Work Mode</span>
                  <strong className="text-slate-800">{selectedOpportunity.work_mode}</strong>
                </div>
                <div className="p-2 rounded bg-slate-50">
                  <span className="text-[10px] text-slate-400 block">Location</span>
                  <strong className="text-slate-800">{selectedOpportunity.location}</strong>
                </div>
                <div className="p-2 rounded bg-slate-50">
                  <span className="text-[10px] text-slate-400 block">Job Type</span>
                  <strong className="text-slate-800">{selectedOpportunity.job_type}</strong>
                </div>
              </div>
            </div>

            {/* Section 2: Eligibility */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. ELIGIBILITY VERIFICATION</h4>
                <Badge variant={selectedOpportunity.eligibility?.status === 'eligible' ? 'success' : selectedOpportunity.eligibility?.status === 'eligibility_unknown' ? 'warning' : 'danger'} size="xs">
                  {selectedOpportunity.eligibility?.status === 'eligible' ? 'Eligible to Apply' : selectedOpportunity.eligibility?.status === 'eligibility_unknown' ? 'Review Needed' : 'Ineligible'}
                </Badge>
              </div>
              <div className="space-y-1.5">
                {(selectedOpportunity.eligibility?.reasons || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    {r.status === 'pass' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                    {r.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />}
                    {r.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />}
                    <span className="text-slate-700">{r.message}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Match Analysis */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">3. 7-DIMENSION MATCH ANALYSIS</h4>
                <strong className="text-sm font-bold text-slate-900">{selectedOpportunity.matchScore}% Match</strong>
              </div>
              <p className="text-[11px] text-slate-500">{selectedOpportunity.factorSummary}</p>
            </div>

            {/* Section 4 & 5: Skills & Missing Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">4. MATCHED SKILLS</h4>
                <div className="flex flex-wrap gap-1">
                  {(selectedOpportunity.matchExplanation?.strongMatches || []).length === 0 ? (
                    <span className="text-xs text-slate-400">No verified skills matched yet.</span>
                  ) : (
                    selectedOpportunity.matchExplanation.strongMatches.map(s => (
                      <span key={s.name} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        ✓ {s.name}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">5. MISSING SKILLS</h4>
                <div className="flex flex-wrap gap-1">
                  {(selectedOpportunity.matchExplanation?.missingSkills || []).length === 0 ? (
                    <span className="text-xs text-emerald-600 font-medium">All required skills matched!</span>
                  ) : (
                    selectedOpportunity.matchExplanation.missingSkills.map(s => (
                      <span key={s.name || s} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        ✗ {s.name || s}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Section 6 to 9: Grounded Telemetry Evidence */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">6–9. CANDIDATE EVIDENCE BREAKDOWN</h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                {(selectedOpportunity.whyMatches || []).map((w, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 10 & 11: Deadline & Application Pipeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">10. APPLICATION DEADLINE</span>
                <p className="font-bold text-slate-900">
                  {selectedOpportunity.application_deadline ? new Date(selectedOpportunity.application_deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'No deadline provided'}
                </p>
                <span className={`text-[10px] font-semibold ${selectedOpportunity.deadline?.isUrgent ? 'text-amber-600' : 'text-slate-500'}`}>
                  Status: {selectedOpportunity.deadline?.label}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">11. APPLICATION PIPELINE</span>
                <p className="font-bold text-slate-900">
                  {selectedOpportunity.applicationStatus ? selectedOpportunity.applicationStatus.toUpperCase() : 'NOT APPLIED'}
                </p>
                <span className="text-[10px] text-slate-500">
                  {selectedOpportunity.applicationStatus ? 'Tracked in your Application Pipeline' : 'Ready for external submission'}
                </span>
              </div>
            </div>

            {/* Section 12: Recommended Course Preparation */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">12. RECOMMENDED PREPARATION COURSES</h4>
              {(selectedOpportunity.courseRecommendations || []).length === 0 ? (
                <p className="text-xs text-slate-500">{selectedOpportunity.fallbackCourseMessage || 'No specific course remediation required for this drive.'}</p>
              ) : (
                <div className="space-y-2">
                  {selectedOpportunity.courseRecommendations.map(c => (
                    <div key={c.courseId} className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-indigo-950 block">{c.courseTitle}</strong>
                        <span className="text-[11px] text-indigo-700">{c.reason}</span>
                      </div>
                      <button
                        onClick={() => { setSelectedOpportunity(null); onNavigate('courses'); }}
                        className="text-xs font-bold text-indigo-600 hover:underline shrink-0"
                      >
                        Open Course →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 13: Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={(e) => { handlePrepareForDrive(e, selectedOpportunity); setSelectedOpportunity(null); }}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Add to Preparation Plan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleToggleSave(e, selectedOpportunity.id)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {selectedOpportunity.isSaved ? 'Bookmarked ✓' : 'Bookmark Drive'}
                </button>

                <button
                  onClick={() => handleApply(selectedOpportunity)}
                  disabled={selectedOpportunity.deadline?.isExpired}
                  className={`px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedOpportunity.deadline?.isExpired
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  <span>{selectedOpportunity.applicationStatus ? 'Re-Apply on Portal' : 'Apply on Official Portal'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
