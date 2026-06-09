import React from 'react';
import { Link } from 'react-router-dom';
import SVG from './SVG';
import StatusOverlay from './StatusOverlay';
import { formatAbbreviateNumber } from '../utils/numberFormatting';
import { useAuth } from '../context/AuthContext';

interface Props {
    anime: any;
    importedData: any;
}

const GridCumListCard: React.FC<Props> = ({ anime, importedData }) => {
    const { loginType } = useAuth();
    const coverUrl = anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium;
    const linkUrl = loginType === 'AniList' ? `https://anilist.co/anime/${anime.id}` : `https://myanimelist.net/anime/${anime.idMal}`;
    const mainColor = anime.coverImage?.color || '#60a5fa';

    return (
        <a 
            href={linkUrl}
            target="_blank" 
            rel="noreferrer"
            className="flex relative rounded-xl overflow-hidden bg-[#11161d]/80 backdrop-blur-md p-3 sm:p-4 gap-3 sm:gap-5 transition-transform hover:scale-[1.02] shadow-lg h-[220px] sm:h-[310px]"
        >
            {/* Left Column */}
            <div className="flex flex-col gap-2 sm:gap-3 w-[90px] min-[400px]:w-[110px] sm:w-[150px] shrink-0 h-full">
                <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md group">
                    <img src={anime.coverImage?.large} alt={anime.title?.romaji} className="object-cover w-full h-full" loading="lazy" />

                    <StatusOverlay anime={anime} importedData={importedData} />
                </div>

                {/* Buttons Row */}
                <div className="flex gap-1.5 sm:gap-2 h-8 sm:h-10 shrink-0">
                    <a
                        href={`https://anilist.co/anime/${anime.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center bg-[#11161d] border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <SVG name="anilist" size="w-5 h-5" className="text-white" />
                    </a>
                    <a
                        href={`https://myanimelist.net/anime/${anime.idMal}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center bg-[#11161d] border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <SVG name="mal" size="w-9 h-9" className="text-white" viewBox="0 0 24 24" />
                    </a>
                </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col flex-1 py-1 min-w-0 min-h-0">
                <a
                    href={`https://myanimelist.net/anime/${anime.idMal}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline decoration-2 underline-offset-2 shrink-0"
                >
                    <h3 className="font-bold text-base min-[400px]:text-lg sm:text-2xl text-white truncate font-sans leading-tight">
                        {anime.title?.english || anime.title?.romaji}
                    </h3>
                </a>

                {(anime.title?.native || anime.title?.romaji) && (
                    <span
                        className="text-xs sm:text-sm italic font-medium mb-1.5 sm:mb-3 truncate shrink-0 pr-1"
                        style={{ color: mainColor }}
                    >
                        {anime.title?.romaji || anime.title?.native}
                    </span>
                )}

                <div
                    className="text-[#8ba0b2] text-[11px] sm:text-sm leading-relaxed overflow-y-auto custom-scrollbar-hidden mb-auto pr-2"
                    dangerouslySetInnerHTML={{ __html: anime.description ? anime.description.replace(/<br\s*\/?>/gi, ' ').replace(/[\r\n]+/g, ' ') : 'No synopsis available.' }}
                />

                {/* Info Row */}
                <div className="flex items-center gap-3 sm:gap-4 text-[#8ba0b2] text-xs sm:text-sm font-semibold mt-2 sm:mt-4 mb-2 sm:mb-3 flex-wrap shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${anime.status === 'RELEASING' ? 'bg-lime-400' :
                            anime.status === 'FINISHED' ? 'bg-blue-400' :
                                anime.status === 'CANCELLED' ? 'bg-red-400' :
                                    'bg-orange-300'
                            }`}></div>
                        <span>{anime.format || 'TV'}</span>
                    </div>
                    {anime.startDate?.year && <span>{anime.startDate?.year}</span>}
                    {anime.averageScore && (
                        <div className="flex items-center gap-1.5">
                            <SVG name="star" size="" className="w-4 h-4 flex-shrink-0 -ml-[1.5px]" style={{ color: 'currentColor' }} />
                            <span>{anime.averageScore}%</span>
                        </div>
                    )}
                    {anime.popularity && (
                        <div className="flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 640 512" fill="currentColor" style={{ color: 'currentColor' }}>
                                <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z" />
                            </svg>
                            <span>{formatAbbreviateNumber(anime.popularity)}</span>
                        </div>
                    )}
                    {anime.episodes && (
                        <div className="flex items-center gap-1.5">
                            <span>{anime.episodes} {anime.episodes === 1 ? 'ep' : 'eps'}</span>
                        </div>
                    )}
                </div>

                {/* Tags Row */}
                <div className="flex flex-wrap gap-1 sm:gap-1.5 shrink-0">
                    {Array.from(new Set([
                        ...(anime.genres || []),
                        ...(anime.tags || []).map((t: any) => t.name)
                    ]))
                        .slice(0, 3)
                        .map((name: string) => (
                            <span key={name}
                                className="text-[9px] sm:text-[11px] font-bold backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                                style={{
                                    backgroundColor: mainColor,
                                    color: '#11161d'
                                }}
                            >
                                {name}
                            </span>
                        ))}
                </div>
            </div>
        </a>
    );
};

export default GridCumListCard;
