import React from 'react';
import { 
  Rocket, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  BrainCircuit, 
  BarChart3, 
  Mic2, 
  FileText, 
  BookOpen, 
  Video, 
  ShieldCheck, 
  Target,
  Award,
  Zap,
  TrendingUp,
  GraduationCap
} from 'lucide-react';

export default function LandingPage({ onStartJourney, onDemoLogin }) {
  const steps = [
    {
      num: '01',
      title: 'Skill Assessment',
      desc: 'Take timed technical (C, C++, Java, Python, SQL, DSA) and aptitude tests with automated scoring and instant feedback.',
      icon: CheckCircle2,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      num: '02',
      title: 'AI Gap Analysis',
      desc: 'Our AI engine evaluates your strengths, weaknesses, and calculates your baseline placement readiness dimensions.',
      icon: BrainCircuit,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      num: '03',
      title: 'Personalized Roadmap',
      desc: 'Follow an adaptive milestone roadmap customized to your target job role, college year, and diagnosed gaps.',
      icon: Target,
      color: 'from-purple-500 to-pink-500'
    },
    {
      num: '04',
      title: 'AI Mock Interviews & Resume',
      desc: 'Simulate HR, Technical, and Behavioral interviews with voice recognition, and get real-time ATS resume keyword analysis.',
      icon: Mic2,
      color: 'from-amber-500 to-rose-500'
    },
    {
      num: '05',
      title: 'Placement Ready 🎯',
      desc: 'Reach an 85%+ readiness score, unlock targeted placement company prep, and interview with peak confidence.',
      icon: Award,
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  const features = [
    {
      icon: Target,
      title: 'Personalized Learning Roadmaps',
      desc: 'Custom-tailored milestone sequences (Python → SQL → DSA → Web Dev → Aptitude → Mock Interview) that adapt to your target career goal.'
    },
    {
      icon: CheckCircle2,
      title: 'Comprehensive Assessments',
      desc: 'MCQ & live coding challenges across 12 tech and aptitude categories with real-time timers and performance diagnostics.'
    },
    {
      icon: Mic2,
      title: 'Voice-Enabled AI Mock Interviews',
      desc: 'Interactive HR, Technical, and Behavioral simulations with voice transcription, Communication scoring, and dynamic follow-ups.'
    },
    {
      icon: FileText,
      title: 'Deep ATS Resume Analysis',
      desc: 'Instant keyword matching, Google X-Y-Z formula advice, role relevance grading, and formatting recommendations.'
    },
    {
      icon: BookOpen,
      title: 'Verified Learning Resources',
      desc: '100% authentic documentation links to MDN, W3Schools, GeeksforGeeks, and official language documentation. No fake links.'
    },
    {
      icon: Video,
      title: 'Integrated YouTube Video Hub',
      desc: 'Dynamic retrieval of top-tier educational courses from freeCodeCamp, Programming with Mosh, and Kunal Kushwaha.'
    },
    {
      icon: BarChart3,
      title: 'Placement Readiness Index',
      desc: 'Holistic multi-factor scoring combining Technical (25%), Aptitude (20%), Communication (15%), Interview (15%), and Resume (15%).'
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Separate DB Layer',
      desc: 'Clean architectural separation between User, Assessment, Learning, Interview, Content, and Analytics databases.'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-25">
        <div className="absolute top-[-100px] left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[140px]" />
        <div className="absolute top-[-50px] right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[140px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-semibold mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Next-Gen AI Campus Placement Accelerator</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
              Your AI-Powered <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-sky-300 bg-clip-text text-transparent">
                Personal Placement Coach
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed font-normal">
              Assess your skills, follow a personalized learning path, practice with AI mock interviews, and become job-ready.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onStartJourney}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Start Your Placement Journey</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onDemoLogin}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Explore Interactive Demo</span>
              </button>
            </div>

            {/* Social Proof / Stats Ticker */}
            <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">1,400+</p>
                <p className="text-xs text-slate-400 mt-1">Students Enrolled</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400">92%</p>
                <p className="text-xs text-slate-400 mt-1">Placement Success Rate</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-purple-400">3,800+</p>
                <p className="text-xs text-slate-400 mt-1">Assessments Cleared</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">1,200+</p>
                <p className="text-xs text-slate-400 mt-1">Mock Interviews Scored</p>
              </div>
            </div>

          </div>

          {/* Floating Live Readiness Preview Widget */}
          <div className="mt-16 max-w-4xl mx-auto p-6 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/70 shadow-2xl shadow-indigo-900/20 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-700/60">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Live Student Readiness</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Almost Ready</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Alex Chen • Stanford Institute of Technology</h3>
                  <p className="text-xs text-slate-400">Target Role: Full Stack Software Engineer</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-extrabold text-white flex items-center gap-1 justify-end">
                  <span className="text-indigo-400">73</span>%
                </div>
                <p className="text-xs text-slate-400 font-medium">Placement Readiness Index</p>
              </div>
            </div>

            {/* Score Sliders Preview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-6">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <span className="text-[11px] text-slate-400 font-medium">Technical</span>
                <p className="text-lg font-bold text-indigo-300">80%</p>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <span className="text-[11px] text-slate-400 font-medium">Aptitude</span>
                <p className="text-lg font-bold text-sky-300">72%</p>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <span className="text-[11px] text-slate-400 font-medium">Communication</span>
                <p className="text-lg font-bold text-purple-300">65%</p>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <span className="text-[11px] text-slate-400 font-medium">Mock Interview</span>
                <p className="text-lg font-bold text-amber-300">75%</p>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-400 font-medium">Resume ATS</span>
                <p className="text-lg font-bold text-emerald-300">70%</p>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
            </div>

            {/* Smart Next Step Recommendation Callout */}
            <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><strong>Recommended Next Step:</strong> Improve SQL and Communication to increase readiness to 85%+.</span>
              </div>
              <button 
                onClick={onDemoLogin}
                className="text-xs font-semibold text-indigo-300 hover:text-white shrink-0 underline ml-2"
              >
                View Full Plan →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-950/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-widest mb-3">Structured Methodology</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">How Modern Placement Launchpad Works</p>
            <p className="text-slate-400 mt-4 text-sm sm:text-base">
              A 5-phase data-driven journey engineered to take you from foundational understanding to landing top campus placement offers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.num}
                  className="relative p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">{step.num}</span>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${step.color} flex items-center justify-center text-white shadow`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">{step.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs sm:text-sm font-bold text-purple-400 uppercase tracking-widest mb-3">Everything You Need</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">Comprehensive Placement Toolkit</p>
            <p className="text-slate-400 mt-4 text-sm sm:text-base">
              Engineered with specialized AI modules, authentic verified educational links, and real-time feedback loops.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{feat.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Concept & Benefits Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Placement Readiness Score</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-6">
                Never Guess If You Are Ready For Campus Interviews
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Most students struggle because they prepare blindly without knowing whether their aptitude, coding speed, communication, or resume ATS scores meet recruiter thresholds.
              </p>
              <div className="space-y-3.5">
                {[
                  'Unified Placement Readiness Score based on real assessment and mock interview data',
                  'Clear diagnostic breakdown highlighting exactly which topics need improvement',
                  'Personalized roadmaps connecting directly to verified GeeksforGeeks, MDN, and official docs',
                  'Authentic YouTube tutorials curated specifically for campus recruitment rounds'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <button
                  onClick={onStartJourney}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Start Your Placement Journey Now
                </button>
              </div>
            </div>

            {/* Visual Roadmap Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                  <GraduationCap className="w-4 h-4" />
                  Standard Campus Placement Roadmap
                </div>
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Automated</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                {[
                  { name: 'Python & Problem Solving', cat: 'Programming', done: true },
                  { name: 'SQL & Relational Databases', cat: 'Database', done: true },
                  { name: 'Data Structures & Algorithms', cat: 'DSA', current: true },
                  { name: 'Web Development (React/APIs)', cat: 'Web Dev' },
                  { name: 'Aptitude & Speed Math', cat: 'Aptitude' },
                  { name: 'HR & Communication Fluency', cat: 'Soft Skills' },
                  { name: 'AI Mock Interview Simulation', cat: 'Mock Rounds' },
                  { name: 'Placement Ready 🎯', cat: 'Goal Offer', highlight: true }
                ].map((node, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between p-2.5 rounded-lg border ${
                      node.done 
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                        : node.current 
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200' 
                        : node.highlight 
                        ? 'bg-purple-950/40 border-purple-500/40 text-purple-200' 
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-slate-700">
                        {node.done ? '✓' : i + 1}
                      </span>
                      <span className="font-sans font-medium text-xs">{node.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80">{node.cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-10 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-indigo-900/60 border border-indigo-500/30 shadow-2xl">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Accelerate Your Placement Preparation?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Join students who assess their skills, follow structured roadmaps, and practice with AI before campus placement season.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={onStartJourney}
                className="px-8 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
              >
                Create Student Account
              </button>
              <button
                onClick={onDemoLogin}
                className="px-8 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all"
              >
                Launch Demo Student
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
