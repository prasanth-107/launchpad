import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Download, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { Badge } from './ui/Badge';

export default function SkillsCertificatesView({ user }) {
  const [activeTab, setActiveTab] = useState('skills');

  const skillsList = [
    { name: 'Python Programming', level: 'Advanced', verified: true, testsCleared: 3 },
    { name: 'JavaScript & React ES6+', level: 'Advanced', verified: true, testsCleared: 4 },
    { name: 'SQL & Relational Databases', level: 'Intermediate', verified: true, testsCleared: 2 },
    { name: 'Data Structures & Algorithms', level: 'Intermediate', verified: true, testsCleared: 3 },
    { name: 'FastAPI & REST Architecture', level: 'Intermediate', verified: true, testsCleared: 2 },
    { name: 'Git & GitHub Collaboration', level: 'Advanced', verified: true, testsCleared: 2 },
    { name: 'Campus Quantitative Aptitude', level: 'Proficient', verified: true, testsCleared: 3 },
    { name: 'Professional HR Communication', level: 'Proficient', verified: true, testsCleared: 2 }
  ];

  const certificates = [
    {
      id: 'cert_1',
      title: 'Full Stack Web Engineering Placement Clearance',
      issuedBy: 'Modern Placement Launchpad TPO Council',
      date: 'August 2026',
      credentialId: 'MPL-2026-CERT-8841',
      skills: ['React', 'FastAPI', 'SQL', 'Git']
    },
    {
      id: 'cert_2',
      title: 'Algorithm Problem Solving Proficiency Level II',
      issuedBy: 'National Engineering Assessment Authority',
      date: 'July 2026',
      credentialId: 'NEAA-DSA-49102',
      skills: ['Two-Pointers', 'Binary Trees', 'Graphs']
    },
    {
      id: 'cert_3',
      title: 'Campus Recruitment Aptitude & Verbal Benchmark',
      issuedBy: 'Placement Readiness Council',
      date: 'June 2026',
      credentialId: 'PRC-APT-99201',
      skills: ['Quantitative Aptitude', 'Logical Reasoning', 'STAR Framework']
    }
  ];

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Skills & Placement Certificates
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Verified skills inventory, assessment credentials, and recruitment clearance certifications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 mr-6 transition-colors ${
            activeTab === 'skills' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Verified Skills Inventory ({skillsList.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'certificates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Recruitment Certificates ({certificates.length})
        </button>
      </div>

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {skillsList.map((skill, idx) => (
            <div key={idx} className="saas-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="success" size="xs">
                    Verified ✓
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-mono">{skill.level}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{skill.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Cleared in {skill.testsCleared} benchmark assessments</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Endorsed by TPO</span>
                <span className="text-indigo-600 font-semibold cursor-pointer">View Proof →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert.id} className="saas-card p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{cert.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Issued by {cert.issuedBy}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {cert.credentialId}</p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {cert.skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{cert.date}</span>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
