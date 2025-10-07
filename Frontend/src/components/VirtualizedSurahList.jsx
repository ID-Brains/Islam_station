// VirtualizedSurahList.jsx - Virtualized list of all Surahs with search
import React, { useState, useMemo } from 'react';
import { surahs } from '../data/surahs.js';

const VirtualizedSurahList = ({ onSurahSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter surahs based on search (excluding "All Surahs" option)
  const filteredSurahs = useMemo(() => {
    const surahList = surahs.filter(s => s.id !== 'all');
    
    if (!searchTerm.trim()) {
      return surahList;
    }
    
    const lowerSearch = searchTerm.toLowerCase();
    return surahList.filter(surah => 
      surah.name.toLowerCase().includes(lowerSearch) ||
      surah.name_ar.includes(searchTerm) ||
      surah.english_meaning?.toLowerCase().includes(lowerSearch) ||
      surah.id.toString() === searchTerm
    );
  }, [searchTerm]);

  const handleSurahClick = (surah) => {
    if (onSurahSelect) {
      onSurahSelect(surah);
    } else {
      // Default navigation to surah page
      window.location.href = `/quran/read?surah=${surah.id}`;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-base-200 rounded-2xl overflow-hidden shadow-lg">
      {/* Search Header */}
      <div className="p-4 bg-base-300 border-b border-base-content/10">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Surah by name or number..."
            className="w-full px-4 py-3 pr-10 rounded-xl border border-white/10 bg-base-100 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        {/* Results count */}
        <div className="mt-2 text-sm text-base-content/60">
          {filteredSurahs.length} {filteredSurahs.length === 1 ? 'Surah' : 'Surahs'} found
        </div>
      </div>

      {/* Virtualized List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSurahs.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8 text-center">
            <div>
              <svg
                className="w-16 h-16 mx-auto mb-4 text-base-content/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-base-content/60">No Surahs found</p>
              <p className="text-sm text-base-content/40 mt-2">Try a different search term</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-base-content/5">
            {filteredSurahs.map((surah) => (
              <SurahListItem
                key={surah.id}
                surah={surah}
                onClick={() => handleSurahClick(surah)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SurahListItem = ({ surah, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-4 hover:bg-base-300 transition-all duration-200 flex items-center justify-between group cursor-pointer text-left"
    >
      {/* Left side - Number and Name */}
      <div className="flex items-center gap-4 flex-1">
        {/* Surah Number Badge */}
        <div className="w-12 h-12 flex items-center justify-center bg-primary/20 text-primary rounded-xl font-bold text-lg group-hover:bg-primary/30 transition-colors">
          {surah.id}
        </div>
        
        {/* Surah Names */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-base-content group-hover:text-primary transition-colors">
              {surah.name}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-base-300 text-base-content/60">
              {surah.revelation_type}
            </span>
          </div>
          <p className="text-sm text-base-content/60">
            {surah.english_meaning} • {surah.verses_count} verses
          </p>
        </div>
      </div>

      {/* Right side - Arabic Name */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-2xl font-arabic text-base-content" dir="rtl">
            {surah.name_ar}
          </p>
          <p className="text-xs text-base-content/50 mt-1">
            Juz {surah.juz_number}
          </p>
        </div>
        
        {/* Arrow Icon */}
        <svg
          className="w-5 h-5 text-base-content/40 group-hover:text-primary group-hover:translate-x-1 transition-all"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
};

export default VirtualizedSurahList;
