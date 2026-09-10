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
  Info
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

export default function JobOpportunitiesView({ user, onNavigate }) {
  // Navigation tabs: 'all' | 'saved'
  const [activeTab, setActiveTab] = useState('all');

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [eligibilityFilter, setEligibilityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'deadline' | 'package'

  // Candidate context & persistence
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [trackedApplications, setTrackedApplications] = useState([]);
  const [candidateContext, setCandidateContext] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [user?.id]);

  // Toggle Save Job
  const handleToggleSave = async (e, jobId) => {
    e.stopPropagation();
    if (!user?.id) {
      alert('Please sign in to bookmark placement opportunities.');
      return;
    }

    try {
      const { isSaved, savedJobIds: updated } = await dal.savedJobs.toggle(user.id, jobId);
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

    // Record tracking event without faking external status
    if (user?.id) {
      dal.applications.track(user.id, opp.id, {
        application_url: opp.application_url,
        company_name: opp.company_name,
        role_title: opp.role_title
      }).then(() => {
        setTrackedApplications(prev => [...prev.filter(a => a.job_id !== opp.id), { job_id: opp.id }]);
      }).catch(err => console.warn('Could not log application tracking:', err));
    }

    // Open official company career portal safely in new tab
    window.open(opp.application_url, '_blank', 'noopener,noreferrer');
  };

  // Compute matches and eligibility for all opportunities
  const processedOpportunities = useMemo(() => {
    const catalog = PLACEMENT_OPPORTUNITIES_CATALOG;
    if (!candidateContext) return catalog.map(o => ({ ...o, matchScore: null, eligibility: { status: 'eligibility_unknown', reasons: [] } }));

    return catalog.map(opp => {
      const match = computeJobMatchScore(candidateContext, opp);
      const eligibility = evaluateCandidateEligibility({
        department: candidateContext.profile?.department,
        year: candidateContext.profile?.year,
        cgpa: candidateContext.profile?.cgpa,
        backlogs: candidateContext.profile?.backlogs,
        userSkills: candidateContext.userSkills
      }, opp);
      const deadline = getDeadlineStatus(opp.application_deadline);
      const isSaved = savedJobIds.includes(opp.id);
      const isTracked = trackedApplications.some(a => a.job_id === opp.id);

      return {
        ...opp,
        matchScore: match.matchScore,
        matchTier: match.tier,
        matchTierVariant: match.tierVariant,
        factorSummary: match.factorSummary,
        matchBreakdown: match.breakdown,
        matchExplanation: match.explanation,
        eligibility,
        deadline,
        isSaved,
        isTracked
      };
    });
  }, [candidateContext, savedJobIds, trackedApplications]);

  // Filter & Sort
  const filteredOpportunities = useMemo(() => {
    return processedOpportunities.filter(opp => {
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

      return true;
    }).sort((a, b) => {
      if (sortBy === 'match') {
        if (a.matchScore === null) return 1;
        if (b.matchScore === null) return -1;
        return b.matchScore - a.matchScore;
      }
      if (sortBy === 'deadline') {
        return new Date(a.application_deadline).getTime() - new Date(b.application_deadline).getTime();
      }
      if (sortBy === 'package') {
        const getPkgNum = (str) => parseInt(str.replace(/[^0-9]/g, '')) || 0;
        return getPkgNum(b.package) - getPkgNum(a.package);
      }
      return 0;
    });
  }, [processedOpportunities, activeTab, search, roleFilter, workModeFilter, eligibilityFilter, sortBy]);

  return (
    <div className="space-y-6 text-left">
      
      {/* Header & Sub-navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            <span>Placement Opportunities & Job Matching</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data-grounded campus drives evaluated against your real skills, verified assessments, resume ATS, and eligibility criteria.
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

          {/* Role Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="All">All Roles / Disciplines</option>
              <option value="Full Stack">Full Stack Software Engineer</option>
              <option value="Frontend">Frontend Developer</option>
              <option value="Backend">Backend Developer</option>
              <option value="DevOps">Cloud / DevOps Engineer</option>
              <option value="Data">Data Engineer</option>
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

          {/* Eligibility Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="All">All Eligibility States</option>
              <option value="Eligible Only">Eligible Only (Verified Criteria)</option>
              <option value="Review Needed">Review Needed (Unverified Data)</option>
            </select>
          </div>

        </div>

        {/* Sorting & Count Header */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>Showing <strong className="text-slate-900 font-bold">{filteredOpportunities.length}</strong> placement opportunities</span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Sort by:</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'match', label: 'Match Score' },
                { id: 'deadline', label: 'Application Deadline' },
                { id: 'package', label: 'Package (CTC)' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    sortBy === s.id
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OPPORTUNITIES GRID / LIST */}
      {filteredOpportunities.length === 0 ? (
        /* Empty State */
        <div className="saas-card p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {activeTab === 'saved' ? 'No saved placement opportunities yet.' : 'No placement opportunities match your filters.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeTab === 'saved' 
                ? 'Bookmark campus recruitment drives to track application deadlines and tailored preparation roadmaps.' 
                : 'Try adjusting your search criteria, role filter, or eligibility parameters to view available campus drives.'}
            </p>
          </div>
          {activeTab === 'saved' && (
            <button
              onClick={() => setActiveTab('all')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <span>Browse All Drives</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* Opportunity Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOpportunities.map((opp) => {
            const hasMatch = opp.matchScore !== null && opp.matchScore !== undefined;

            return (
              <div 
                key={opp.id}
                onClick={() => setSelectedOpportunity(opp)}
                className="saas-card p-5 flex flex-col justify-between hover:border-slate-300 transition-all cursor-pointer space-y-4 shadow-2xs hover:shadow-xs group"
              >
                <div>
                  {/* Top Bar: Company Badge, Tags & Bookmark */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                        {opp.logo_letter || opp.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 block leading-tight">{opp.company_name}</span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-1">
                          {opp.role_title}
                        </h3>
                      </div>
                    </div>

                    {/* Bookmark Toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(e, opp.id)}
                      title={opp.isSaved ? 'Remove from saved' : 'Save opportunity'}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        opp.isSaved
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {opp.isSaved ? <BookmarkCheck className="w-4 h-4 fill-amber-500" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Metadata Row: Location, Work Mode, Package */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      {opp.package}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {opp.location}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {opp.work_mode}
                    </span>
                    <span className="text-slate-400 font-normal">
                      • {opp.job_type}
                    </span>
                  </div>

                  {/* Required Skills Badges */}
                  <div className="flex flex-wrap gap-1 pt-3">
                    {opp.required_skills.slice(0, 4).map((sk, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                        {sk}
                      </span>
                    ))}
                    {opp.required_skills.length > 4 && (
                      <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                        +{opp.required_skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Match Score, Eligibility Badge & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  
                  {/* Left: Grounded Match Score & Eligibility */}
                  <div className="flex items-center gap-2">
                    {hasMatch ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                          opp.matchScore >= 75 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : opp.matchScore >= 50
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {opp.matchScore}% Match
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        — % Match
                      </span>
                    )}

                    {/* Eligibility Badge */}
                    <Badge 
                      variant={
                        opp.eligibility.status === 'eligible' 
                          ? 'success' 
                          : opp.eligibility.status === 'eligibility_unknown' 
                          ? 'warning' 
                          : 'danger'
                      } 
                      size="xs"
                    >
                      {opp.eligibility.status === 'eligible' ? 'Eligible' : (opp.eligibility.status === 'eligibility_unknown' ? 'Review Needed' : 'Ineligible')}
                    </Badge>

                    {/* Deadline Badge */}
                    <span className={`text-[10px] font-semibold ${opp.deadline.status === 'closing_soon' || opp.deadline.status === 'closing_today' ? 'text-rose-600' : 'text-slate-400'}`}>
                      • {opp.deadline.badgeText}
                    </span>
                  </div>

                  {/* Right: View Details CTA */}
                  <button
                    type="button"
                    onClick={() => setSelectedOpportunity(opp)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 group-hover:translate-x-0.5 transition-all cursor-pointer"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* COMPREHENSIVE OPPORTUNITY DETAILS MODAL */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="saas-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {selectedOpportunity.logo_letter || selectedOpportunity.company_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{selectedOpportunity.company_name}</span>
                    <Badge variant="primary" size="xs">{selectedOpportunity.job_type}</Badge>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                    {selectedOpportunity.role_title}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setSelectedOpportunity(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Package / CTC</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{selectedOpportunity.package}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Location</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">{selectedOpportunity.location}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Work Mode</span>
                <span className="text-sm font-bold text-slate-900 mt-0.5 block">{selectedOpportunity.work_mode}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-slate-400 block font-medium">Application Deadline</span>
                <span className={`text-sm font-bold mt-0.5 block ${selectedOpportunity.deadline.status === 'closing_soon' || selectedOpportunity.deadline.status === 'closing_today' ? 'text-rose-600' : 'text-slate-900'}`}>
                  {selectedOpportunity.deadline.badgeText}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Role Description</h4>
              <p>{selectedOpportunity.description}</p>
            </div>

            {/* SECTION 1: CANDIDATE ELIGIBILITY BREAKDOWN */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Candidate Eligibility Check</span>
                </h4>
                <Badge 
                  variant={
                    selectedOpportunity.eligibility.status === 'eligible' 
                      ? 'success' 
                      : selectedOpportunity.eligibility.status === 'eligibility_unknown' 
                      ? 'warning' 
                      : 'danger'
                  }
                  size="xs"
                >
                  {selectedOpportunity.eligibility.status === 'eligible' ? 'Verified Eligible' : (selectedOpportunity.eligibility.status === 'eligibility_unknown' ? 'Criteria Unverified' : 'Ineligible')}
                </Badge>
              </div>

              <div className="space-y-2">
                {selectedOpportunity.eligibility.reasons.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    {r.status === 'pass' && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                    {r.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                    {r.status === 'fail' && <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                    <span className={r.status === 'pass' ? 'text-slate-700' : r.status === 'warning' ? 'text-amber-800' : 'text-rose-800'}>
                      <strong>{r.dimension}:</strong> {r.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: JOB MATCH SCORE & BREAKDOWN */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Job Match Evaluation
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {selectedOpportunity.factorSummary}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xl font-extrabold text-indigo-700">
                    {selectedOpportunity.matchScore !== null ? `${selectedOpportunity.matchScore}%` : '—'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">Match</span>
                </div>
              </div>

              {/* Match Factors Progress Bars */}
              {selectedOpportunity.matchBreakdown && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  {Object.entries(selectedOpportunity.matchBreakdown).filter(([_, d]) => d.available).map(([key, d]) => (
                    <div key={key} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">{d.name} ({d.weight}%)</span>
                        <span className="font-bold text-slate-900">{d.score}%</span>
                      </div>
                      <ProgressBar value={d.score} size="xs" color="indigo" showPercentage={false} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 3: SKILL EVIDENCE & MISSING SKILLS */}
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Skill Match & Evidence Breakdown
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Matching Skills */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                  <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                    Matched Skills ({selectedOpportunity.matchExplanation?.strongMatches?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOpportunity.matchExplanation?.strongMatches?.map((sk, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-emerald-800 text-[11px] font-semibold shadow-2xs"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{sk.name}</span>
                        <span className="text-[9px] text-slate-400 font-normal">({sk.source})</span>
                      </span>
                    ))}
                    {(!selectedOpportunity.matchExplanation?.strongMatches || selectedOpportunity.matchExplanation.strongMatches.length === 0) && (
                      <span className="text-slate-400 italic">No verified matching skills found.</span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-2">
                  <span className="font-bold text-rose-900 block text-[11px] uppercase tracking-wider">
                    Missing Requirements ({selectedOpportunity.matchExplanation?.missingSkills?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOpportunity.matchExplanation?.missingSkills?.map((sk, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-rose-200 text-rose-800 text-[11px] font-semibold shadow-2xs"
                      >
                        <X className="w-3 h-3 text-rose-500" />
                        <span>{sk.name}</span>
                        {sk.isRequired && <span className="text-[9px] text-rose-600 font-bold">(Required)</span>}
                      </span>
                    ))}
                    {(!selectedOpportunity.matchExplanation?.missingSkills || selectedOpportunity.matchExplanation.missingSkills.length === 0) && (
                      <span className="text-emerald-700 font-semibold">All required skills matched!</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 4: SMART PREPARATION RECOMMENDATIONS */}
            {selectedOpportunity.matchExplanation?.missingSkills?.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2.5 text-xs">
                <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>Recommended Placement Preparation for This Role</span>
                </span>

                <div className="space-y-2">
                  {getJobPreparationRecommendations(selectedOpportunity.matchExplanation.missingSkills).map((rec, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white border border-amber-200/60 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 block">{rec.courseTitle}</span>
                        <span className="text-[11px] text-amber-800">{rec.reason}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOpportunity(null);
                          if (onNavigate) onNavigate('roadmap');
                        }}
                        className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 transition-colors cursor-pointer"
                      >
                        Enroll Course →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={(e) => handleToggleSave(e, selectedOpportunity.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedOpportunity.isSaved
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {selectedOpportunity.isSaved ? <BookmarkCheck className="w-4 h-4 fill-amber-500" /> : <Bookmark className="w-4 h-4" />}
                <span>{selectedOpportunity.isSaved ? 'Saved in Opportunities' : 'Bookmark Drive'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOpportunity(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleApply(selectedOpportunity)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Apply on Official Portal</span>
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
