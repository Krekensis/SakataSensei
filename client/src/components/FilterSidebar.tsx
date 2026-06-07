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
    formats: [],
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

const Checkbox = ({ checked }: { checked: boolean }) => (
    <div className={`w-4 h-4 flex-shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${checked ? 'bg-[#60a5fa] border-[#60a5fa]' : 'bg-[#0b1622] border-[#8ba0b2]/50 group-hover:border-[#8ba0b2]'}`}>
        {checked && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        )}
    </div>
);

const MultiSelect = ({ label, options, selected, onChange, isOpen, onToggle }: {
    label: string, options: string[], selected: string[],
    onChange: (vals: string[]) => void, isOpen: boolean,
    onToggle: () => void
}) => {

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
                className="min-h-[38px] bg-[#091224] rounded-md p-2 cursor-pointer flex flex-wrap gap-2 items-center justify-between transition-colors hover:bg-[#0b172f]"
                onClick={onToggle}
            >
                <div className="flex flex-wrap gap-1.5 flex-1">
                    {selected.length === 0 ? (
                        <span className="text-[#8ba0b2] text-sm ml-1">Any</span>
                    ) : (
                        selected.map(opt => (
                            <span key={opt} className="bg-[#151f2e] text-[#9fadbd] text-xs px-2 py-1 rounded flex items-center gap-1.5 hover:text-white transition-colors">
                                {opt}
                                <button onClick={(e) => removeOption(e, opt)} className="hover:text-white mt-0.5"><XIcon /></button>
                            </span>
                        ))
                    )}
                </div>
                <div className="text-[#8ba0b2] mr-1">
                    {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[#0b172f] backdrop-blur-md rounded-md shadow-xl max-h-60 overflow-y-auto custom-scrollbar border border-[#0b1622]">
                    {options.map(opt => (
                        <div
                            key={opt}
                            onClick={() => toggleOption(opt)}
                            className={`px-3 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-3 ${selected.includes(opt) ? 'bg-[#0b172f] text-white' : 'text-[#8ba0b2] hover:bg-[#0d1c3b] hover:text-white'}`}
                        >
                            <Checkbox checked={selected.includes(opt)} />
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const FilterSidebar: React.FC<Props> = ({ filters, setFilters, availableOptions }) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const handleToggle = (key: keyof FilterState) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key as keyof FilterState] }));
    };

    const handleRange = (key: keyof FilterState, val: number | number[]) => {
        if (Array.isArray(val)) {
            setFilters(prev => ({ ...prev, [key]: val as [number, number] }));
        }
    };

    return (
        <div className="w-full lg:w-[280px] flex-shrink-0 bg-transparent lg:border-r lg:border-white/10 p-6 h-full overflow-y-auto custom-scrollbar font-sans text-white">
            <h2 className="text-lg font-bold text-[#9fadbd] mb-6 tracking-wide">Filters</h2>

            {/* Toggles */}
            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleToggle('excludeList')}>
                    <Checkbox checked={filters.excludeList} />
                    <span className="text-sm text-[#8ba0b2] group-hover:text-white transition-colors">Exclude anime on my list</span>
                </div>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleToggle('excludeSequels')}>
                    <Checkbox checked={filters.excludeSequels} />
                    <span className="text-sm text-[#8ba0b2] group-hover:text-white transition-colors">Exclude sequels of my list</span>
                </div>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleToggle('excludeAdult')}>
                    <Checkbox checked={filters.excludeAdult} />
                    <span className="text-sm text-[#8ba0b2] group-hover:text-white transition-colors">Exclude adult content (18+)</span>
                </div>
            </div>

            {/* Multi-selects */}
            <div className="mb-8">
                <MultiSelect
                    label="Genres" options={availableOptions.genres}
                    selected={filters.genres} onChange={(v) => setFilters(p => ({ ...p, genres: v }))}
                    isOpen={openDropdown === 'Genres'} onToggle={() => setOpenDropdown(p => p === 'Genres' ? null : 'Genres')}
                />
                <MultiSelect
                    label="Tags" options={availableOptions.tags}
                    selected={filters.tags} onChange={(v) => setFilters(p => ({ ...p, tags: v }))}
                    isOpen={openDropdown === 'Tags'} onToggle={() => setOpenDropdown(p => p === 'Tags' ? null : 'Tags')}
                />
                <MultiSelect
                    label="Format" options={availableOptions.formats}
                    selected={filters.formats} onChange={(v) => setFilters(p => ({ ...p, formats: v }))}
                    isOpen={openDropdown === 'Format'} onToggle={() => setOpenDropdown(p => p === 'Format' ? null : 'Format')}
                />
                <MultiSelect
                    label="Status" options={availableOptions.statuses}
                    selected={filters.statuses} onChange={(v) => setFilters(p => ({ ...p, statuses: v }))}
                    isOpen={openDropdown === 'Status'} onToggle={() => setOpenDropdown(p => p === 'Status' ? null : 'Status')}
                />
                <MultiSelect
                    label="Studio" options={availableOptions.studios}
                    selected={filters.studios} onChange={(v) => setFilters(p => ({ ...p, studios: v }))}
                    isOpen={openDropdown === 'Studio'} onToggle={() => setOpenDropdown(p => p === 'Studio' ? null : 'Studio')}
                />
                <MultiSelect
                    label="Country" options={availableOptions.countries}
                    selected={filters.countries} onChange={(v) => setFilters(p => ({ ...p, countries: v }))}
                    isOpen={openDropdown === 'Country'} onToggle={() => setOpenDropdown(p => p === 'Country' ? null : 'Country')}
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
                        styles={{ track: { backgroundColor: '#60a5fa' }, handle: { borderColor: '#60a5fa', backgroundColor: '#fff', boxShadow: 'none' }, rail: { backgroundColor: '#0b1622' } }}
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
                        styles={{ track: { backgroundColor: '#60a5fa' }, handle: { borderColor: '#60a5fa', backgroundColor: '#fff', boxShadow: 'none' }, rail: { backgroundColor: '#0b1622' } }}
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
                        styles={{ track: { backgroundColor: '#60a5fa' }, handle: { borderColor: '#60a5fa', backgroundColor: '#fff', boxShadow: 'none' }, rail: { backgroundColor: '#0b1622' } }}
                    />
                </div>
            </div>
        </div>
    );
};
