// QuranSearch.jsx - Advanced Quran search component with RTL support
import React, { useState, useEffect } from "react";
import { surahs } from "../data/surahs.js";

const SearchResultCard = ({ result }) => (
    <div className="bg-base-100 rounded-xl p-6 border border-white/10 hover:border-primary/30 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                    {result.surah_name_ar}
                </span>
                <span className="text-base-content/60 text-sm">Verse {result.verse_number}</span>
            </div>
            <span className="bg-secondary/20 text-secondary px-2 py-1 rounded text-xs">
                Juz {result.juz_number}
            </span>
        </div>

        <div className="space-y-4">
            <div className="text-right">
                <p
                    className="text-2xl font-arabic leading-relaxed text-base-content mb-3"
                    dir="rtl"
                >
                    {result.arabic_text}
                </p>
            </div>

            <div className="border-t border-base-300 pt-3">
                <p className="text-base-content/80 leading-relaxed">{result.translation}</p>
            </div>

            <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-base-content/60">
                    {result.surah_name} ({result.surah_id})
                </span>
                <button
                    className="btn btn-sm btn-outline btn-primary"
                    onClick={() => {
                        // Navigate to reader
                        window.location.href = `/quran/read?surah=${result.surah_id}&verse=${result.verse_number}`;
                    }}
                >
                    Read Context
                </button>
            </div>
        </div>
    </div>
);

const QuranSearch = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchType, setSearchType] = useState("fulltext");
    const [language, setLanguage] = useState("both");
    const [selectedSurah, setSelectedSurah] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchError, setSearchError] = useState("");

    const performSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchError("");

        try {
            const params = new URLSearchParams({
                q: searchQuery.trim(),
                type: searchType,
                language: language,
                page: currentPage.toString(),
                limit: "10",
            });

            if (selectedSurah !== "all") {
                params.append("surah", selectedSurah);
            }

            const response = await fetch(`http://127.0.0.1:8000/api/quran/search?${params}`);

            if (!response.ok) {
                throw new Error("Search request failed");
            }

            const data = await response.json();
            setSearchResults(data.results || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.error("Search error:", error);
            setSearchError("Failed to perform search. Please try again.");
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (searchQuery.trim()) {
            const timeoutId = setTimeout(() => {
                setCurrentPage(1);
                performSearch();
            }, 300);

            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
            setTotalPages(0);
        }
    }, [searchQuery, searchType, language, selectedSurah]);

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        performSearch();
    };

    const loadPage = (page) => {
        setCurrentPage(page);
        performSearch();
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-8">
                <div className="bg-base-200 rounded-2xl p-6 shadow-lg">
                    {/* Main Search Input */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search the Quran..."
                            className="w-full px-6 py-4 pr-12 text-lg rounded-xl border border-white/10 bg-base-100 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            dir={searchQuery.match(/[\u0600-\u06FF]/) ? "rtl" : "ltr"}
                        />
                        <button
                            type="submit"
                            disabled={!searchQuery.trim() || isSearching}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-primary btn-circle"
                        >
                            {isSearching ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <svg
                                    className="w-5 h-5"
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
                            )}
                        </button>
                    </div>

                    {/* Search Options */}
                    <div className="grid md:grid-cols-3 gap-4">
                        {/* Search Type */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Search Type</span>
                            </label>
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="select select-bordered select-sm bg-base-100 border-white/10"
                            >
                                <option value="fulltext">Full Text</option>
                                <option value="exact">Exact Phrase</option>
                                <option value="translation">Translation</option>
                                <option value="arabic">Arabic Only</option>
                            </select>
                        </div>

                        {/* Language Filter */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Language</span>
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="select select-bordered select-sm bg-base-100 border-white/10"
                            >
                                <option value="both">Both Languages</option>
                                <option value="arabic">Arabic</option>
                                <option value="english">English</option>
                            </select>
                        </div>

                        {/* Surah Filter */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Surah</span>
                            </label>
                            <select
                                value={selectedSurah}
                                onChange={(e) => setSelectedSurah(e.target.value)}
                                className="select select-bordered select-sm bg-base-100 border-white/10"
                            >
                                {surahs.map((surah) => (
                                    <option key={surah.id} value={surah.id}>
                                        {surah.name} ({surah.name_ar})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </form>

            {/* Search Error */}
            {searchError && (
                <div className="alert alert-error mb-6">
                    <svg
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span>{searchError}</span>
                </div>
            )}

            {/* Search Results */}
            {searchQuery && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-base-content">
                            Search Results
                            {searchResults.length > 0 && (
                                <span className="text-base-content/60 font-normal ml-2">
                                    ({searchResults.length} results)
                                </span>
                            )}
                        </h2>

                        {isSearching && <div className="loading loading-spinner loading-sm"></div>}
                    </div>

                    {/* Results Grid */}
                    {searchResults.length > 0 ? (
                        <div className="space-y-4">
                            {searchResults.map((result) => (
                                <SearchResultCard
                                    key={`${result.surah_id}-${result.verse_number}`}
                                    result={result}
                                />
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center mt-8">
                                    <div className="btn-group">
                                        <button
                                            className="btn btn-outline btn-sm"
                                            disabled={currentPage === 1}
                                            onClick={() => loadPage(currentPage - 1)}
                                        >
                                            Previous
                                        </button>

                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const page = i + 1;
                                            return (
                                                <button
                                                    key={page}
                                                    className={`btn btn-sm ${currentPage === page ? "btn-primary" : "btn-outline"}`}
                                                    onClick={() => loadPage(page)}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}

                                        <button
                                            className="btn btn-outline btn-sm"
                                            disabled={currentPage === totalPages}
                                            onClick={() => loadPage(currentPage + 1)}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : !isSearching ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-10 h-10 text-base-content/40"
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
                            <h3 className="text-xl font-semibold text-base-content mb-2">
                                No results found
                            </h3>
                            <p className="text-base-content/60 mb-4">
                                Try adjusting your search terms, language, or filters
                            </p>
                            <div className="space-y-2 text-sm text-base-content/50">
                                <p>• Use different keywords or phrases</p>
                                <p>• Try searching in Arabic or English only</p>
                                <p>• Select a specific Surah to narrow your search</p>
                                <p>• Use exact phrase search for precise results</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Quick Tips */}
            {!searchQuery && (
                <div className="bg-base-200/50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-base-content mb-4">Search Tips</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <p className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                <strong>Arabic Search:</strong> ابحث باللغة العربية
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                <strong>Exact Phrase:</strong> "put quotes around phrases"
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                <strong>Translation:</strong> Search meaning in English
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                                <strong>Full Text:</strong> Search across entire Quran
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                                <strong>Surah Filter:</strong> Limit search to specific chapters
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                                <strong>RTL Support:</strong> Automatic right-to-left for Arabic
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuranSearch;
