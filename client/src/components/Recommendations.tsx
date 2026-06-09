import React, { useMemo, useState, useEffect } from 'react';
import type { FilterState } from './FilterSidebar';
import GridCard from './GridCard';
import ListCard from './ListCard';
import GridCumListCard from './GridCumListCard';
import SVG from './SVG';

interface Props {
    recommendations: any[];
    filters: FilterState;
    importedData: any;
    selectedModel: 'v2' | 'v3' | 'v4' | 'content';
    onModelChange: (model: 'v2' | 'v3' | 'v4' | 'content') => void;
    isRecommending?: boolean;
}

const GridIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

const ListIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

const GridCumListIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <line x1="14" y1="14" x2="21" y2="14"></line>
        <line x1="14" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="14" x2="10" y2="14"></line>
        <line x1="3" y1="18" x2="10" y2="18"></line>
    </svg>
);

const Recommendations: React.FC<Props> = ({ recommendations, filters, importedData, selectedModel, onModelChange, isRecommending }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'grid-cum-list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const userListIds = useMemo(() => {
        if (!importedData) return new Set<number>();
        const ids = new Set<number>();
        ['completed', 'current', 'planning', 'dropped', 'onHold'].forEach(status => {
            if (Array.isArray(importedData[status])) {
                importedData[status].forEach((item: any) => ids.add(item.id));
            }
        });
        return ids;
    }, [importedData]);

    const filteredList = useMemo(() => {
        return recommendations.filter(anime => {
            if (!anime || !anime.title) return false;

            if (filters.excludeList && userListIds.has(anime.idMal)) return false;

            if (filters.excludeSequels) {
                const edges = anime.relations?.edges || [];
                const isSequelOfList = edges.some((edge: any) => {
                    const relation = edge.relationType;
                    const relatedId = edge.node?.idMal;
                    if (!relatedId) return false;
                    if (['PREQUEL', 'SEQUEL', 'ALTERNATIVE', 'PARENT'].includes(relation)) {
                        return userListIds.has(relatedId);
                    }
                    return false;
                });
                if (isSequelOfList) return false;
            }

            if (filters.excludeAdult && anime.isAdult) return false;
            if (filters.formats.length > 0 && !filters.formats.includes(anime.format)) return false;
            if (filters.statuses.length > 0 && !filters.statuses.includes(anime.status)) return false;

            if (filters.genres.length > 0) {
                const hasAllGenres = filters.genres.every(g => anime.genres?.includes(g));
                if (!hasAllGenres) return false;
            }

            if (filters.tags.length > 0) {
                const animeTags = anime.tags?.map((t: any) => t.name) || [];
                const hasAllTags = filters.tags.every(t => animeTags.includes(t));
                if (!hasAllTags) return false;
            }

            if (filters.studios.length > 0) {
                const studios = anime.studios?.nodes?.map((s: any) => s.name) || [];
                const hasStudio = filters.studios.some(s => studios.includes(s));
                if (!hasStudio) return false;
            }

            if (filters.countries.length > 0 && !filters.countries.includes(anime.countryOfOrigin)) return false;

            if (anime.popularity < filters.popularityRange[0] || anime.popularity > filters.popularityRange[1]) return false;

            const score = anime.averageScore || 0;
            if (score < filters.scoreRange[0] || score > filters.scoreRange[1]) return false;

            const year = anime.startDate?.year;
            if (year) {
                if (year < filters.yearRange[0] || year > filters.yearRange[1]) return false;
            }

            return true;
        });
    }, [recommendations, filters, userListIds]);

    const itemsPerPage = isMobile
        ? (viewMode === 'grid' ? 18 : viewMode === 'grid-cum-list' ? 15 : 15)
        : (viewMode === 'grid' ? 36 : viewMode === 'grid-cum-list' ? 30 : 15);
    const totalPages = Math.ceil(filteredList.length / itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }

    const currentItems = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const PaginationControls = () => (
        <div className="flex items-center justify-center gap-6 mt-6 mb-24 sm:my-10 font-sans">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-5 py-2.5 bg-[#151f2e] hover:bg-[#1f293d] disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-[#8ba0b2] hover:text-white transition-colors shadow-sm font-semibold text-sm"
            >
                Previous
            </button>
            <span className="text-[#8ba0b2] text-sm">
                Page <span className="font-bold text-white">{currentPage}</span> of {totalPages || 1}
            </span>
            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-5 py-2.5 bg-[#151f2e] hover:bg-[#1f293d] disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-[#8ba0b2] hover:text-white transition-colors shadow-sm font-semibold text-sm"
            >
                Next
            </button>
        </div>
    );

    if (recommendations.length === 0) {
        return <div className="p-10 text-center text-[#8ba0b2] font-sans">No recommendations found.</div>;
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent font-sans">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between p-4 sm:p-8 gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#9fadbd]">Recommendations</h2>
                    <p className="text-[#8ba0b2] text-sm mt-1">Showing {filteredList.length} of {recommendations.length} anime</p>
                </div>

                <div className="flex flex-wrap items-center justify-end w-full xl:w-auto gap-3 sm:gap-4 mt-2 xl:mt-0">
                    <div 
                        className="relative flex items-center bg-[#151f2e]/60 hover:bg-[#1f293d] px-2 sm:px-3 rounded-md shadow-sm transition-colors cursor-pointer h-[36px] sm:h-[40px]"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        onMouseLeave={() => setIsModelDropdownOpen(false)}
                    >
                        {isRecommending && (
                            <SVG name="loader" size="" className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin text-[#60a5fa]" />
                        )}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-[#8ba0b2]">Model:</span>
                            <span className="text-xs sm:text-sm font-bold text-white leading-none pt-px">
                                {selectedModel === 'v2' ? 'V2' : selectedModel === 'v3' ? 'V3' : selectedModel === 'v4' ? 'V4 (Hybrid)' : 'Content AE'}
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8ba0b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {isModelDropdownOpen && (
                            <div className="absolute top-full right-0 xl:left-0 pt-2 min-w-full w-max z-30">
                                <div className="bg-[#0b172f]/80 backdrop-blur-md border border-[#1f293d] rounded-md shadow-[0_0_40px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col py-1">
                                    {[
                                        { id: 'v2', label: 'V2' },
                                        { id: 'v3', label: 'V3' },
                                        { id: 'v4', label: 'V4 (Hybrid)' },
                                        { id: 'content', label: 'Content AE' }
                                    ].map(option => (
                                        <div
                                            key={option.id}
                                            className={`px-4 py-2 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${selectedModel === option.id ? 'bg-[#60a5fa]/90 text-white' : 'text-[#8ba0b2] hover:bg-[#1f293d]/80 hover:text-white'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onModelChange(option.id as any);
                                                setIsModelDropdownOpen(false);
                                            }}
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-[#151f2e]/60 px-1 rounded-md shadow-sm h-[36px] sm:h-[40px]">
                        <button
                            onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
                            className={`w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] flex items-center justify-center rounded ${viewMode === 'grid' ? 'bg-[#60a5fa] text-white' : 'text-[#8ba0b2] hover:text-white hover:bg-[#1f293d]'} transition-colors`}
                            title="Grid View"
                        >
                            <GridIcon />
                        </button>
                        <button
                            onClick={() => { setViewMode('grid-cum-list'); setCurrentPage(1); }}
                            className={`w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] flex items-center justify-center rounded ${viewMode === 'grid-cum-list' ? 'bg-[#60a5fa] text-white' : 'text-[#8ba0b2] hover:text-white hover:bg-[#1f293d]'} transition-colors`}
                            title="Compact List View"
                        >
                            <GridCumListIcon />
                        </button>
                        <button
                            onClick={() => { setViewMode('list'); setCurrentPage(1); }}
                            className={`w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] flex items-center justify-center rounded ${viewMode === 'list' ? 'bg-[#60a5fa] text-white' : 'text-[#8ba0b2] hover:text-white hover:bg-[#1f293d]'} transition-colors`}
                            title="List View"
                        >
                            <ListIcon />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 custom-scrollbar">
                {filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="mb-4 text-[#8ba0b2]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M8 9.05v-.1"></path>
                                <path d="M16 9.05v-.1"></path>
                                <path d="M12 14a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-[#9fadbd]">No anime match your filters</h3>
                        <p className="text-[#8ba0b2] mt-2 text-sm">Maybe stop being so picky and touch some grass.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-8">
                                {currentItems.map((anime) => (
                                    <GridCard key={anime.idMal} anime={anime} importedData={importedData} />
                                ))}
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="flex flex-col gap-5">
                                {currentItems.map((anime) => (
                                    <ListCard key={anime.idMal} anime={anime} importedData={importedData} />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                                {currentItems.map((anime) => (
                                    <GridCumListCard key={anime.idMal} anime={anime} importedData={importedData} />
                                ))}
                            </div>
                        )}

                        <PaginationControls />
                    </>
                )}
            </div>
        </div>
    );
};

export default Recommendations;
