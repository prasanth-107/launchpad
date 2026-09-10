import React, { useState } from 'react';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Filter,
  DollarSign
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

export default function JobOpportunitiesView() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [appliedJobs, setAppliedJobs] = useState([1]);

  const jobs = [
    {
      id: 1,
      company: 'Google',
      role: 'Software Engineer - Early Career / University Graduate',
      location: 'Bangalore / Hyderabad / Remote',
      ctc: '₹28 - 34 LPA',
      eligibility: 'B.Tech / M.Tech (CSE, IT, ECE) • 7.5+ CGPA',
      deadline: 'Sep 25, 2026',
      type: 'Full-Time SDE',
      logoText: 'G',
      driveUrl: 'https://careers.google.com/students/'
    },
    {
      id: 2,
      company: 'Microsoft',
      role: 'Software Development Engineer - SDE-1',
      location: 'Hyderabad / Noida',
      ctc: '₹26 - 32 LPA',
      eligibility: 'All Engineering Branches • 7.0+ CGPA',
      deadline: 'Oct 02, 2026',
      type: 'Campus Drive',
      logoText: 'M',
      driveUrl: 'https://careers.microsoft.com/students/us/en'
    },
    {
      id: 3,
      company: 'Amazon',
      role: 'Software Development Engineer - 2026 Batch',
      location: 'Bangalore / Chennai',
      ctc: '₹24 - 30 LPA',
      eligibility: 'CSE / IT / Circuital Branches • No active backlogs',
      deadline: 'Oct 10, 2026',
      type: 'Full-Time',
      logoText: 'A',
      driveUrl: 'https://www.amazon.jobs/en/business_categories/university-tech'
    },
    {
      id: 4,
      company: 'Atlassian',
      role: 'Associate Software Engineer',
      location: 'Bengaluru (Hybrid)',
      ctc: '₹30 - 36 LPA',
      eligibility: 'Final Year Students • Strong DSA & Web fundamentals',
      deadline: 'Oct 15, 2026',
      type: 'Product',
      logoText: 'AT',
      driveUrl: 'https://www.atlassian.com/company/careers/graduates'
    },
    {
      id: 5,
      company: 'JPMorgan Chase',
      role: 'Software Engineer Analyst',
      location: 'Mumbai / Bengaluru',
      ctc: '₹18 - 22 LPA',
      eligibility: 'Engineering & MCA Graduates • 6.5+ CGPA',
      deadline: 'Oct 20, 2026',
      type: 'FinTech',
      logoText: 'JP',
      driveUrl: 'https://careers.jpmorgan.com/global/en/students/programs'
    }
  ];

  const handleApply = (id) => {
    if (!appliedJobs.includes(id)) {
      setAppliedJobs([...appliedJobs, id]);
    }
  };

  const filtered = jobs.filter(j => {
    const matchesSearch = j.company.toLowerCase().includes(search.toLowerCase()) || 
                          j.role.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Campus Placement Drives & Opportunities
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Active campus recruitment drives, eligibility rules, and CTC packages from verified partner companies.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Jobs List Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No opportunities found"
          description={search ? `No placement drives found matching "${search}".` : "No active placement drives currently match your criteria."}
          actionLabel="Clear Search"
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => {
            const hasApplied = appliedJobs.includes(job.id);
            return (
              <div 
                key={job.id}
                className="saas-card p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
                    {job.logoText}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {job.company}
                      </span>
                      <Badge variant="neutral" size="xs">
                        {job.type}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{job.role}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-emerald-700">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.ctc}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Closes: {job.deadline}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      <strong className="text-slate-700">Eligibility:</strong> {job.eligibility}
                    </p>
                  </div>
                </div>

                {/* Action */}
                <div className="shrink-0 flex items-center gap-2 sm:gap-3">
                  {job.driveUrl && (
                    <a
                      href={job.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-semibold text-xs sm:text-sm shadow-xs transition-colors"
                      title={`Open official ${job.company} career drive portal`}
                    >
                      <span>Drive Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {hasApplied ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Applied</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(job.id)}
                      className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
                    >
                      Apply for Drive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
