import React, { useMemo, useState } from 'react';
import type { FilterState } from './FilterSidebar';
import GridCard from './GridCard';
import ListCard from './ListCard';
import GridCumListCard from './GridCumListCard';

interface Props {
    recommendations: any[];
    filters: FilterState;
    importedData: any;
    selectedModel: 'v2' | 'v3';
    onModelChange: (model: 'v2' | 'v3') => void;
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

const Recommendations: React.FC<Props> = ({ recommendations, filters, importedData, selectedModel, onModelChange }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'grid-cum-list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);

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

    const itemsPerPage = viewMode === 'grid' ? 36 : 15;
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
        <div className="flex items-center justify-center gap-6 my-10 font-sans">
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
            <div className="flex items-center justify-between p-8">
                <div>
                    <h2 className="text-2xl font-bold text-[#9fadbd]">Recommendations</h2>
                    <p className="text-[#8ba0b2] text-sm mt-1">Showing {filteredList.length} of {recommendations.length} anime</p>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={selectedModel}
                        onChange={(e) => onModelChange(e.target.value as 'v2' | 'v3')}
                        className="bg-[#151f2e] text-[#9fadbd] text-sm font-bold px-3 py-2.5 rounded-md outline-hidden shadow-sm hover:text-white transition-colors cursor-pointer"
                    >
                        <option value="v2">CF_DAE_V2</option>
                        <option value="v3">CF_DAE_V3</option>
                    </select>

                    <div className="flex items-center gap-1 bg-[#151f2e] p-1 rounded-md shadow-sm">
                        <button
                        onClick={() => { setViewMode('grid'); setCurrentPage(1); }}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#3db4f2] text-white' : 'text-[#8ba0b2] hover:text-white hover:bg-[#1f293d]'} transition-colors`}
                        title="Grid View"
                    >
                        <GridIcon />
                    </button>
                    <button
                        onClick={() => { setViewMode('grid-cum-list'); setCurrentPage(1); }}
                        className={`p-2 rounded ${viewMode === 'grid-cum-list' ? 'bg-[#3db4f2] text-white' : 'text-[#8ba0b2] hover:text-white hover:bg-[#1f293d]'} transition-colors`}
                        title="Compact List View"
                    >
                        <GridCumListIcon />
                    </button>
                    <button
                        onClick={() => { setViewMode('list'); setCurrentPage(1); }}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#3db4f2] text-white' : 'text-[#8ba0b2] hover:text-white hover:bg-[#1f293d]'} transition-colors`}
                        title="List View"
                    >
                        <ListIcon />
                    </button>
                </div>
            </div>
        </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
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
                        <p className="text-[#8ba0b2] mt-2 text-sm">Try relaxing some of the sidebar constraints.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                                {currentItems.map((anime) => (
                                    <GridCard key={anime.idMal} anime={anime} />
                                ))}
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="flex flex-col gap-5">
                                {currentItems.map((anime) => (
                                    <ListCard key={anime.idMal} anime={anime} importedData={importedData} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5">
                                {currentItems.map((anime) => (
                                    <GridCumListCard key={anime.idMal} anime={anime} />
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
