import React, { useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export interface FilterState {
    excludeList: boolean;
    excludeSequels: boolean;
    excludeAdult: boolean;
    genres: string[];
    tags: string[];
    formats: string[];
    statuses: string[];
    countries: string[];
    studios: string[];
    popularityRange: [number, number];
    scoreRange: [number, number];
    yearRange: [number, number];
}

export const defaultFilters: FilterState = {
    excludeList: true,
    excludeSequels: true,
    excludeAdult: true,
    genres: [],
    tags: [],
    formats: ['TV', 'MOVIE'],
    statuses: [],
    countries: [],
    studios: [],
    popularityRange: [0, 2000000],
    scoreRange: [0, 100],
    yearRange: [1940, 2027],
};

interface Props {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    availableOptions: {
        genres: string[];
        tags: string[];
        formats: string[];
        statuses: string[];
        countries: string[];
        studios: string[];
        maxPop: number;
    };
}

const ChevronDownIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const ChevronUpIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
);

const XIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const MultiSelect = ({ label, options, selected, onChange }: { label: string, options: string[], selected: string[], onChange: (vals: string[]) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(o => o !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    const removeOption = (e: React.MouseEvent, opt: string) => {
        e.stopPropagation();
        onChange(selected.filter(o => o !== opt));
    };

    return (
        <div className="mb-4 relative">
            <label className="block text-xs font-semibold text-[#8ba0b2] mb-1.5 uppercase tracking-wide">{label}</label>
            <div
                className="min-h-[38px] bg-[#0b1622] rounded-md p-2 cursor-pointer flex flex-wrap gap-2 items-center justify-between transition-colors hover:bg-[#111c29]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1.5 flex-1">
                    {selected.length === 0 ? (
                        <span className="text-[#8ba0b2] text-sm ml-1">Any</span>
                    ) : (
                        selected.map(opt => (
                            <span key={opt} className="bg-[#151f2e] text-[#9fadbd] text-xs px-2 py-1 rounded flex items-center gap-1.5 hover:text-white transition-colors">
                                {opt}
                                <button onClick={(e) => removeOption(e, opt)} className="hover:text-red-400 mt-0.5"><XIcon /></button>
                            </span>
                        ))
                    )}
                </div>
                <div className="text-[#8ba0b2] mr-1">
                    {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[#151f2e] rounded-md shadow-xl max-h-60 overflow-y-auto custom-scrollbar border border-[#0b1622]">
                    {options.map(opt => (
                        <div
                            key={opt}
                            onClick={() => toggleOption(opt)}
                            className={`px-3 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-3 ${selected.includes(opt) ? 'bg-[#0b1622] text-white' : 'text-[#8ba0b2] hover:bg-[#0b1622] hover:text-white'}`}
                        >
                            <input type="checkbox" checked={selected.includes(opt)} readOnly className="accent-[#3db4f2] w-3.5 h-3.5 rounded-sm" />
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const FilterSidebar: React.FC<Props> = ({ filters, setFilters, availableOptions }) => {

    const handleToggle = (key: keyof FilterState) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key as keyof FilterState] }));
    };

    const handleRange = (key: keyof FilterState, val: number | number[]) => {
        if (Array.isArray(val)) {
            setFilters(prev => ({ ...prev, [key]: val as [number, number] }));
        }
    };

    return (
        <div className="rounded-md w-full lg:w-[280px] flex-shrink-0 bg-[#151f2e] p-6 h-full overflow-y-auto custom-scrollbar font-sans text-white">
            <h2 className="text-lg font-bold text-[#9fadbd] mb-6 tracking-wide">Filters</h2>

            {/* Toggles */}
            <div className="space-y-4 mb-8">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={filters.excludeList} onChange={() => handleToggle('excludeList')} className="accent-[#3db4f2] w-4 h-4 rounded-sm" />
                    <span className="text-sm text-[#8ba0b2] group-hover:text-white transition-colors">Exclude anime on my list</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={filters.excludeSequels} onChange={() => handleToggle('excludeSequels')} className="accent-[#3db4f2] w-4 h-4 rounded-sm" />
                    <span className="text-sm text-[#8ba0b2] group-hover:text-white transition-colors">Exclude sequels of my list</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={filters.excludeAdult} onChange={() => handleToggle('excludeAdult')} className="accent-[#3db4f2] w-4 h-4 rounded-sm" />
                    <span className="text-sm text-[#8ba0b2] group-hover:text-white transition-colors">Exclude adult content (18+)</span>
                </label>
            </div>

            {/* Multi-selects */}
            <div className="mb-8">
                <MultiSelect
                    label="Genres" options={availableOptions.genres}
                    selected={filters.genres} onChange={(v) => setFilters(p => ({ ...p, genres: v }))}
                />
                <MultiSelect
                    label="Tags" options={availableOptions.tags}
                    selected={filters.tags} onChange={(v) => setFilters(p => ({ ...p, tags: v }))}
                />
                <MultiSelect
                    label="Format" options={availableOptions.formats}
                    selected={filters.formats} onChange={(v) => setFilters(p => ({ ...p, formats: v }))}
                />
                <MultiSelect
                    label="Status" options={availableOptions.statuses}
                    selected={filters.statuses} onChange={(v) => setFilters(p => ({ ...p, statuses: v }))}
                />
                <MultiSelect
                    label="Studio" options={availableOptions.studios}
                    selected={filters.studios} onChange={(v) => setFilters(p => ({ ...p, studios: v }))}
                />
                <MultiSelect
                    label="Country" options={availableOptions.countries}
                    selected={filters.countries} onChange={(v) => setFilters(p => ({ ...p, countries: v }))}
                />
            </div>

            {/* Sliders */}
            <div className="space-y-8 pb-10">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-[#8ba0b2] uppercase tracking-wide">Popularity</label>
                        <span className="text-xs text-[#9fadbd]">
                            {filters.popularityRange[0] >= 1000 ? (filters.popularityRange[0] / 1000).toFixed(0) + 'k' : filters.popularityRange[0]} -
                            {filters.popularityRange[1] >= 1000 ? (filters.popularityRange[1] / 1000).toFixed(0) + 'k' : filters.popularityRange[1]}
                        </span>
                    </div>
                    <Slider
                        range min={0} max={availableOptions.maxPop} step={1000}
                        value={filters.popularityRange} onChange={(v) => handleRange('popularityRange', v)}
                        styles={{ track: { backgroundColor: '#3db4f2' }, handle: { borderColor: '#3db4f2', backgroundColor: '#fff', boxShadow: 'none' }, rail: { backgroundColor: '#0b1622' } }}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-[#8ba0b2] uppercase tracking-wide">User Score</label>
                        <span className="text-xs text-[#9fadbd]">
                            {filters.scoreRange[0]}% - {filters.scoreRange[1]}%
                        </span>
                    </div>
                    <Slider
                        range min={0} max={100} step={1}
                        value={filters.scoreRange} onChange={(v) => handleRange('scoreRange', v)}
                        styles={{ track: { backgroundColor: '#3db4f2' }, handle: { borderColor: '#3db4f2', backgroundColor: '#fff', boxShadow: 'none' }, rail: { backgroundColor: '#0b1622' } }}
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold text-[#8ba0b2] uppercase tracking-wide">Year</label>
                        <span className="text-xs text-[#9fadbd]">
                            {filters.yearRange[0]} - {filters.yearRange[1]}
                        </span>
                    </div>
                    <Slider
                        range min={1940} max={2027} step={1}
                        value={filters.yearRange} onChange={(v) => handleRange('yearRange', v)}
                        styles={{ track: { backgroundColor: '#3db4f2' }, handle: { borderColor: '#3db4f2', backgroundColor: '#fff', boxShadow: 'none' }, rail: { backgroundColor: '#0b1622' } }}
                    />
                </div>
            </div>
        </div>
    );
};
