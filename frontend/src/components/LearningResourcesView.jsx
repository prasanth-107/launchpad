import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ExternalLink, 
  Video, 
  Search, 
  Play, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Code2, 
  Layout, 
  Database, 
  Binary, 
  Calculator, 
  MessageSquare, 
  FileText,
  Info
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { apiClient } from '../api/client';

export default function LearningResourcesView({ initialCategory = 'programming' }) {
  const [contentCategories, setContentCategories] = useState([]);
  const [activeCategoryKey, setActiveCategoryKey] = useState(initialCategory);
  const [topicsData, setTopicsData] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeSource, setYoutubeSource] = useState('verified_curated_collection');
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await apiClient.getAllContent();
        setContentCategories(res.categories || []);
        const currentList = res.data?.[activeCategoryKey] || [];
        setTopicsData(currentList);
        if (currentList.length > 0) {
          setSelectedTopic(currentList[0]);
        }
      } catch (err) {
        console.error('Failed to load content', err);
      }
    }
    loadCatalog();
  }, []);

  const handleCategoryChange = async (catKey) => {
    setActiveCategoryKey(catKey);
    try {
      const res = await apiClient.getCategoryContent(catKey);
      const list = res.topics || [];
      setTopicsData(list);
      if (list.length > 0) {
        setSelectedTopic(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch category content', err);
    }
  };

  useEffect(() => {
    if (!selectedTopic) return;
    async function fetchVideos() {
      setLoadingVideos(true);
      try {
        const queryTerm = selectedTopic.name || selectedTopic.id || 'python';
        const res = await apiClient.searchVideos(queryTerm);
        setYoutubeVideos(res.videos || []);
        setYoutubeSource(res.source || 'verified_curated_collection');
      } catch (err) {
        console.error('Failed to fetch videos', err);
      } finally {
        setLoadingVideos(false);
      }
    }
    fetchVideos();
  }, [selectedTopic]);

  const handleCustomSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoadingVideos(true);
    try {
      const res = await apiClient.searchVideos(searchQuery.trim());
      setYoutubeVideos(res.videos || []);
      setYoutubeSource(res.source || 'verified_curated_collection');
    } catch (err) {
      console.error('Video search error', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Learning Resources & Video Hub
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore authentic documentation links (MDN, W3Schools, GeeksforGeeks) and verified placement video courses.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto gap-2 pb-2 border-b border-slate-200 scrollbar-none">
        {contentCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => handleCategoryChange(cat.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeCategoryKey === cat.key 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* 2-Column Split: Topics in Category (Left) & Resources + Videos (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Topics List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Select Topic
          </span>

          <div className="space-y-2">
            {topicsData.map((t) => {
              const isSelected = selectedTopic?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTopic(t)}
                  className={`saas-card p-4 cursor-pointer transition-colors ${
                    isSelected ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {t.resources?.length || 3} Links
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Verified Links + Video Lessons (8 Cols) */}
        {selectedTopic && (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Overview Card */}
            <div className="saas-card p-6 space-y-3">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider font-mono">
                Active Topic
              </span>
              <h2 className="text-xl font-bold text-slate-900">{selectedTopic.name}</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{selectedTopic.description}</p>

              {selectedTopic.topics && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {selectedTopic.topics.map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Verified External Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  Verified External Documentation
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  100% Authentic URLs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTopic.resources?.map((res, idx) => (
                  <div key={idx} className="saas-card p-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                        <span className="font-bold text-slate-700">{res.provider}</span>
                        <span>{res.type}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{res.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{res.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <span>Visit Resource</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automatic YouTube Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-rose-600" />
                  Relevant Educational Video Lessons
                </h3>

                <Badge variant={youtubeSource === 'youtube_data_api_v3' ? 'success' : 'primary'} size="xs">
                  {youtubeSource === 'youtube_data_api_v3' ? 'Live YouTube API' : 'Curated Verified Channels'}
                </Badge>
              </div>

              {/* Search bar */}
              <form onSubmit={handleCustomSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search video lessons for ${selectedTopic.name}...`}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingVideos}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {loadingVideos ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Video Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {youtubeVideos.map((vid, idx) => (
                  <div key={vid.videoId || idx} className="saas-card overflow-hidden flex flex-col justify-between">
                    <div 
                      className="relative aspect-video bg-slate-100 cursor-pointer overflow-hidden group"
                      onClick={() => setActiveVideoModal(vid.videoId)}
                    >
                      <img 
                        src={vid.thumbnail} 
                        alt={vid.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.src = `https://img.youtube.com/vi/${vid.videoId}/hqdefault.jpg`;
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 ml-0.5 fill-current" />
                        </div>
                      </div>
                      {vid.duration && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-mono">
                          {vid.duration}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{vid.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1">{vid.channel}</p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setActiveVideoModal(vid.videoId)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" /> Watch Video
                        </button>
                        <a
                          href={vid.url || `https://www.youtube.com/watch?v=${vid.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-400 hover:text-slate-600"
                        >
                          YouTube ↗
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info box */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2 text-xs text-slate-500">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Configuration:</strong> To query live YouTube videos dynamically, specify <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700">YOUTUBE_API_KEY</code> in your environment. Currently serving verified educational channels (freeCodeCamp, Mosh, Kunal Kushwaha).
                </span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Video Modal Player */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-700">Educational Video Player</span>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoModal}?autoplay=1`}
                title="Educational Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
