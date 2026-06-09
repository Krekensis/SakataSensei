import React from 'react';
import StatusOverlay from './StatusOverlay';
import SVG from './SVG';
import { formatAbbreviateNumber } from '../utils/numberFormatting';
import { useAuth } from '../context/AuthContext';

interface Props {
    anime: any;
    importedData?: any;
}

const findAnimeInImportedData = (id: number, importedData: any) => {
    if (!importedData) return null;
    for (const status of ['completed', 'current', 'planning']) {
        if (importedData[status]) {
            const found = importedData[status].find((a: any) => a.id === id);
            if (found) return found;
        }
    }
    return null;
};

const ListCard: React.FC<Props> = ({ anime, importedData }) => {
    const { loginType } = useAuth();
    const linkUrl = loginType === 'AniList' ? `https://anilist.co/anime/${anime.id}` : `https://myanimelist.net/anime/${anime.idMal}`;

    return (
        <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-row relative rounded-md overflow-hidden bg-[#0d1525] shadow-md cursor-pointer h-auto sm:h-56 transition-colors p-2 sm:p-3"
        >
            {/* Banner Background */}
            {anime.bannerImage && (
                <>
                    <div
                        className="absolute inset-0 z-0 opacity-40 grayscale-0 sm:opacity-20 sm:grayscale bg-cover bg-center transition-all duration-300 sm:group-hover:grayscale-0 sm:group-hover:opacity-40"
                        style={{ backgroundImage: `url(${anime.bannerImage})` }}
                    />
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0d1525] via-[#0d1525]/70 to-transparent transition-colors duration-300" />
                </>
            )}

            <div className="w-[72px] sm:w-[135px] flex-shrink-0 relative min-h-[100px] sm:min-h-0 h-auto sm:h-full rounded shadow-sm overflow-hidden z-10 group/cover">
                <img src={anime.coverImage?.large} alt={anime.title?.romaji} className="object-cover w-full h-full" loading="lazy" />
                <StatusOverlay anime={anime} importedData={importedData} />
            </div>

            <div className="pl-3 sm:pl-5 py-0 sm:py-2 pr-1 sm:pr-2 flex flex-row flex-1 relative z-10 overflow-hidden gap-2 sm:gap-4">
                {/* Left Content */}
                <div className="flex flex-col h-full w-full sm:w-[70%] sm:pr-4 sm:border-r border-white/5">
                    <div className="flex flex-row justify-between items-start w-full gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0 flex flex-col shrink-0">
                            {anime.title?.native && (
                                <span className="hidden sm:block text-[9px] sm:text-[11px] text-[#8ba0b2] font-newtegomin mb-0.5 truncate opacity-70 group-hover:opacity-100 transition-opacity">
                                    {anime.title.native}
                                </span>
                            )}
                            <h3
                                className="font-bold text-[13px] sm:text-lg truncate font-sans leading-tight"
                                title={anime.title?.english || anime.title?.romaji}
                                style={{
                                    color: anime.coverImage?.color || '#60a5fa'
                                }}
                            >
                                {anime.title?.english || anime.title?.romaji}
                            </h3>
                            <div className="text-[9px] sm:text-xs font-semibold text-[#8ba0b2] mt-0.5 sm:mt-1 flex items-center gap-1 sm:gap-2 flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-visible custom-scrollbar-hidden w-full">
                                {anime.studios?.nodes?.[0]?.name && (
                                    <span className="font-bold whitespace-nowrap shrink-0">{anime.studios.nodes[0].name}</span>
                                )}
                                <span className="px-1 sm:px-1.5 py-0.5 whitespace-nowrap shrink-0">{anime.format || 'TV'}</span>
                                <span className="px-1 sm:px-1.5 py-0.5 whitespace-nowrap shrink-0">{anime.status ? anime.status.replace('_', ' ') : 'FINISHED'}</span>
                                {anime.startDate?.year && <span className="px-1 sm:px-1.5 py-0.5 whitespace-nowrap shrink-0">{anime.startDate?.year}</span>}
                                {anime.episodes && <span className="px-1 sm:px-1.5 py-0.5 whitespace-nowrap shrink-0">{anime.episodes} {anime.episodes === 1 ? 'ep' : 'eps'}</span>}
                            </div>
                        </div>

                        <div className="flex flex-col items-start justify-center gap-1 sm:gap-2 flex-shrink-0 bg-[#151f2e]/50 backdrop-blur-xs px-1.5 py-1 sm:px-3 sm:py-2 rounded w-[65px] sm:w-[85px]">
                            {anime.averageScore && (
                                <div className="text-[#9fadbd] text-[10px] sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                                    <div className="w-3 sm:w-4 flex justify-center">
                                        <SVG name="star" size="" className="w-2.5 h-2.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: anime.coverImage?.color || '#60a5fa' }} />
                                    </div>
                                    <span className="leading-none pt-[1px]">{anime.averageScore}%</span>
                                </div>
                            )}
                            {anime.popularity && (
                                <div className="text-[#9fadbd] text-[10px] sm:text-sm font-bold flex items-center gap-1 sm:gap-2">
                                    <div className="w-3 sm:w-4 flex justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 flex-shrink-0" viewBox="0 0 640 512" fill="currentColor" style={{ color: anime.coverImage?.color || '#60a5fa' }}>
                                            <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z" />
                                        </svg>
                                    </div>
                                    <span className="leading-none pt-[1px]">{formatAbbreviateNumber(anime.popularity)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        className="hidden sm:block mt-3 mb-2 text-[13px] text-[#8ba0b2] leading-relaxed overflow-y-auto custom-scrollbar-hidden flex-1"
                        dangerouslySetInnerHTML={{
                            __html: anime.description
                                ? anime.description.replace(/<br\s*\/?>/gi, ' ').replace(/[\r\n]+/g, ' ')
                                : 'No synopsis available.'
                        }}
                    />

                    <div className="mt-0.5 sm:mt-auto sm:pt-2 flex flex-wrap gap-1 sm:gap-1.5 shrink-0">
                        {Array.from(new Set([
                            ...(anime.genres || []),
                            ...(anime.tags || []).map((t: any) => t.name)
                        ]))
                            .slice(0, 6)
                            .map((name: string, idx: number) => (
                                <span key={name}
                                    className={`text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-full bg-[#22324a]/50 sm:bg-[var(--pill-bg)] text-[#8ba0b2] sm:text-[var(--pill-color)] backdrop-blur-xs ${idx >= 3 ? 'hidden sm:inline-block' : ''}`}
                                    style={{
                                        '--pill-bg': anime.coverImage?.color ? `${anime.coverImage.color}26` : '#60a5fa26',
                                        '--pill-color': anime.coverImage?.color || '#60a5fa'
                                    } as React.CSSProperties}
                                >
                                    {name}
                                </span>
                            ))}
                    </div>

                    {/* Mobile: Inline "Because you liked" */}
                    {anime.reasons && anime.reasons.length > 0 && importedData && (
                        <div className="sm:hidden mt-auto pt-3 flex flex-col gap-1 w-full min-w-0">
                            <span className="text-[8px] uppercase font-bold tracking-wider text-[#8ba0b2]">Because you liked:</span>
                            <div className="flex flex-row gap-1.5 overflow-x-auto custom-scrollbar-hidden w-full">
                                {anime.reasons.map((reasonId: number) => {
                                    const reasonAnime = findAnimeInImportedData(reasonId, importedData);
                                    if (!reasonAnime) return null;
                                    if (reasonAnime.isAdult) return null;
                                    return reasonAnime;
                                }).filter(Boolean).slice(0, 2).map((reasonAnime: any) => (
                                    <div key={reasonAnime.id} className="flex items-center gap-1.5 bg-[#151f2e]/50 backdrop-blur-xs rounded pr-1.5 shrink-0 max-w-[120px]">
                                        <img src={reasonAnime.imageUrl} className="w-6 h-6 rounded-l-[3px] object-cover shrink-0" loading="lazy" />
                                        <span className="text-[9px] font-bold text-[#9fadbd] truncate leading-snug" title={reasonAnime.englishTitle || reasonAnime.title}>
                                            {reasonAnime.englishTitle || reasonAnime.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right 30% (Hidden on mobile) */}
                <div className="hidden sm:flex flex-col w-[30%] h-full items-start min-w-0">
                    {anime.reasons && anime.reasons.length > 0 && importedData && (
                        <div className="flex flex-col w-full h-full min-w-0">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8ba0b2] ml-0.5 mb-1.5 shrink-0">Because you liked:</span>
                            <div className="flex flex-col gap-1.5 w-full min-w-0 flex-1 justify-between">
                                {anime.reasons.map((reasonId: number) => {
                                    const reasonAnime = findAnimeInImportedData(reasonId, importedData);
                                    if (!reasonAnime) return null;
                                    if (reasonAnime.isAdult) return null;
                                    return reasonAnime;
                                }).filter(Boolean).slice(0, 3).map((reasonAnime: any) => (
                                    <div key={reasonAnime.id} className="flex items-center gap-2.5 bg-[#151f2e]/50 backdrop-blur-xs rounded py-1 px-1.5 min-w-0 w-full">
                                        <img src={reasonAnime.imageUrl} className="w-7 h-10 rounded-[3px] object-cover flex-shrink-0" loading="lazy" />
                                        <span className="text-[11px] font-bold text-[#9fadbd] line-clamp-2 flex-1 leading-snug" title={reasonAnime.englishTitle || reasonAnime.title}>
                                            {reasonAnime.englishTitle || reasonAnime.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </a>
    );
};

export default ListCard;
